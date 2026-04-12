// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	accounts,
	connections,
	institutions,
	transactions,
} from "@/lib/db/schema"

// --------------------------------------------------------------------------------
// Types.
// --------------------------------------------------------------------------------

type PlaidInstitution = {
	plaidInstitutionId: string
	plaidInstitutionName: string
	plaidInstitutionLogo: string | null
	plaidInstitutionUrl: string | null
}

type PlaidConnection = {
	plaidAccessToken: string
	plaidItemId: string
}

type PlaidAccount = {
	plaidAccountId: string
	plaidAccountName: string
	plaidAccountType: string
	plaidAccountSubtype: string | null
	plaidAccountMask: string | null
	plaidCurrencyCode: string | null
	plaidCurrentBalance: string
	plaidAvailableBalance: string | null
}

type PlaidTransaction = {
	plaidAccountId: string
	plaidTransactionId: string
	plaidName: string
	plaidMerchantName: string | null
	plaidCurrencyCode: string | null
	plaidAmount: string
	plaidDate: string
	plaidAuthorizedDate: string | null
	plaidPending: boolean
	plaidPaymentChannel: string
	plaidPersonalFinanceCategoryPrimary: string | null
	plaidPersonalFinanceCategoryDetailed: string | null
	plaidPersonalFinanceCategoryConfidenceLevel: string | null
}

// --------------------------------------------------------------------------------
// Get all connections.
// --------------------------------------------------------------------------------

export async function getConnections() {
	return db.select().from(connections)
}

// --------------------------------------------------------------------------------
// Create an institution and connection.
// --------------------------------------------------------------------------------

export async function createInstitutionAndConnection(
	plaidInstitution: PlaidInstitution,
	plaidConnection: PlaidConnection,
) {
	// Generate UUIDs.
	const institutionId = randomUUID()
	const connectionId = randomUUID()

	// Insert institution and connection.
	await db.transaction(async (tx) => {
		await tx.insert(institutions).values({ institutionId, ...plaidInstitution })
		await tx
			.insert(connections)
			.values({ connectionId, institutionId, ...plaidConnection })
	})

	// Return the connection ID.
	return connectionId
}

// --------------------------------------------------------------------------------
// Sync all accounts and transactions.
// --------------------------------------------------------------------------------

export async function syncAccountsAndTransactions(
	connectionId: string,
	plaidAccounts: PlaidAccount[],
	createdPlaidTransactions: PlaidTransaction[],
	updatedPlaidTransactions: PlaidTransaction[],
	deletedPlaidTransactionIds: string[],
	plaidCursor: string | undefined,
) {
	return db.transaction(async (tx) => {
		// Plaid account ID to account map.
		const plaidAccountIdToAccountMap = new Map(
			(
				await tx
					.select()
					.from(accounts)
					.where(eq(accounts.connectionId, connectionId))
			).map((account) => [account.plaidAccountId, account]),
		)

		// Sync accounts.
		let createdAccountsCount = 0
		let updatedAccountsCount = 0

		for (const plaidAccount of plaidAccounts) {
			const { plaidAccountId, ...accountFields } = plaidAccount
			const account = plaidAccountIdToAccountMap.get(plaidAccountId)

			if (!account) {
				const createdAccountId = randomUUID()
				await tx.insert(accounts).values({
					connectionId,
					accountId: createdAccountId,
					plaidAccountId,
					...accountFields,
				})

				plaidAccountIdToAccountMap.set(plaidAccountId, {
					connectionId,
					accountId: createdAccountId,
					...plaidAccount,
					createdAt: new Date(),
					updatedAt: new Date(),
				})

				createdAccountsCount++
			} else {
				const accountUpdated = Object.entries(accountFields).some(
					([key, value]) => account[key as keyof typeof account] !== value,
				)

				if (accountUpdated) {
					await tx
						.update(accounts)
						.set({ ...accountFields, updatedAt: new Date() })
						.where(eq(accounts.plaidAccountId, plaidAccountId))

					updatedAccountsCount++
				}
			}
		}

		// Sync transactions.
		let createdTransactionsCount = 0
		let updatedTransactionsCount = 0
		let deletedTransactionsCount = 0

		// Create transactions.
		for (const createdPlaidTransaction of createdPlaidTransactions) {
			const { plaidAccountId, plaidTransactionId, ...transactionFields } =
				createdPlaidTransaction
			const accountId =
				plaidAccountIdToAccountMap.get(plaidAccountId)?.accountId

			if (!accountId) {
				console.warn(
					`No plaidAccountId ${plaidAccountId} in the database for plaidTransactionId ${plaidTransactionId}.`,
				)
				continue
			}

			await tx
				.insert(transactions)
				.values({
					accountId,
					transactionId: randomUUID(),
					plaidAccountId,
					plaidTransactionId,
					...transactionFields,
				})
				.onConflictDoUpdate({
					target: transactions.plaidTransactionId,
					set: { ...transactionFields, updatedAt: new Date() },
				})

			createdTransactionsCount++
		}

		// Update transactions.
		for (const updatedPlaidTransaction of updatedPlaidTransactions) {
			const { plaidAccountId, plaidTransactionId, ...transactionFields } =
				updatedPlaidTransaction

			await tx
				.update(transactions)
				.set({ ...transactionFields, updatedAt: new Date() })
				.where(
					and(
						eq(transactions.plaidTransactionId, plaidTransactionId),
						eq(transactions.plaidAccountId, plaidAccountId),
					),
				)

			updatedTransactionsCount++
		}

		// Delete transactions.
		for (const deletedPlaidTransactionId of deletedPlaidTransactionIds) {
			await tx
				.delete(transactions)
				.where(eq(transactions.plaidTransactionId, deletedPlaidTransactionId))

			deletedTransactionsCount++
		}

		// Update cursor.
		await tx
			.update(connections)
			.set({ plaidCursor, updatedAt: new Date() })
			.where(eq(connections.connectionId, connectionId))

		return {
			createdAccountsCount,
			updatedAccountsCount,
			createdTransactionsCount,
			updatedTransactionsCount,
			deletedTransactionsCount,
		}
	})
}

// --------------------------------------------------------------------------------
