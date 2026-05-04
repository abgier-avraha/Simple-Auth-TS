import { cookies } from "next/headers";
import type { ISerializer, IStorage } from "simple-auth-ts";

export interface NextCookieStorageOptions {
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	path?: string;
	domain?: string;
	maxAge?: number;
}

export class NextCookieStorage implements IStorage {
	constructor(
		private serializer: ISerializer<string>,
		private options: Partial<NextCookieStorageOptions> = {},
	) {}

	async save(key: string, value: string): Promise<void> {
		const serializedValue = await this.serializer.stringify(value);
		const store = await cookies();

		store.set(key, serializedValue, {
			...this.options,
		});
	}

	async load(key: string): Promise<string | undefined> {
		const store = await cookies();
		const value = store.get(key)?.value;

		if (value) {
			return await this.serializer.parse(value);
		}

		return undefined;
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
