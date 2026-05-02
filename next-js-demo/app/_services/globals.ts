import { ConfidentialClient } from "simple-auth-ts"
import { AuthState } from "./auth"

export const globals = globalThis as unknown as {
  authClient: ConfidentialClient<AuthState>
}

