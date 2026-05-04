"use client";

import { useEffect, useState } from "react";
import { getLoginUrl } from "../auth/actions";

export function LoginButton() {
	const [loginUrl, setLoginUrl] = useState<string>();

	useEffect(() => {
		getLoginUrl({ state: { redirectTo: "/" } }).then((s) => setLoginUrl(s));
	}, []);

	return (
		<a
			href={loginUrl}
			className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
		>
			<span>Log In</span>
		</a>
	);
}
