"use server";

import type { ConfidentialClient } from "simple-auth-ts";

export async function createGetLoginUrlAction<T extends {}>(
	client: ConfidentialClient<T>,
) {
	return async function getLoginUrl(state: T) {
		return client.getSignInUrl(state);
	};
}

/*
  Use this factory in your action.ts or actions.ts like this

	'use server';

	const action = await createGetLoginUrlAction(authClient);
	export async function getLoginUrl(state: AuthState)
	{
		return await action(state);
	}
*/
