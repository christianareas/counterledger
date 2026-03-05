CREATE TABLE "accounts" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"connection_id" uuid NOT NULL,
	"plaid_account_id" text NOT NULL,
	"plaid_account_name" text NOT NULL,
	"plaid_account_type" text NOT NULL,
	"plaid_account_subtype" text,
	"plaid_account_mask" text,
	"plaid_currency_code" text,
	"plaid_current_balance" numeric NOT NULL,
	"plaid_available_balance" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"connection_id" uuid PRIMARY KEY NOT NULL,
	"institution_id" uuid,
	"plaid_access_token" text NOT NULL,
	"plaid_item_id" text NOT NULL,
	"plaid_cursor" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"institution_id" uuid PRIMARY KEY NOT NULL,
	"plaid_institution_id" text NOT NULL,
	"plaid_institution_name" text NOT NULL,
	"plaid_institution_logo" text,
	"plaid_institution_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"plaid_transaction_id" text NOT NULL,
	"plaid_name" text NOT NULL,
	"plaid_merchant_name" text,
	"plaid_currency_code" text,
	"plaid_amount" numeric NOT NULL,
	"plaid_date" date NOT NULL,
	"plaid_authorized_date" date,
	"plaid_pending" boolean NOT NULL,
	"plaid_payment_channel" text NOT NULL,
	"plaid_personal_finance_category_primary" text,
	"plaid_personal_finance_category_detailed" text,
	"plaid_personal_finance_category_confidence_level" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_connection_id_connections_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("connection_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_institution_id_institutions_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE no action ON UPDATE no action;