import type { ConfidentialClient } from "simple-auth-ts";
import type { AuthState } from "./auth";

export const globals = globalThis as unknown as {
	authClient: ConfidentialClient<AuthState>;
};
