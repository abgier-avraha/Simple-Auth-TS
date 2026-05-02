'use server';

import { createGetLoginUrlAction } from "simple-auth-ts-next";
import { authClient, AuthState } from "./_services/auth";

const action = await createGetLoginUrlAction(authClient);
export async function getLoginUrl(state: AuthState)
{
  return await action(state);
}
