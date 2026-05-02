"use client";

import type React from "react";
import { createContext, useContext } from "react";

// TODO: fix this import to come from lib
import type { AuthSession } from "../../core/dist/session";

export type SessionContextValue = {
	session: AuthSession | undefined;
};

const SessionContext = createContext<SessionContextValue | undefined>(
	undefined,
);

export function NextSessionProvider({
	session,
	children,
}: {
	session: AuthSession | undefined;
	children: React.ReactNode;
}) {
	return (
		<SessionContext.Provider value={{ session }}>
			{children}
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

	const session = await client.getValidSession()
	...
	<SessionProvider session={session}>
		...
	</SessionProvider>
*/
