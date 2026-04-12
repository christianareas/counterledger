// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import { DatabaseError } from "@neondatabase/serverless"
import axios from "axios"
import { NextResponse } from "next/server"
import { ZodError } from "zod"

// --------------------------------------------------------------------------------
// Catch a Zod error.
// --------------------------------------------------------------------------------

export function catchZodError(error: unknown): NextResponse | null {
	if (error instanceof ZodError) {
		console.error(error)
		return NextResponse.json(
			{ error: "The request body isn't valid." },
			{ status: 400 },
		)
	}
	return null
}

// --------------------------------------------------------------------------------
// Catch a Plaid error.
// --------------------------------------------------------------------------------

export function catchPlaidError(error: unknown): NextResponse | null {
	if (axios.isAxiosError(error) && error.response?.data) {
		console.error(error)
		return NextResponse.json(
			{ error: error.response.data.error_message },
			{ status: 500 },
		)
	}
	return null
}

// --------------------------------------------------------------------------------
// Catch a database error.
// --------------------------------------------------------------------------------

export function catchDatabaseError(
	error: unknown,
	message = "The database operation failed.",
): NextResponse | null {
	if (error instanceof DatabaseError) {
		console.error(error)
		return NextResponse.json({ error: message }, { status: 500 })
	}
	return null
}

// --------------------------------------------------------------------------------
// Catch a server error.
// --------------------------------------------------------------------------------

export function catchServerError(
	error: unknown,
	message = "The request failed.",
): NextResponse {
	console.error(error)
	return NextResponse.json({ error: message }, { status: 500 })
}

// --------------------------------------------------------------------------------
