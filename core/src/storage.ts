export interface IStorage {
	save(key: string, value: string): Promise<void>;
	load(key: string): Promise<string | undefined>;
	delete(key: string): Promise<void>;
}

export class LocalStorage implements IStorage {
	async save(key: string, value: string): Promise<void> {
		localStorage.setItem(key, value);
	}

	async load(key: string): Promise<string | undefined> {
		return localStorage.getItem(key) ?? undefined;
	}

	async delete(key: string): Promise<void> {
		localStorage.removeItem(key);
	}
}

export class InMemoryStorage implements IStorage {
	private store: Map<string, string>;

	constructor() {
		this.store = new Map();
	}

	async save(key: string, value: string): Promise<void> {
		this.store.set(key, value);
	}

	async load(key: string): Promise<string | undefined> {
		return this.store.get(key);
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}
