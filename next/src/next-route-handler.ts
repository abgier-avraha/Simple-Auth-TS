import type { NextRequest } from "next/server";
import { AuthError, type ConfidentialClient } from "simple-auth-ts";

// TODO: Clean up the conditionals

export function createAuthRouteHandler<TState extends {}>(
	client: ConfidentialClient<TState>,
	opts: {
		postLoginRedirect: (state?: TState) => string;
		// This is the client side post logout url, not the provider side
		postLogoutRedirect?: () => string;
	},
) {
	return async function handler(req: NextRequest): Promise<Response> {
		const config = client.getConfig();
		const url = new URL(req.url);

		// Handle signout
		if (config.postLogoutRedirectUri) {
			const signoutPath = new URL(config.postLogoutRedirectUri).pathname;

			if (url.pathname === signoutPath) {
				await client.deleteSession();
				const redirectUrl = new URL(opts.postLogoutRedirect?.() ?? "", req.url);
				return Response.redirect(redirectUrl);
			}
		}

		// Handle sign in callback
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
			return Response.redirect(
				new URL(opts.postLoginRedirect(res.state), req.url),
			);
		} catch (error: unknown) {
			const redirectUrl = new URL(opts.postLoginRedirect(), req.url);
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

	const handler = createAuthRouteHandler(client, {
		postLoginRedirect: (state) => state?.redirectTo ?? "/",
		postLogoutRedirect: () => "/",
	});
	export { handler as GET };
*/
