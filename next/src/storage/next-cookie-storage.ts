import { cookies } from "next/headers";
import type { IStorage } from "simple-auth-ts";

export interface NextCookieStorageOptions {
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	path?: string;
	domain?: string;
	maxAge?: number;
}

export class NextCookieStorage implements IStorage {
	constructor(private options: Partial<NextCookieStorageOptions> = {}) {}

	async save(key: string, value: string): Promise<void> {
		const store = await cookies();

		store.set(key, value, {
			...this.options,
		});
	}

	async load(key: string): Promise<string | undefined> {
		const store = await cookies();
		return store.get(key)?.value;
	}

	async delete(key: string): Promise<void> {
		const store = await cookies();

		store.delete({
			name: key,
			path: this.options.path,
			domain: this.options.domain,
		});
	}
}
