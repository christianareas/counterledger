// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { NextResponse } from "next/server"
import {
	catchDatabaseError,
	catchPlaidError,
	catchServerError,
} from "@/lib/api/errors"
import { getConnections, syncAccountsAndTransactions } from "@/lib/db/plaid/sql"
import { plaidClient } from "@/lib/plaid"
import {
	mapPlaidAccountToDatabase,
	mapPlaidTransactionToDatabase,
} from "@/lib/plaid/adapters"
import type { SyncPlaidAccountsAndTransactionsResponse } from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/sync.
// --------------------------------------------------------------------------------

export async function POST() {
	try {
		// Get all connections.
		const connections = await getConnections()

		// Initialize counts.
		let createdAccountsCount = 0
		let updatedAccountsCount = 0
		let createdTransactionsCount = 0
		let updatedTransactionsCount = 0
		let deletedTransactionsCount = 0

		// Sync all accounts and transactions.
		for (const connection of connections) {
			// Get the connection.
			const { connectionId, plaidAccessToken, plaidCursor } = connection

			// Get the accounts.
			const plaidAccounts = (
				await plaidClient.accountsGet({
					access_token: plaidAccessToken,
				})
			).data.accounts.map((plaidAccount) =>
				mapPlaidAccountToDatabase(plaidAccount),
			)

			// Get the transactions.
			const createdPlaidTransactions = []
			const updatedPlaidTransactions = []
			const deletedPlaidTransactions = []

			let plaidNextCursor = plaidCursor ?? undefined
			let plaidMorePages: boolean

			do {
				const {
					added: created,
					modified: updated,
					removed: deleted,
					next_cursor: nextCursor,
					has_more: hasMore,
				} = (
					await plaidClient.transactionsSync({
						access_token: plaidAccessToken,
						cursor: plaidNextCursor,
					})
				).data

				createdPlaidTransactions.push(
					...created.map((createdPlaidTransaction) =>
						mapPlaidTransactionToDatabase(createdPlaidTransaction),
					),
				)

				updatedPlaidTransactions.push(
					...updated.map((updatedPlaidTransaction) =>
						mapPlaidTransactionToDatabase(updatedPlaidTransaction),
					),
				)

				deletedPlaidTransactions.push(
					...deleted.map(
						(deletedPlaidTransaction) => deletedPlaidTransaction.transaction_id,
					),
				)

				plaidNextCursor = nextCursor
				plaidMorePages = hasMore
			} while (plaidMorePages)

			// Sync.
			const counts = await syncAccountsAndTransactions(
				connectionId,
				plaidAccounts,
				createdPlaidTransactions,
				updatedPlaidTransactions,
				deletedPlaidTransactions,
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
