export const API_ENDPOINTS = {
  balance: "/balance",
  login: "/login",
  registerUser: "/user",
  topup: "/topup",
  topTransactionsPerUser: "/top_transactions_per_user",
  topUsers: "/top_users",
  transactions: "/transactions",
  transfer: "/transfer",
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;