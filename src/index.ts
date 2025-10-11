import type { SimpleAuthConfidentialClientConfig } from "./config.js";

const STORAGE_KEYS = {
	SESSION: "SIMPLE_AUTH_SESSION",
	STATE: "SIMPLE_AUTH_STATE",
};

export class ConfidentialClient<TSession, TState> {
	constructor(
		private config: SimpleAuthConfidentialClientConfig<TSession, TState>,
	) {}

	public async getSignInUrl(state: TState) {
		const serializedState = await this.config.stateSerialiser.stringify(state);
		await this.config.storage.save(STORAGE_KEYS.STATE, serializedState);

		const params = new URLSearchParams({
			response_type: "code",
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri,
			scope: this.config.scope.join(" "),
			state: serializedState,
		});

		return `${this.config.issuerUrl}/authorize?${params.toString()}`;
	}

	public async getSignOutUrl() {
		// TODO: get sign out url
	}

	public async getSession() {
		const serializedSession = await this.config.storage.load(
			STORAGE_KEYS.SESSION,
		);
		if (!serializedSession) {
			return undefined;
		}
		return await this.config.sessionSerialiser.parse(serializedSession);
	}

	public async deleteSession() {
		await this.config.storage.delete(STORAGE_KEYS.SESSION);
	}

	// TODO: redirect handler
	public async handleRedirect(
		_requestedUrl: string,
	): Promise<{ session: TSession; state: TState } | { error: string }> {
		// TODO: parse /authorize redirect and store code

		// Load initial login state
		const serializedState = await this.config.storage.load(STORAGE_KEYS.STATE);
		if (serializedState === undefined) {
			throw new Error("State string not found in storage.");
		}
		const state = await this.config.stateSerialiser.parse(serializedState);

		// Cleanup
		await this.config.storage.delete(STORAGE_KEYS.STATE);

		return { session: {} as TSession, state: state };
	}
}

// TODO: class that consumes the config to be used on confidential clients
// TODO: method to output a public client config which omits all of the client secrets
// TODO: class that consumes the config to be used on public clients

// Config<SessionGeneric>
// - [x] OIDC provider config ??? Auth code flow only?

// Session persistence
// Has its own interface, comes with drivers and no-op driver
// - [x] storeSession(token)
// - [x] loadSession()

// Public methods
// - [x] getSignInUrl()
// - [x] getSignOutUrl()
// - [x] getSession() // This will auto refresh the token if expired
// - [x] deleteSession()
// - [x] redirectHandler(HTTP req url) // This willl then trigger the session persistence
