"use server";

import type { ConfidentialClient } from "simple-auth-ts";

// TODO: import from lib
import type { AuthSession } from "../../core/dist/session";

type AuthActions<T extends {}> = {
	getLoginUrl: (args: {
		state: T;
		urlParams?: Record<string, string>;
	}) => Promise<string>;

	getSignOutUrl: () => Promise<string>;

	getValidSession: (args?: {
		forceRefresh: boolean;
	}) => Promise<AuthSession | undefined>;
};

export async function createAuthActions<T extends {}>(
	authClient: ConfidentialClient<T>,
): Promise<AuthActions<T>> {
	return {
		async getLoginUrl(args: { state: T; urlParams?: Record<string, string> }) {
			return await authClient.getSignInUrl(args);
		},

		async getSignOutUrl() {
			return await authClient.getSignOutUrl();
		},

		async getValidSession(args?: { forceRefresh: boolean }) {
			return await authClient.getValidSession(args);
		},
	};
}

/*
	Use in your actions.ts like this and call from your client components

	export const { getLoginUrl, getSignOutUrl, getValidSession } =
		await createAuthActions(authClient);
*/
