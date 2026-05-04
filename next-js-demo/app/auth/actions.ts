"use server";

import { authClient, type AuthState } from "../_services/auth";

export async function getLoginUrl(args: {
	state: AuthState;
	urlParams?: Record<string, string>;
}) {
	return await authClient.getSignInUrl(args);
}

export async function getSignOutUrl() {
	return await authClient.getSignOutUrl();
}

export async function getValidSession(args?: { forceRefresh: boolean }) {
	return await authClient.getValidSession(args);
}
