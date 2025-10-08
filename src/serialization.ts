import { AESEncryption } from "./encryption.js";

export interface ISerializer<T> {
	stringify: (data: T) => string;
	parse: (string: string) => T;
}

export const getDefaultSerializer: <T>() => ISerializer<T> = () => {
	return {
		stringify(data) {
			return btoa(JSON.stringify(data));
		},
		parse(data) {
			return JSON.parse(atob(data));
		},
	};
};

export const getDefaultEncryptedSerializer = <T>(
	key: string,
): ISerializer<T> => {
	const defaultSerializer = getDefaultSerializer();
	const aes = new AESEncryption(key);

	return {
		stringify(data: T): string {
			return aes.encrypt(defaultSerializer.stringify(data));
		},

		parse(data: string): T {
			return defaultSerializer.parse(aes.decrypt(data)) as T;
		},
	};
};
