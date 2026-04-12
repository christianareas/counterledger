// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { NextResponse } from "next/server"
import { CountryCode, Products } from "plaid"
import { catchPlaidError, catchServerError } from "@/lib/api/errors"
import { plaidClient } from "@/lib/plaid"
import type { CreatePlaidLinkTokenResponse } from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/create-link-token.
// --------------------------------------------------------------------------------

export async function POST() {
	try {
		// Create a token.
		const {
			data: { link_token: plaidLinkToken },
		} = await plaidClient.linkTokenCreate({
			client_name: "CounterLedger",
			user: { client_user_id: "christian" },
			products: [Products.Transactions],
			country_codes: [CountryCode.Us],
			language: "en",
			webhook: process.env.PLAID_WEBHOOK_URL,
		})

		// Return the token.
		return NextResponse.json<CreatePlaidLinkTokenResponse>(
			{ plaidLinkToken },
			{ status: 201 },
		)
	} catch (error) {
		return (
			catchPlaidError(error) ??
			catchServerError(error, "Couldn't create the Plaid link token.")
		)
	}
}

// --------------------------------------------------------------------------------
