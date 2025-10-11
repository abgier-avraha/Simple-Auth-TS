import { AESEncryption } from "./encryption.js";

export interface ISerializer<T> {
	stringify: (data: T) => Promise<string>;
	parse: (string: string) => Promise<T>;
}

// Default serializer: base64 + JSON
export class DefaultSerializer<T> implements ISerializer<T> {
	async stringify(data: T): Promise<string> {
		return btoa(JSON.stringify(data));
	}

	async parse(data: string): Promise<T> {
		return JSON.parse(atob(data));
	}
}

// Encrypted serializer: wraps another serializer (composition)
export class EncryptedSerializer<T> implements ISerializer<T> {
	private readonly aes: AESEncryption;
	private readonly innerSerializer: ISerializer<T>;

	constructor(key: string) {
		this.aes = new AESEncryption(key);
		this.innerSerializer = new DefaultSerializer<T>();
	}

	async stringify(data: T): Promise<string> {
		const serialized = await this.innerSerializer.stringify(data);
		return this.aes.encrypt(serialized);
	}

	async parse(data: string): Promise<T> {
		const decrypted = this.aes.decrypt(data);
		return this.innerSerializer.parse(decrypted);
	}
}
