// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import { CountryCode } from "plaid"
import {
	catchDatabaseError,
	catchPlaidError,
	catchServerError,
	catchZodError,
} from "@/lib/api/errors"
import { db } from "@/lib/db"
import { connections, institutions } from "@/lib/db/schema"
import { plaidClient } from "@/lib/plaid"
import {
	ExchangePlaidPublicTokenRequest,
	type ExchangePlaidPublicTokenResponse,
} from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/exchange-public-token.
// --------------------------------------------------------------------------------

export async function POST(request: NextRequest) {
	try {
		// Get the public token.
		const { plaidPublicToken } = ExchangePlaidPublicTokenRequest.parse(
			await request.json(),
		)

		// Exchange the public token for an access token.
		const { access_token: plaidAccessToken, item_id: plaidItemId } = (
			await plaidClient.itemPublicTokenExchange({
				public_token: plaidPublicToken,
			})
		).data

		// Get the institution ID.
		const { institution_id: plaidInstitutionId } = (
			await plaidClient.itemGet({
				access_token: plaidAccessToken,
			})
		).data.item

		// If there's no institution ID, throw an error.
		if (!plaidInstitutionId)
			throw new Error("Plaid didn't return an institution ID.")

		// Get the institution.
		const institution = (
			await plaidClient.institutionsGetById({
				institution_id: plaidInstitutionId,
				country_codes: [CountryCode.Us],
			})
		).data.institution

		// Generate UUIDs.
		const institutionId = randomUUID()
		const connectionId = randomUUID()

		// Insert the institution and connection.
		await db.transaction(async (transaction) => {
			await transaction.insert(institutions).values({
				institutionId,
				plaidInstitutionId: institution.institution_id,
				plaidInstitutionName: institution.name,
				plaidInstitutionLogo: institution.logo ?? null,
				plaidInstitutionUrl: institution.url ?? null,
			})

			await transaction.insert(connections).values({
				connectionId,
				institutionId,
				plaidAccessToken,
				plaidItemId,
			})
		})

		// Return the connection ID.
		return NextResponse.json<ExchangePlaidPublicTokenResponse>(
			{ connectionId },
			{ status: 201 },
		)
	} catch (error) {
		return (
			catchZodError(error) ??
			catchPlaidError(error) ??
			catchDatabaseError(error, "Couldn't save the connection.") ??
			catchServerError(error, "Couldn't exchange the Plaid public token.")
		)
	}
}

// --------------------------------------------------------------------------------
