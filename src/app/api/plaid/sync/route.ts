// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { NextResponse } from "next/server"
import {
	catchDatabaseError,
	catchPlaidError,
	catchServerError,
} from "@/lib/api/errors"
import { getConnections } from "@/lib/db/plaid/sql"
import { syncConnectionAccountsAndTransactions } from "@/lib/plaid/sync"
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

		// Sync the connections' accounts and transactions.
		for (const connection of connections) {
			const counts = await syncConnectionAccountsAndTransactions(connection)

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
				"Couldn't save the connections' accounts and transactions.",
			) ??
			catchServerError(
				error,
				"Couldn't sync the connections' accounts and transactions.",
			)
		)
	}
}

// --------------------------------------------------------------------------------
