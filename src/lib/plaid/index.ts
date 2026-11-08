// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid/legacy"

// --------------------------------------------------------------------------------
// Environment variables.
// --------------------------------------------------------------------------------

const plaidEnvironment = process.env.PLAID_ENV
const plaidClientId = process.env.PLAID_CLIENT_ID
const plaidSecret = process.env.PLAID_SECRET

if (!plaidEnvironment) {
	throw new Error("There's no PLAID_ENV environment variable.")
}

const plaidBasePath = PlaidEnvironments[plaidEnvironment]

if (!plaidBasePath) {
	throw new Error(
		"The PLAID_ENV environment variable must be sandbox or production.",
	)
}

if (!plaidClientId) {
	throw new Error("There's no PLAID_CLIENT_ID environment variable.")
}

if (!plaidSecret) {
	throw new Error("There's no PLAID_SECRET environment variable.")
}

// --------------------------------------------------------------------------------
// Configuration.
// --------------------------------------------------------------------------------

const configuration = new Configuration({
	basePath: plaidBasePath,
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": plaidClientId,
			"PLAID-SECRET": plaidSecret,
		},
	},
})

// --------------------------------------------------------------------------------
// Plaid client.
// --------------------------------------------------------------------------------

export const plaidClient = new PlaidApi(configuration)

// --------------------------------------------------------------------------------
