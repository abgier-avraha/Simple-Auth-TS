'use server';

import { createGetLoginUrlAction } from "simple-auth-ts-next";
import { authClient } from "./_services/auth";

export const getLoginUrl = createGetLoginUrlAction(authClient);
