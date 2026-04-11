// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import type { TransactionsSyncResponse } from "plaid"
import { db } from "@/lib/db"
import {
	accounts,
	connections,
	institutions,
	transactions,
} from "@/lib/db/schema"

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
	plaidInstitution: {
		plaidInstitutionId: string
		plaidInstitutionName: string
		plaidInstitutionLogo: string | null
		plaidInstitutionUrl: string | null
	},
	plaidConnection: {
		plaidAccessToken: string
		plaidItemId: string
	},
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

function toTransactionFields(t: TransactionsSyncResponse["added"][number]) {
	return {
		plaidName: t.name,
		plaidMerchantName: t.merchant_name ?? null,
		plaidCurrencyCode: t.iso_currency_code ?? null,
		plaidAmount: t.amount.toString(),
		plaidDate: t.date,
		plaidAuthorizedDate: t.authorized_date ?? null,
		plaidPending: t.pending,
		plaidPaymentChannel: t.payment_channel,
		plaidPersonalFinanceCategoryPrimary:
			t.personal_finance_category?.primary ?? null,
		plaidPersonalFinanceCategoryDetailed:
			t.personal_finance_category?.detailed ?? null,
		plaidPersonalFinanceCategoryConfidenceLevel:
			t.personal_finance_category?.confidence_level ?? null,
	}
}

export async function syncAccountsAndTransactions(
	connectionId: string,
	plaidAccounts: {
		plaidAccountId: string
		plaidAccountName: string
		plaidAccountType: string
		plaidAccountSubtype: string | null
		plaidAccountMask: string | null
		plaidCurrencyCode: string | null
		plaidCurrentBalance: string
		plaidAvailableBalance: string | null
	}[],
	added: TransactionsSyncResponse["added"],
	modified: TransactionsSyncResponse["modified"],
	removed: TransactionsSyncResponse["removed"],
	cursor: string | undefined,
) {
	return db.transaction(async (tx) => {
		// Sync accounts.
		const existingAccounts = await tx
			.select({ plaidAccountId: accounts.plaidAccountId })
			.from(accounts)
			.where(eq(accounts.connectionId, connectionId))
		const existingAccountIds = new Set(
			existingAccounts.map((a) => a.plaidAccountId),
		)

		let createdAccountsCount = 0
		let updatedAccountsCount = 0

		for (const plaidAccount of plaidAccounts) {
			const { plaidAccountId, ...accountFields } = plaidAccount
			await tx
				.insert(accounts)
				.values({
					accountId: randomUUID(),
					connectionId,
					plaidAccountId,
					...accountFields,
				})
				.onConflictDoUpdate({
					target: accounts.plaidAccountId,
					set: {
						...accountFields,
						updatedAt: new Date(),
					},
				})

			if (existingAccountIds.has(plaidAccountId)) {
				updatedAccountsCount++
			} else {
				createdAccountsCount++
			}
		}

		// Build account ID map.
		const accountRows = await tx
			.select()
			.from(accounts)
			.where(eq(accounts.connectionId, connectionId))
		const accountIdMap = new Map(
			accountRows.map((a) => [a.plaidAccountId, a.accountId]),
		)

		// Sync transactions.
		let createdTransactionsCount = 0
		let updatedTransactionsCount = 0
		let deletedTransactionsCount = 0

		for (const t of added) {
			const accountId = accountIdMap.get(t.account_id)
			if (!accountId) continue
			await tx
				.insert(transactions)
				.values({
					transactionId: randomUUID(),
					accountId,
					plaidTransactionId: t.transaction_id,
					...toTransactionFields(t),
				})
				.onConflictDoUpdate({
					target: transactions.plaidTransactionId,
					set: { ...toTransactionFields(t), updatedAt: new Date() },
				})
			createdTransactionsCount++
		}

		for (const t of modified) {
			await tx
				.update(transactions)
				.set({ ...toTransactionFields(t), updatedAt: new Date() })
				.where(eq(transactions.plaidTransactionId, t.transaction_id))
			updatedTransactionsCount++
		}

		for (const t of removed) {
			await tx
				.delete(transactions)
				.where(eq(transactions.plaidTransactionId, t.transaction_id))
			deletedTransactionsCount++
		}

		// Update cursor.
		await tx
			.update(connections)
			.set({ plaidCursor: cursor, updatedAt: new Date() })
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
