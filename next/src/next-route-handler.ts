import type { NextRequest } from "next/server";
import { AuthError, type ConfidentialClient } from "simple-auth-ts";

export function createAuthRouteHandler<TState extends {}>(
	client: ConfidentialClient<TState>,
	redirectTo: (state?: TState) => string,
) {
	return async function handler(req: NextRequest): Promise<Response> {
		const config = client.getConfig();

		const url = new URL(req.url);
		const callbackPath = new URL(config.redirectUrl).pathname;

		if (url.pathname !== callbackPath) {
			const description = `Received unexpected path ${req.url}, your auth callback path is ${config.redirectUrl}`;
			console.error(
				"AuthRouteHandler",
				`Received unexpected path ${req.url}, your auth callback path is ${config.redirectUrl}`,
			);
			return new Response(description, { status: 404 });
		}

		try {
			const res = await client.handleRedirect(req.url);
			return Response.redirect(new URL(redirectTo(res.state), req.url));
		} catch (error: unknown) {
			const redirectUrl = new URL(redirectTo(), req.url);
			if (isAuthError(error)) {
				redirectUrl.searchParams.set("error", error.code);
				redirectUrl.searchParams.set("error_description", error.description);
			} else {
				redirectUrl.searchParams.set("error", "Unknown error");
			}

			return Response.redirect(redirectUrl);
		}
	};
}

function isAuthError(err: unknown): err is AuthError {
	if (err && err instanceof AuthError) {
		return true;
	}
	return false;
}

/*
	Use in your callback route (ex. app/api/auth/[...simple]/route.ts)

	const handler = createAuthRouteHandler(client, (state) => "/");
	export { handler as GET };
*/
