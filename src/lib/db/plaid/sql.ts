// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
	accounts,
	connections,
	institutions,
	transactions,
} from "@/lib/db/schema"
import type { plaidClient } from "@/lib/plaid"

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
	institution: {
		plaidInstitutionId: string
		plaidInstitutionName: string
		plaidInstitutionLogo: string | null
		plaidInstitutionUrl: string | null
	},
	connection: {
		plaidAccessToken: string
		plaidItemId: string
	},
) {
	// Generate UUIDs.
	const institutionId = randomUUID()
	const connectionId = randomUUID()

	// Insert institution and connection.
	await db.transaction(async (tx) => {
		await tx.insert(institutions).values({ institutionId, ...institution })
		await tx
			.insert(connections)
			.values({ connectionId, institutionId, ...connection })
	})

	// Return the connection ID.
	return connectionId
}

// --------------------------------------------------------------------------------
// Sync all the accounts and transactions.
// --------------------------------------------------------------------------------

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

type PlaidAccounts = Awaited<
	ReturnType<typeof plaidClient.accountsGet>
>["data"]["accounts"]

export type PlaidTransactionsSyncResponse = Awaited<
	ReturnType<typeof plaidClient.transactionsSync>
>["data"]

function toTransactionFields(
	t: PlaidTransactionsSyncResponse["added"][number],
) {
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

async function syncAccounts(
	tx: Tx,
	connectionId: string,
	plaidAccounts: PlaidAccounts,
): Promise<{
	numberOfCreatedAccounts: number
	numberOfUpdatedAccounts: number
	accountIdMap: Map<string, string>
}> {
	const existing = await tx
		.select({ plaidAccountId: accounts.plaidAccountId })
		.from(accounts)
		.where(eq(accounts.connectionId, connectionId))
	const existingIds = new Set(existing.map((a) => a.plaidAccountId))

	let numberOfCreatedAccounts = 0
	let numberOfUpdatedAccounts = 0

	for (const a of plaidAccounts) {
		await tx
			.insert(accounts)
			.values({
				accountId: randomUUID(),
				connectionId,
				plaidAccountId: a.account_id,
				plaidAccountName: a.name,
				plaidAccountType: a.type,
				plaidAccountSubtype: a.subtype ?? null,
				plaidAccountMask: a.mask ?? null,
				plaidCurrencyCode: a.balances.iso_currency_code ?? null,
				plaidCurrentBalance: a.balances.current?.toString() ?? "0",
				plaidAvailableBalance: a.balances.available?.toString() ?? null,
			})
			.onConflictDoUpdate({
				target: accounts.plaidAccountId,
				set: {
					plaidAccountName: a.name,
					plaidAccountType: a.type,
					plaidAccountSubtype: a.subtype ?? null,
					plaidAccountMask: a.mask ?? null,
					plaidCurrencyCode: a.balances.iso_currency_code ?? null,
					plaidCurrentBalance: a.balances.current?.toString() ?? "0",
					plaidAvailableBalance: a.balances.available?.toString() ?? null,
					updatedAt: new Date(),
				},
			})

		if (existingIds.has(a.account_id)) {
			numberOfUpdatedAccounts++
		} else {
			numberOfCreatedAccounts++
		}
	}

	const accountRows = await tx
		.select()
		.from(accounts)
		.where(eq(accounts.connectionId, connectionId))
	const accountIdMap = new Map(
		accountRows.map((a) => [a.plaidAccountId, a.accountId]),
	)

	return {
		numberOfCreatedAccounts: numberOfCreatedAccounts,
		numberOfUpdatedAccounts: numberOfUpdatedAccounts,
		accountIdMap,
	}
}

async function syncTransactions(
	tx: Tx,
	accountIdMap: Map<string, string>,
	added: PlaidTransactionsSyncResponse["added"],
	modified: PlaidTransactionsSyncResponse["modified"],
	removed: PlaidTransactionsSyncResponse["removed"],
): Promise<{
	numberOfCreatedTransactions: number
	numberOfUpdatedTransactions: number
	numberOfDeletedTransactions: number
}> {
	let numberOfCreatedTransactions = 0
	let numberOfUpdatedTransactions = 0
	let numberOfDeletedTransactions = 0

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
		numberOfCreatedTransactions++
	}

	for (const t of modified) {
		await tx
			.update(transactions)
			.set({ ...toTransactionFields(t), updatedAt: new Date() })
			.where(eq(transactions.plaidTransactionId, t.transaction_id))
		numberOfUpdatedTransactions++
	}

	for (const t of removed) {
		await tx
			.delete(transactions)
			.where(eq(transactions.plaidTransactionId, t.transaction_id))
		numberOfDeletedTransactions++
	}

	return {
		numberOfCreatedTransactions,
		numberOfUpdatedTransactions,
		numberOfDeletedTransactions,
	}
}

export async function syncAccountsAndTransactions(
	connectionId: string,
	plaidAccounts: PlaidAccounts,
	added: PlaidTransactionsSyncResponse["added"],
	modified: PlaidTransactionsSyncResponse["modified"],
	removed: PlaidTransactionsSyncResponse["removed"],
	cursor: string | undefined,
) {
	return db.transaction(async (tx) => {
		const { numberOfCreatedAccounts, numberOfUpdatedAccounts, accountIdMap } =
			await syncAccounts(tx, connectionId, plaidAccounts)

		const {
			numberOfCreatedTransactions,
			numberOfUpdatedTransactions,
			numberOfDeletedTransactions,
		} = await syncTransactions(tx, accountIdMap, added, modified, removed)

		await tx
			.update(connections)
			.set({ plaidCursor: cursor, updatedAt: new Date() })
			.where(eq(connections.connectionId, connectionId))

		return {
			createdAccountsCount: numberOfCreatedAccounts,
			updatedAccountsCount: numberOfUpdatedAccounts,
			createdTransactionsCount: numberOfCreatedTransactions,
			updatedTransactionsCount: numberOfUpdatedTransactions,
			deletedTransactionsCount: numberOfDeletedTransactions,
		}
	})
}

// --------------------------------------------------------------------------------
