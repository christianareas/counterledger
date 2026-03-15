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
