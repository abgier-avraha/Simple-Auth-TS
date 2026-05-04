"use client";

import type React from "react";
import { useCallback } from "react";
// TODO: import from lib
import type { AuthSession } from "../../../core/dist/session";
import { SessionProvider } from "simple-auth-ts-next";
import { getValidSession } from "../auth/actions";

export function ClientSessionProvider(props: {
	session: AuthSession | undefined;
	children: React.ReactNode;
}) {
	const getValidSessionAction = useCallback(() => {
		return getValidSession();
	}, []);

	return (
		<SessionProvider
			session={props.session}
			getValidSession={getValidSessionAction}
		>
			{props.children}
		</SessionProvider>
	);
}
