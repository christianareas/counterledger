// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import {
	boolean,
	date,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

// --------------------------------------------------------------------------------
// Users.
// --------------------------------------------------------------------------------

export const users = pgTable(
	"users",
	{
		id: uuid("user_id").primaryKey(), // Primary key.
		fullName: text("full_name").notNull(),
		firstName: text("first_name").notNull(),
		middleName: text("middle_name"),
		lastName: text("last_name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Sessions.
// --------------------------------------------------------------------------------

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("session_id").primaryKey(), // Primary key.
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // Foreign key.
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Identities.
// --------------------------------------------------------------------------------

export const identities = pgTable(
	"identities",
	{
		id: uuid("identity_id").primaryKey(), // Primary key.
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // Foreign key.
		providerId: text("provider_id").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		providerAccessToken: text("provider_access_token"),
		providerRefreshToken: text("provider_refresh_token"),
		providerIdToken: text("provider_id_token"),
		providerAccessTokenExpiresAt: timestamp("provider_access_token_expires_at"),
		providerRefreshTokenExpiresAt: timestamp(
			"provider_refresh_token_expires_at",
		),
		providerScope: text("provider_scope"),
		password: text("password"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Verifications.
// --------------------------------------------------------------------------------

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("verification_id").primaryKey(), // Primary key.
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Connections.
// --------------------------------------------------------------------------------

export const connections = pgTable(
	"connections",
	{
		id: uuid("connection_id").primaryKey(), // Primary key.
		institutionId: uuid("institution_id").references(() => institutions.id), // Foreign key.
		plaidAccessToken: text("plaid_access_token").notNull(),
		plaidItemId: text("plaid_item_id").notNull(),
		plaidCursor: text("plaid_cursor"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Accounts.
// --------------------------------------------------------------------------------

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("account_id").primaryKey(), // Primary key.
		connectionId: uuid("connection_id")
			.notNull()
			.references(() => connections.id, { onDelete: "cascade" }), // Foreign key.
		plaidAccountId: text("plaid_account_id").notNull().unique(),
		plaidAccountName: text("plaid_account_name").notNull(),
		plaidAccountType: text("plaid_account_type").notNull(),
		plaidAccountSubtype: text("plaid_account_subtype"),
		plaidAccountMask: text("plaid_account_mask"),
		plaidCurrencyCode: text("plaid_currency_code"),
		plaidCurrentBalance: numeric("plaid_current_balance").notNull(),
		plaidAvailableBalance: numeric("plaid_available_balance"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Transactions.
// --------------------------------------------------------------------------------

export const transactions = pgTable(
	"transactions",
	{
		id: uuid("transaction_id").primaryKey(), // Primary key.
		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }), // Foreign key.
		plaidAccountId: text("plaid_account_id").notNull(),
		plaidTransactionId: text("plaid_transaction_id").notNull().unique(),
		plaidName: text("plaid_name").notNull(),
		plaidMerchantName: text("plaid_merchant_name"),
		plaidCurrencyCode: text("plaid_currency_code"),
		plaidAmount: numeric("plaid_amount").notNull(),
		plaidDate: date("plaid_date").notNull(),
		plaidAuthorizedDate: date("plaid_authorized_date"),
		plaidPending: boolean("plaid_pending").notNull(),
		plaidPaymentChannel: text("plaid_payment_channel").notNull(),
		plaidPersonalFinanceCategoryPrimary: text(
			"plaid_personal_finance_category_primary",
		),
		plaidPersonalFinanceCategoryDetailed: text(
			"plaid_personal_finance_category_detailed",
		),
		plaidPersonalFinanceCategoryConfidenceLevel: text(
			"plaid_personal_finance_category_confidence_level",
		),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
// Institutions.
// --------------------------------------------------------------------------------

export const institutions = pgTable(
	"institutions",
	{
		id: uuid("institution_id").primaryKey(), // Primary key.
		plaidInstitutionId: text("plaid_institution_id").notNull(),
		plaidInstitutionName: text("plaid_institution_name").notNull(),
		plaidInstitutionLogo: text("plaid_institution_logo"),
		plaidInstitutionUrl: text("plaid_institution_url"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
