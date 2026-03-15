// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { DatabaseError } from "@neondatabase/serverless"
import axios from "axios"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { accounts, connections, transactions } from "@/lib/db/schema"
import { plaidClient } from "@/lib/plaid"
import type { SyncPlaidAccountsAndTransactionsResponse } from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/sync.
// --------------------------------------------------------------------------------

export async function POST() {
	try {
		// Get all connections.
		const allConnections = await db.select().from(connections)

		let synced = 0

		for (const connection of allConnections) {
			const { connectionId, plaidAccessToken, plaidCursor } = connection

			// Fetch accounts and transactions from Plaid.
			const { accounts: plaidAccounts } = (
				await plaidClient.accountsGet({
					access_token: plaidAccessToken,
				})
			).data

			let cursor = plaidCursor ?? undefined
			let hasMore = true
			type SyncData = Awaited<
				ReturnType<typeof plaidClient.transactionsSync>
			>["data"]
			const allAdded: SyncData["added"] = []
			const allModified: SyncData["modified"] = []
			const allRemoved: SyncData["removed"] = []

			while (hasMore) {
				const { added, modified, removed, next_cursor, has_more } = (
					await plaidClient.transactionsSync({
						access_token: plaidAccessToken,
						cursor,
					})
				).data

				allAdded.push(...added)
				allModified.push(...modified)
				allRemoved.push(...removed)
				cursor = next_cursor
				hasMore = has_more
			}

			// Write all changes in a single transaction.
			await db.transaction(async (transaction) => {
				// Upsert accounts.
				for (const plaidAccount of plaidAccounts) {
					await transaction
						.insert(accounts)
						.values({
							accountId: randomUUID(),
							connectionId,
							plaidAccountId: plaidAccount.account_id,
							plaidAccountName: plaidAccount.name,
							plaidAccountType: plaidAccount.type,
							plaidAccountSubtype: plaidAccount.subtype ?? null,
							plaidAccountMask: plaidAccount.mask ?? null,
							plaidCurrencyCode:
								plaidAccount.balances.iso_currency_code ?? null,
							plaidCurrentBalance:
								plaidAccount.balances.current?.toString() ?? "0",
							plaidAvailableBalance:
								plaidAccount.balances.available?.toString() ?? null,
						})
						.onConflictDoUpdate({
							target: accounts.plaidAccountId,
							set: {
								plaidAccountName: plaidAccount.name,
								plaidAccountType: plaidAccount.type,
								plaidAccountSubtype: plaidAccount.subtype ?? null,
								plaidAccountMask: plaidAccount.mask ?? null,
								plaidCurrencyCode:
									plaidAccount.balances.iso_currency_code ?? null,
								plaidCurrentBalance:
									plaidAccount.balances.current?.toString() ?? "0",
								plaidAvailableBalance:
									plaidAccount.balances.available?.toString() ?? null,
								updatedAt: new Date(),
							},
						})
				}

				// Get a map of plaidAccountId -> accountId for FK resolution.
				const accountRows = await transaction
					.select()
					.from(accounts)
					.where(eq(accounts.connectionId, connectionId))
				const accountIdMap = new Map(
					accountRows.map((a) => [a.plaidAccountId, a.accountId]),
				)

				// Upsert added transactions.
				for (const t of allAdded) {
					const accountId = accountIdMap.get(t.account_id)
					if (!accountId) continue

					await transaction
						.insert(transactions)
						.values({
							transactionId: randomUUID(),
							accountId,
							plaidTransactionId: t.transaction_id,
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
						})
						.onConflictDoUpdate({
							target: transactions.plaidTransactionId,
							set: {
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
								updatedAt: new Date(),
							},
						})

					synced++
				}

				// Upsert modified transactions.
				for (const t of allModified) {
					await transaction
						.update(transactions)
						.set({
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
							updatedAt: new Date(),
						})
						.where(eq(transactions.plaidTransactionId, t.transaction_id))
				}

				// Delete removed transactions.
				for (const t of allRemoved) {
					await transaction
						.delete(transactions)
						.where(eq(transactions.plaidTransactionId, t.transaction_id))
				}

				// Update the cursor on the connection.
				await transaction
					.update(connections)
					.set({ plaidCursor: cursor, updatedAt: new Date() })
					.where(eq(connections.connectionId, connectionId))
			})
		}

		// Return the number of synced transactions.
		return NextResponse.json<SyncPlaidAccountsAndTransactionsResponse>(
			{ synced },
			{ status: 200 },
		)
	} catch (error) {
		// Plaid errors.
		if (axios.isAxiosError(error) && error.response?.data) {
			console.error(error)
			return NextResponse.json(
				{ error: error.response.data.error_message },
				{ status: 500 },
			)
		}

		// Database errors.
		if (error instanceof DatabaseError) {
			console.error(error)
			return NextResponse.json(
				{ error: "Couldn't sync accounts and transactions." },
				{ status: 500 },
			)
		}

		// Other errors.
		console.error(error)
		return NextResponse.json(
			{ error: "Couldn't sync Plaid accounts and transactions." },
			{ status: 500 },
		)
	}
}

// --------------------------------------------------------------------------------
