import { createAuthRouteHandler } from "simple-auth-ts-next";
import { authClient } from "../../../_services/auth";

const handler = createAuthRouteHandler(authClient, (state) => state?.redirectTo ?? '/');
export { handler as GET };