export class AuthError extends Error {
	constructor(
		public code: string,
		public description: string,
	) {
		super(code);
		this.name = "AuthError";
	}
}
