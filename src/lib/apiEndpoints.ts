export const API_ENDPOINTS = {
    login: "/login",
    registerUser: "/user",
    transactions: "/transactions",
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
