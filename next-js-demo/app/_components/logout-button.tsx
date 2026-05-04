"use client";

import { useEffect, useState } from "react";
import { getSignOutUrl } from "../auth/actions";

export function LogoutButton() {
	const [signoutUrl, setSignoutUrl] = useState<string>();

	useEffect(() => {
		getSignOutUrl().then((s) => setSignoutUrl(s));
	}, []);

	return (
		<a
			href={signoutUrl}
			className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
		>
			<span>Log out</span>
		</a>
	);
}
