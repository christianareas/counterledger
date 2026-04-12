// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { z } from "zod"

// --------------------------------------------------------------------------------
// Create Plaid link token.
// --------------------------------------------------------------------------------

export const CreatePlaidLinkTokenResponse = z.object({
	plaidLinkToken: z.string(),
})

export type CreatePlaidLinkTokenResponse = z.infer<
	typeof CreatePlaidLinkTokenResponse
>

// --------------------------------------------------------------------------------
// Exchange Plaid public token.
// --------------------------------------------------------------------------------

export const ExchangePlaidPublicTokenRequest = z.object({
	plaidPublicToken: z.string(),
})

export type ExchangePlaidPublicTokenRequest = z.infer<
	typeof ExchangePlaidPublicTokenRequest
>

export const ExchangePlaidPublicTokenResponse = z.object({
	connectionId: z.uuid(),
})

export type ExchangePlaidPublicTokenResponse = z.infer<
	typeof ExchangePlaidPublicTokenResponse
>

// --------------------------------------------------------------------------------
// Sync Plaid accounts and transactions.
// --------------------------------------------------------------------------------

export const SyncPlaidAccountsAndTransactionsResponse = z.object({
	createdAccountsCount: z.number(),
	updatedAccountsCount: z.number(),
	createdTransactionsCount: z.number(),
	updatedTransactionsCount: z.number(),
	deletedTransactionsCount: z.number(),
})

export type SyncPlaidAccountsAndTransactionsResponse = z.infer<
	typeof SyncPlaidAccountsAndTransactionsResponse
>

// --------------------------------------------------------------------------------
