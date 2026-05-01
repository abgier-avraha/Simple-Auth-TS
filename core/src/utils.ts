export function assertDefined<T>(value: T, message?: string): NonNullable<T> {
	if (value === undefined || value === null) {
		throw new Error(message ?? "Value must be defined");
	}
	return value;
}

export const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
