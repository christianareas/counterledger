// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { createHash, timingSafeEqual } from "node:crypto"
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose"
import { type NextRequest, NextResponse } from "next/server"
import {
	catchDatabaseError,
	catchPlaidError,
	catchServerError,
	catchZodError,
} from "@/lib/api/errors"
import { getConnectionByPlaidItemId } from "@/lib/db/plaid/sql"
import { plaidClient } from "@/lib/plaid"
import { syncConnectionAccountsAndTransactions } from "@/lib/plaid/sync"
import { PlaidWebhookRequest } from "@/lib/schemas/api"

// --------------------------------------------------------------------------------
// POST /api/plaid/webhook.
// --------------------------------------------------------------------------------

export async function POST(request: NextRequest) {
	try {
		// Plaid verification header and sync notification.
		const plaidVerificationHeader = request.headers.get("plaid-verification")
		const plaidSyncNotification = await request.text()

		// If there's no verification header, return 401.
		if (!plaidVerificationHeader) {
			return NextResponse.json(
				{ error: "No Plaid-Verification header found in the request." },
				{ status: 401 },
			)
		}

		// Decode the JWT header.
		const { alg, kid } = decodeProtectedHeader(plaidVerificationHeader)

		// If the algorithm isn't ES256 or there's no key ID, return 401.
		if (alg !== "ES256" || !kid) {
			return NextResponse.json(
				{ error: "The webhook signature isn't valid." },
				{ status: 401 },
			)
		}

		// Get the public key.
		const {
			data: { key: plaidPublicKey },
		} = await plaidClient.webhookVerificationKeyGet({
			key_id: kid,
		})

		// Verify the JWT signature.
		const { payload } = await jwtVerify(
			plaidVerificationHeader,
			await importJWK(plaidPublicKey),
			{ maxTokenAge: "5 min" },
		)

		// Compare the hashes.
		const expectedHash = createHash("sha256")
			.update(plaidSyncNotification)
			.digest("hex")
		const claimedHash = payload.request_body_sha256 as string

		// If the hashes don't match, return 401.
		if (!timingSafeEqual(Buffer.from(expectedHash), Buffer.from(claimedHash))) {
			return NextResponse.json(
				{ error: "The webhook signature isn't valid." },
				{ status: 401 },
			)
		}

		// Parse the sync notification.
		const {
			webhook_type: webhookType,
			webhook_code: webhookCode,
			item_id: plaidItemId,
		} = PlaidWebhookRequest.parse(JSON.parse(plaidSyncNotification))

		// If it's not a sync notification, return 204.
		if (
			webhookType !== "TRANSACTIONS" ||
			webhookCode !== "SYNC_UPDATES_AVAILABLE"
		) {
			return new NextResponse(null, { status: 204 })
		}

		// Get the connection.
		const connection = await getConnectionByPlaidItemId(plaidItemId)

		if (!connection) {
			return NextResponse.json(
				{
					error: `No connection found in the database for plaidItemId ${plaidItemId}.`,
				},
				{ status: 404 },
			)
		}

		// Sync the connection's accounts and transactions.
		const {
			createdAccountsCount,
			updatedAccountsCount,
			createdTransactionsCount,
			updatedTransactionsCount,
			deletedTransactionsCount,
		} = await syncConnectionAccountsAndTransactions(connection)

		// Return the counts.
		return NextResponse.json(
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
			catchZodError(error) ??
			catchPlaidError(error) ??
			catchDatabaseError(
				error,
				"Couldn't save the connection's accounts and transactions.",
			) ??
			catchServerError(
				error,
				"Couldn't sync the connection's accounts and transactions.",
			)
		)
	}
}

// --------------------------------------------------------------------------------
