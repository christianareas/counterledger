// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// --------------------------------------------------------------------------------
// Clerk middleware.
// --------------------------------------------------------------------------------

// Public route matcher.
const isPublicRoute = createRouteMatcher(["/api/plaid/webhook"])

// Middleware.
export default clerkMiddleware(async (auth, request) => {
	if (!isPublicRoute(request)) {
		await auth.protect()
	}
})

// --------------------------------------------------------------------------------
// Configuration.
// --------------------------------------------------------------------------------

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params.
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes.
		"/(api|trpc)(.*)",
	],
}

// --------------------------------------------------------------------------------
