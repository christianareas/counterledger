"use client"

// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { useState } from "react"
import { usePlaidLink } from "react-plaid-link"

// --------------------------------------------------------------------------------
// Home page.
// --------------------------------------------------------------------------------

export default function Home() {
	// Initial state.
	const [plaidLinkToken, setPlaidLinkToken] = useState(null)

	// Open Plaid Link.
	const { open, ready } = usePlaidLink({
		token: plaidLinkToken,
		onSuccess: (publicToken, metadata) => {
			console.log("public token:", publicToken)
			console.log("metadata:", metadata)
		},
	})

	// Fetch a Plaid link token.
	async function fetchLinkToken() {
		const response = await fetch("/api/plaid/create-link-token", {
			method: "POST",
		})
		const data = await response.json()
		setPlaidLinkToken(data.linkToken)
	}

	// Return the home page.
	return (
		<section
			id="plaid-link-button"
			className="flex min-h-screen items-center justify-center"
		>
			<button
				type="button"
				onClick={() => (plaidLinkToken ? open() : fetchLinkToken())}
				disabled={!!plaidLinkToken && !ready}
				className="flex items-center gap-2 rounded border border-neutral-500 bg-neutral-200 px-4 py-2 text-neutral-950 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-300 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-950"
			>
				Open Plaid Link
			</button>
		</section>
	)
}

// --------------------------------------------------------------------------------
