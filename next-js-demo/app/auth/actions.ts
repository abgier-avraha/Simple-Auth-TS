"use server";

import { authClient } from "../_services/auth";
import { createAuthActions } from "simple-auth-ts-next";

export const { getLoginUrl, getSignOutUrl, getValidSession } =
	await createAuthActions(authClient);
