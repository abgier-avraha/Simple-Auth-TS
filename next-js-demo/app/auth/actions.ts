'use server';

import { authClient, AuthState } from "../_services/auth";

export async function getLoginUrl(state: AuthState)
{
  return await authClient.getSignInUrl(state);
}

export async function getSignOutUrl()
{
  return await authClient.getSignOutUrl()
}

export async function getValidSession(args?: {forceRefresh: boolean})
{
  return await authClient.getValidSession(args)
}
