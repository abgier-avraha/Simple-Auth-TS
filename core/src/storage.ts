import type { ISerializer } from "./serialization";

export interface IStorage {
	save(key: string, value: string): Promise<void>;
	load(key: string): Promise<string | undefined>;
	delete(key: string): Promise<void>;
}

export class LocalStorage implements IStorage {
	constructor(private serializer: ISerializer<string>) {}

	async save(key: string, value: string): Promise<void> {
		const serializedValue = await this.serializer.stringify(value);
		localStorage.setItem(key, serializedValue);
	}

	async load(key: string): Promise<string | undefined> {
		const value = localStorage.getItem(key);

		if (value) {
			return await this.serializer.parse(value);
		}

		return undefined;
	}

	async delete(key: string): Promise<void> {
		localStorage.removeItem(key);
	}
}

export class InMemoryStorage implements IStorage {
	private store = new Map<string, string>();

	constructor(private serializer: ISerializer<string>) {}

	async save(key: string, value: string): Promise<void> {
		const serializedValue = await this.serializer.stringify(value);
		this.store.set(key, serializedValue);
	}

	async load(key: string): Promise<string | undefined> {
		const value = this.store.get(key);

		if (value) {
			return await this.serializer.parse(value);
		}

		return undefined;
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}
