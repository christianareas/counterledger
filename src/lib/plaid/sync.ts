// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { syncAccountsAndTransactions } from "@/lib/db/plaid/sql"
import { plaidClient } from "@/lib/plaid"
import {
	mapPlaidAccountToDatabase,
	mapPlaidTransactionToDatabase,
} from "@/lib/plaid/adapters"

// --------------------------------------------------------------------------------
// Sync a connection's accounts and transactions.
// --------------------------------------------------------------------------------

export async function syncConnectionAccountsAndTransactions(connection: {
	connectionId: string
	plaidAccessToken: string
	plaidCursor: string | null
}) {
	const { connectionId, plaidAccessToken, plaidCursor } = connection

	// Get the accounts.
	const plaidAccounts = (
		await plaidClient.accountsGet({
			access_token: plaidAccessToken,
		})
	).data.accounts.map((plaidAccount) => mapPlaidAccountToDatabase(plaidAccount))

	// Get the transactions.
	const createdPlaidTransactions = []
	const updatedPlaidTransactions = []
	const deletedPlaidTransactionIds = []

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

		deletedPlaidTransactionIds.push(
			...deleted.map(
				(deletedPlaidTransaction) => deletedPlaidTransaction.transaction_id,
			),
		)

		plaidNextCursor = nextCursor
		plaidMorePages = hasMore
	} while (plaidMorePages)

	// Sync.
	return syncAccountsAndTransactions(
		connectionId,
		plaidAccounts,
		createdPlaidTransactions,
		updatedPlaidTransactions,
		deletedPlaidTransactionIds,
		plaidNextCursor,
	)
}

// --------------------------------------------------------------------------------
