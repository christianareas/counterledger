// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

// --------------------------------------------------------------------------------
// Middleware.
// --------------------------------------------------------------------------------

export function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request)

	if (!sessionCookie) {
		return NextResponse.json(
			{ error: "The request isn't authenticated." },
			{ status: 401 },
		)
	}

	return NextResponse.next()
}

// --------------------------------------------------------------------------------
// Configuration.
// --------------------------------------------------------------------------------

export const config = {
	// Protect all routes, except /api/plaid/webhook (public).
	matcher: ["/api/plaid/((?!webhook).*)"],
}

// --------------------------------------------------------------------------------
