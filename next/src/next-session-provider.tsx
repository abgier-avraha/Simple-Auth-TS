"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

// TODO: fix this import to come from lib

import type { AuthSession } from "../../core/dist/session";

// TODO: added decoded data to context, maybe a hook factory with a generic for claims? The generic will be T & CommonClaims
export type SessionContextValue = {
	session: AuthSession | undefined;
};

const SessionContext = createContext<SessionContextValue | undefined>(
	undefined,
);

type SessionState = {
	status: "loading" | "authenticated" | "unauthenticated";
	session?: AuthSession;
};

// TODO: think about what to do if access token is expired
// TODO: think about what to do if refresh token is expired

export function SessionProvider(props: {
	session: AuthSession | undefined;
	getValidSession: () => Promise<AuthSession | undefined>;
	children: React.ReactNode;
}) {
	const [state, setState] = useState<SessionState>({
		status: "loading",
		session: props.session,
	});

	useEffect(() => {
		let cancelled = false;

		async function init() {
			try {
				const session = await props.getValidSession();

				if (cancelled) return;

				if (session) {
					setState({
						status: "authenticated",
						session,
					});
				} else {
					setState({
						status: "unauthenticated",
					});
				}
			} catch {
				if (!cancelled) {
					setState({
						status: "unauthenticated",
					});
				}
			}
		}

		init();

		return () => {
			cancelled = true;
		};
	}, [props.getValidSession]);

	return (
		<SessionContext.Provider value={{ session: state.session }}>
			{props.children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const ctx = useContext(SessionContext);

	if (!ctx) {
		throw new Error("useSession must be used within provider");
	}

	return ctx;
}

/*
	Use the provider in your server like this

	Create a client component wrapper

	export function ClientSessionProvider(props: {
		session: AuthSession | undefined;
		children: React.ReactNode;
	}) {
		const getValidSessionAction = useCallback(() => {
			return getValidSession();
		}, []);

		// getValidSession comes from createAuthActions
		return (
			<SessionProvider session={props.session} getValidSession={getValidSessionAction}>
				{props.children}
			</SessionProvider>
		);
	}

	------

	Use in your layout

	const session = await client.getSession()
	...
	<ClientSessionProvider session={session}>
		{children}
	</ClientSessionProvider>
*/
