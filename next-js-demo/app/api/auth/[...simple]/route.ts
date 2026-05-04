import { createAuthRouteHandler } from "simple-auth-ts-next";
import { authClient } from "../../../_services/auth";

const handler = createAuthRouteHandler(authClient, {
	postLoginRedirect: (state) => state?.redirectTo ?? "/",
	postLogoutRedirect: () => "/",
});
export { handler as GET };
