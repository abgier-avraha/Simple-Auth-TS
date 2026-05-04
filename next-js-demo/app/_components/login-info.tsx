"use client";

import { useSession } from "simple-auth-ts-next";

export function LoginInfo() {
	const { session } = useSession();

	if (session) {
		return (
			<div className="break-all">
				Logged in with token {session.accessToken}
			</div>
		);
	}
	return null;
}
