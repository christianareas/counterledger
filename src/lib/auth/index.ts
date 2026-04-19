// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"

// --------------------------------------------------------------------------------
// Auth.
// --------------------------------------------------------------------------------

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.identities,
			verification: schema.verifications,
		},
	}),
	user: {
		modelName: "users",
		fields: {
			name: "fullName",
		},
		additionalFields: {
			firstName: {
				type: "string",
				required: true,
			},
			middleName: {
				type: "string",
				required: false,
			},
			lastName: {
				type: "string",
				required: true,
			},
		},
	},
	session: {
		modelName: "sessions",
	},
	account: {
		modelName: "identities",
		fields: {
			accountId: "providerAccountId",
			accessToken: "providerAccessToken",
			refreshToken: "providerRefreshToken",
			idToken: "providerIdToken",
			accessTokenExpiresAt: "providerAccessTokenExpiresAt",
			refreshTokenExpiresAt: "providerRefreshTokenExpiresAt",
			scope: "providerScope",
		},
	},
	verification: {
		modelName: "verifications",
	},
	advanced: {
		database: {
			generateId: () => randomUUID(),
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
})

// --------------------------------------------------------------------------------
