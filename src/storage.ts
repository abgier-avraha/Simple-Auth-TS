export interface IStorage {
	save(key: string, value: string): Promise<void>;
	load(key: string): Promise<string | null>;
}

export const getDefaultLocalStorage: () => IStorage = () => ({
	save: async (key: string, value: string) => {
		return localStorage.setItem(key, value);
	},

	load: async (key: string) => {
		return localStorage.getItem(key);
	},
});
