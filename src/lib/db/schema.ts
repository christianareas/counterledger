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
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core"

// --------------------------------------------------------------------------------
// Connections.
// --------------------------------------------------------------------------------

export const connections = pgTable(
	"connections",
	{
		connectionId: uuid("connection_id").primaryKey(), // Primary key.
		institutionId: uuid("institution_id").references(
			() => institutions.institutionId,
		), // Foreign key.
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
		accountId: uuid("account_id").primaryKey(), // Primary key.
		connectionId: uuid("connection_id")
			.notNull()
			.references(() => connections.connectionId), // Foreign key.
		plaidAccountId: text("plaid_account_id").notNull(),
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
	(table) => [
		uniqueIndex("accounts_plaid_account_id_index").on(table.plaidAccountId),
	],
)

// --------------------------------------------------------------------------------
// Transactions.
// --------------------------------------------------------------------------------

export const transactions = pgTable(
	"transactions",
	{
		transactionId: uuid("transaction_id").primaryKey(), // Primary key.
		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.accountId), // Foreign key.
		plaidAccountId: text("plaid_account_id").notNull(),
		plaidTransactionId: text("plaid_transaction_id").notNull(),
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
	(table) => [
		uniqueIndex("transactions_plaid_transaction_id_index").on(
			table.plaidTransactionId,
		),
	],
)

// --------------------------------------------------------------------------------
// Institutions.
// --------------------------------------------------------------------------------

export const institutions = pgTable(
	"institutions",
	{
		institutionId: uuid("institution_id").primaryKey(), // Primary key.
		plaidInstitutionId: text("plaid_institution_id").notNull(),
		plaidInstitutionName: text("plaid_institution_name").notNull(),
		plaidInstitutionLogo: text("plaid_institution_logo"),
		plaidInstitutionUrl: text("plaid_institution_url"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	() => [],
)

// --------------------------------------------------------------------------------
