// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { randomUUID } from "node:crypto"
import { db } from "@/lib/db"
import { connections, institutions } from "@/lib/db/schema"

// --------------------------------------------------------------------------------
// Insert an institution and connection.
// --------------------------------------------------------------------------------

export async function insertInstitutionAndConnection(
	institution: {
		plaidInstitutionId: string
		plaidInstitutionName: string
		plaidInstitutionLogo: string | null
		plaidInstitutionUrl: string | null
	},
	connection: {
		plaidAccessToken: string
		plaidItemId: string
	},
) {
	const institutionId = randomUUID()
	const connectionId = randomUUID()

	await db.transaction(async (tx) => {
		await tx.insert(institutions).values({ institutionId, ...institution })
		await tx
			.insert(connections)
			.values({ connectionId, institutionId, ...connection })
	})

	return { institutionId, connectionId }
}

// --------------------------------------------------------------------------------
