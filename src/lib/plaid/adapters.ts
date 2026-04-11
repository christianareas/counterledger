// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import type { AccountBase, Institution, TransactionsSyncResponse } from "plaid"

// --------------------------------------------------------------------------------
// Map Plaid fields to database fields.
// --------------------------------------------------------------------------------

export function mapPlaidInstitutionToDatabase(institution: Institution) {
	return {
		plaidInstitutionId: institution.institution_id,
		plaidInstitutionName: institution.name,
		plaidInstitutionLogo: institution.logo ?? null,
		plaidInstitutionUrl: institution.url ?? null,
	}
}

export function mapPlaidAccountToDatabase(account: AccountBase) {
	return {
		plaidAccountId: account.account_id,
		plaidAccountName: account.name,
		plaidAccountType: account.type,
		plaidAccountSubtype: account.subtype ?? null,
		plaidAccountMask: account.mask ?? null,
		plaidCurrencyCode: account.balances.iso_currency_code ?? null,
		plaidCurrentBalance: account.balances.current?.toString() ?? "0",
		plaidAvailableBalance: account.balances.available?.toString() ?? null,
	}
}

export function mapPlaidTransactionToDatabase(
	transaction: TransactionsSyncResponse["added"][number],
) {
	return {
		plaidTransactionId: transaction.transaction_id,
		plaidName: transaction.name,
		plaidMerchantName: transaction.merchant_name ?? null,
		plaidCurrencyCode: transaction.iso_currency_code ?? null,
		plaidAmount: transaction.amount.toString(),
		plaidDate: transaction.date,
		plaidAuthorizedDate: transaction.authorized_date ?? null,
		plaidPending: transaction.pending,
		plaidPaymentChannel: transaction.payment_channel,
		plaidPersonalFinanceCategoryPrimary:
			transaction.personal_finance_category?.primary ?? null,
		plaidPersonalFinanceCategoryDetailed:
			transaction.personal_finance_category?.detailed ?? null,
		plaidPersonalFinanceCategoryConfidenceLevel:
			transaction.personal_finance_category?.confidence_level ?? null,
	}
}

// --------------------------------------------------------------------------------
