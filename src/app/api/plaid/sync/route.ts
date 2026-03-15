// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { NextResponse } from "next/server"
import {
	catchDatabaseError,
	catchPlaidError,
	catchServerError,
} from "@/lib/api/errors"
import {
	getConnections,
	type PlaidTransactionsSyncResponse,
	syncAccountsAndTransactions,
} from "@/lib/db/plaid/sql"
import { plaidClient } from "@/lib/plaid"
import type { SyncPlaidAccountsAndTransactionsResponse } from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/sync.
// --------------------------------------------------------------------------------

export async function POST() {
	try {
		// Get all the connections.
		const connections = await getConnections()

		// Initialize the counts.
		let createdAccountsCount = 0
		let updatedAccountsCount = 0
		let createdTransactionsCount = 0
		let updatedTransactionsCount = 0
		let deletedTransactionsCount = 0

		// Sync all the accounts and transactions.
		for (const connection of connections) {
			// Get the connection.
			const { connectionId, plaidAccessToken, plaidCursor } = connection

			// Get the accounts.
			const { accounts: plaidAccounts } = (
				await plaidClient.accountsGet({
					access_token: plaidAccessToken,
				})
			).data

			// Get the transactions.
			const createdTransactions: PlaidTransactionsSyncResponse["added"] = []
			const updatedTransactions: PlaidTransactionsSyncResponse["modified"] = []
			const deletedTransactions: PlaidTransactionsSyncResponse["removed"] = []

			let plaidNextCursor = plaidCursor ?? undefined
			let plaidMorePages: boolean

			do {
				const { added, modified, removed, next_cursor, has_more } = (
					await plaidClient.transactionsSync({
						access_token: plaidAccessToken,
						cursor: plaidNextCursor,
					})
				).data

				createdTransactions.push(...added)
				updatedTransactions.push(...modified)
				deletedTransactions.push(...removed)
				plaidNextCursor = next_cursor
				plaidMorePages = has_more
			} while (plaidMorePages)

			// Sync.
			const counts = await syncAccountsAndTransactions(
				connectionId,
				plaidAccounts,
				createdTransactions,
				updatedTransactions,
				deletedTransactions,
				plaidNextCursor,
			)

			// Update the counts.
			createdAccountsCount += counts.createdAccountsCount
			updatedAccountsCount += counts.updatedAccountsCount
			createdTransactionsCount += counts.createdTransactionsCount
			updatedTransactionsCount += counts.updatedTransactionsCount
			deletedTransactionsCount += counts.deletedTransactionsCount
		}

		// Return the counts.
		return NextResponse.json<SyncPlaidAccountsAndTransactionsResponse>(
			{
				createdAccountsCount,
				updatedAccountsCount,
				createdTransactionsCount,
				updatedTransactionsCount,
				deletedTransactionsCount,
			},
			{ status: 200 },
		)
	} catch (error) {
		return (
			catchPlaidError(error) ??
			catchDatabaseError(
				error,
				"Couldn't save the accounts and transactions.",
			) ??
			catchServerError(error, "Couldn't sync the accounts and transactions.")
		)
	}
}

// --------------------------------------------------------------------------------
