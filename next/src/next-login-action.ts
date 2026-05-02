"use server";

import type { ConfidentialClient } from "simple-auth-ts";

export function createGetLoginUrlAction<T extends {}>(
	client: ConfidentialClient<T>,
) {
	return async function getLoginUrl(state: T) {
		return client.getSignInUrl(state);
	};
}

/*
  Use this factory in your action.ts or actions.ts like this

	'use server';

	export const getLoginUrl = createGetLoginUrlAction(authClient);
*/
