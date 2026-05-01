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

  const getLoginUrl = createGetLoginUrl(client);
  export const action = getLoginUrl;
*/
