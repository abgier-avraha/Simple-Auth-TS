import type { SimpleAuthConfidentialClientConfig } from "./config.js";

const STORAGE_KEYS = {
	ACCESS_TOKEN: "SIMPLE_AUTH_ID_TOKEN",
	ID_TOKEN: "SIMPLE_AUTH_ACCESS_TOKEN",
	STATE: "SIMPLE_AUTH_STATE",
};

interface IDiscoveryDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	jwks_uri: string;
	introspection_endpoint: string;
	scopes_supported: string[];
}

export class ConfidentialClient<TAccessToken, TState, TIdToken, TUserInfo> {
	private cachedDiscoveryDocument?: IDiscoveryDocument;

	constructor(
		private config: SimpleAuthConfidentialClientConfig<
			TAccessToken,
			TState,
			TIdToken,
			TUserInfo
		>,
	) {}

	// TODO: add token validation for id and access

	public async getSignInUrl(state: TState) {
		const serializedState = await this.config.stateSerialiser.stringify(state);
		await this.config.storage.save(STORAGE_KEYS.STATE, serializedState);

		const params = new URLSearchParams({
			response_type: "code",
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUrl,
			scope: this.config.scope.join(" "),
			state: serializedState,
		});

		const discoveryDocument = await this.getDiscoveryDocument();

		if (discoveryDocument) {
			if (
				!this.config.scope.every((s) =>
					discoveryDocument.scopes_supported.includes(s),
				)
			) {
				throw new Error(
					`Invalid scopes, supported scopes are ${discoveryDocument.scopes_supported.join(", ")}`,
				);
			}
		}

		if (this.config.endpoints.authorize) {
			return `${this.config.endpoints.authorize}?${params.toString()}`;
		} else if (discoveryDocument) {
			return `${discoveryDocument.authorization_endpoint}?${params.toString()}`;
		}

		throw new Error(
			"No authorization endpoint found in config or discovery document.",
		);
	}

	public async getSignOutUrl() {
		// TODO: get sign out url
	}

	public async getIdToken() {
		const serializedSession = await this.config.storage.load(
			STORAGE_KEYS.ID_TOKEN,
		);
		if (!serializedSession) {
			return undefined;
		}
		return await this.config.accessTokenSerialiser.parse(serializedSession);
	}

	public async getAccessToken() {
		const serializedSession = await this.config.storage.load(
			STORAGE_KEYS.ACCESS_TOKEN,
		);
		if (!serializedSession) {
			return undefined;
		}
		return await this.config.accessTokenSerialiser.parse(serializedSession);
	}

	public async deleteSession() {
		await this.config.storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.ID_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.STATE);
	}

	// TODO: redirect handler
	public async handleRedirect(
		_requestedUrl: string,
	): Promise<{ session: TAccessToken; state: TState } | { error: string }> {
		// TODO: parse /authorize redirect and store code

		// Load initial login state
		const serializedState = await this.config.storage.load(STORAGE_KEYS.STATE);
		if (serializedState === undefined) {
			throw new Error("State string not found in storage.");
		}
		const state = await this.config.stateSerialiser.parse(serializedState);

		// TODO: store access token
		// TODO: store id token

		// Cleanup
		await this.config.storage.delete(STORAGE_KEYS.STATE);

		return { session: {} as TAccessToken, state: state };
	}

	private async getDiscoveryDocument(): Promise<
		IDiscoveryDocument | undefined
	> {
		if (this.cachedDiscoveryDocument) {
			return this.cachedDiscoveryDocument;
		}

		const discoveryUrl = this.config.endpoints.discovery
			? this.config.endpoints.discovery
			: `${this.config.endpoints.issuer}/.well-known/openid-configuration`;

		try {
			const res = await fetch(discoveryUrl);
			if (!res.ok) {
				throw new Error(
					`Failed to fetch discovery document: ${res.status} ${res.statusText}`,
				);
			}

			const data = await res.json();
			console.log(discoveryUrl);

			// Optionally pick specific fields you care about:
			this.cachedDiscoveryDocument = {
				issuer: data.issuer,
				authorization_endpoint: data.authorization_endpoint,
				token_endpoint: data.token_endpoint,
				userinfo_endpoint: data.userinfo_endpoint,
				jwks_uri: data.jwks_uri,
				introspection_endpoint: data.introspection_endpoint,
				scopes_supported: data.scopes_supported,
			};
			return this.cachedDiscoveryDocument;
		} catch (err) {
			console.error("Error fetching discovery document:", err);
		}
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
// - [x] geTAccessToken() // This will auto refresh the token if expired
// - [x] deleteSession()
// - [x] redirectHandler(HTTP req url) // This willl then trigger the session persistence
