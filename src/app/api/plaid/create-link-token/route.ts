// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { NextResponse } from "next/server"
import { CountryCode, Products } from "plaid"
import { plaidClient } from "@/lib/plaid"

// --------------------------------------------------------------------------------
// POST /api/plaid/create-link-token.
// --------------------------------------------------------------------------------

export async function POST() {
	try {
		// Create a token.
		const response = await plaidClient.linkTokenCreate({
			client_name: "CounterLedger",
			user: { client_user_id: "christian" },
			products: [Products.Transactions],
			country_codes: [CountryCode.Us],
			language: "en",
		})

		// Return the token.
		return NextResponse.json({
			plaidLinkToken: response.data.link_token,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: "Couldn't create a Plaid link token." },
			{ status: 500 },
		)
	}
}

// --------------------------------------------------------------------------------
