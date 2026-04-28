import { createRemoteJWKSet, jwtVerify } from "jose";
import type { SimpleAuthConfidentialClientConfig } from "./config.js";

export const STORAGE_KEYS = {
	ACCESS_TOKEN: "SIMPLE_AUTH_ID_TOKEN",
	ID_TOKEN: "SIMPLE_AUTH_ACCESS_TOKEN",
	REFRESH_TOKEN: "SIMPLE_AUTH_REFRESH_TOKEN",
	STATE: "SIMPLE_AUTH_STATE",
};

interface IDiscoveryDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	end_session_endpoint: string;
	jwks_uri: string;
	introspection_endpoint: string;
	scopes_supported: string[];
	grant_types_supported: string[];
}

export class ConfidentialClient<TState extends {}, TUserInfo> {
	private cachedDiscoveryDocument?: IDiscoveryDocument;
	private cachedJwksSet?: ReturnType<typeof createRemoteJWKSet>;

	constructor(
		private config: SimpleAuthConfidentialClientConfig<TState, TUserInfo>,
	) {}

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
		const discoveryDocument = await this.getDiscoveryDocument();

		if (this.config.endpoints.authorize) {
			return this.config.endpoints.end_sesssion;
		} else if (discoveryDocument) {
			return discoveryDocument.end_session_endpoint;
		}

		throw new Error(
			"No end session endpoint found in config or discovery document.",
		);
	}

	public async getIdToken() {
		const idToken = await this.config.storage.load(STORAGE_KEYS.ID_TOKEN);
		if (!idToken) {
			return undefined;
		}
		return idToken;
	}

	public async getAccessToken() {
		const accessToken = await this.config.storage.load(
			STORAGE_KEYS.ACCESS_TOKEN,
		);
		if (!accessToken) {
			return undefined;
		}
		return accessToken;
	}

	public async getRefreshToken() {
		const refreshToken = await this.config.storage.load(
			STORAGE_KEYS.REFRESH_TOKEN,
		);
		if (!refreshToken) {
			return undefined;
		}
		return refreshToken;
	}

	public async deleteSession() {
		await this.config.storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.ID_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.STATE);
	}

	public async handleRedirect(requestedUrl: string): Promise<{
		idToken: string;
		accessToken: string;
		refreshToken: string;
		state: TState;
	}> {
		// Load initial login state
		const serializedState = await this.config.storage.load(STORAGE_KEYS.STATE);
		if (serializedState === undefined) {
			throw new Error("State string not found in storage.");
		}
		const state = await this.config.stateSerialiser.parse(serializedState);

		// Code exchange
		const redirectUrlParams = this.parseQueryParams(requestedUrl);
		const bodyData = {
			grant_type: "authorization_code",
			code: redirectUrlParams.code,
			redirect_uri: this.config.redirectUrl,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
		};

		const body = Object.entries(bodyData)
			.map(
				([key, value]) =>
					`${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
			)
			.join("&");

		const discoveryDocument = await this.getDiscoveryDocument();
		let tokenUrl: string | undefined;
		if (this.config.endpoints.token) {
			tokenUrl = this.config.endpoints.token;
		} else if (discoveryDocument) {
			tokenUrl = discoveryDocument.token_endpoint;
		} else {
			throw new Error(
				"No end token endpoint found in config or discovery document.",
			);
		}

		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		const tokenData: {
			access_token: string;
			id_token: string;
			refresh_token: string;
			error: string;
			error_description: string;
		} = await response.json();

		// Cleanup
		await this.config.storage.delete(STORAGE_KEYS.STATE);

		// Throw error if error in code exchange response
		if (tokenData.error) {
			throw new Error(
				JSON.stringify({
					error: tokenData.error,
					error_description: tokenData.error_description,
				}),
			);
		}

		// Store all tokens
		if (tokenData.access_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.access_token,
			);
			this.config.storage.save(STORAGE_KEYS.ACCESS_TOKEN, serialised);
		}

		if (tokenData.id_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.id_token,
			);
			this.config.storage.save(STORAGE_KEYS.ID_TOKEN, serialised);
		}

		if (tokenData.refresh_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.refresh_token,
			);
			this.config.storage.save(STORAGE_KEYS.REFRESH_TOKEN, serialised);
		}

		return {
			idToken: tokenData.id_token,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			state: state,
		};
	}

	public async validateJWT(token: string) {
		const discoveryDocument = await this.getDiscoveryDocument();
		if (!discoveryDocument) {
			throw new Error("Discovery document not found");
		}

		const jwksSet = await this.getJwksSet(discoveryDocument);

		return await jwtVerify(token, jwksSet, {
			issuer: discoveryDocument.issuer,
			// TODO: validate audience? Maybe an auth config option?
			// audience: this.config.clientId,
			clockTolerance: this.config.validationOptions?.clockToleranceSeconds,
		});
	}

	public async refreshTokens(): Promise<{
		idToken: string;
		accessToken: string;
		refreshToken: string;
	}> {
		// 1. Load refresh token from storage
		const storedRefreshToken = await this.config.storage.load(
			STORAGE_KEYS.REFRESH_TOKEN,
		);

		if (!storedRefreshToken) {
			throw new Error("No refresh token found in storage.");
		}

		const refreshToken =
			await this.config.tokenSerialiser.parse(storedRefreshToken);

		// 2. Resolve token endpoint
		const discoveryDocument = await this.getDiscoveryDocument();

		let tokenUrl: string | undefined;
		if (this.config.endpoints.token) {
			tokenUrl = this.config.endpoints.token;
		} else if (discoveryDocument) {
			tokenUrl = discoveryDocument.token_endpoint;
		} else {
			throw new Error(
				"No token endpoint found in config or discovery document.",
			);
		}

		// 3. Build request body
		const bodyData = {
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
		};

		const body = Object.entries(bodyData)
			.map(
				([key, value]) =>
					`${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
			)
			.join("&");

		// 4. Call token endpoint
		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		const tokenData: {
			id_token: string;
			access_token: string;
			refresh_token: string;
			error?: string;
			error_description?: string;
		} = await response.json();

		// 5. Handle errors
		if (tokenData.error) {
			throw new Error(
				JSON.stringify({
					error: tokenData.error,
					error_description: tokenData.error_description,
				}),
			);
		}

		// 6. Store updated tokens
		if (tokenData.access_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.access_token,
			);
			await this.config.storage.save(STORAGE_KEYS.ACCESS_TOKEN, serialised);
		}

		if (tokenData.id_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.id_token,
			);
			await this.config.storage.save(STORAGE_KEYS.ID_TOKEN, serialised);
		}

		// Important: refresh token may be rotated
		if (tokenData.refresh_token) {
			const serialised = await this.config.tokenSerialiser.stringify(
				tokenData.refresh_token,
			);
			await this.config.storage.save(STORAGE_KEYS.REFRESH_TOKEN, serialised);
		}

		return {
			accessToken: tokenData.access_token,
			idToken: tokenData.id_token,
			refreshToken: tokenData.refresh_token,
		};
	}

	public async getDiscoveryDocument(): Promise<IDiscoveryDocument | undefined> {
		// TODO: use a cache key
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

			// Optionally pick specific fields you care about:
			this.cachedDiscoveryDocument = {
				issuer: data.issuer,
				authorization_endpoint: data.authorization_endpoint,
				token_endpoint: data.token_endpoint,
				userinfo_endpoint: data.userinfo_endpoint,
				jwks_uri: data.jwks_uri,
				introspection_endpoint: data.introspection_endpoint,
				end_session_endpoint: data.end_session_endpoint,
				scopes_supported: data.scopes_supported,
				grant_types_supported: data.grant_types_supported,
			};

			return this.cachedDiscoveryDocument;
		} catch (err) {
			console.error("Error fetching discovery document:", err);
		}
	}

	// TODO: add a config option to auto refresh
	// TODO: check the exp of the tokens before reading and auto refresh if enabled

	private async getJwksSet(discoveryDocument: IDiscoveryDocument) {
		if (!this.cachedJwksSet) {
			this.cachedJwksSet = createRemoteJWKSet(
				new URL(discoveryDocument.jwks_uri),
			);
		}

		return this.cachedJwksSet;
	}

	private parseQueryParams(urlStr: string): Record<string, string> {
		const parsedUrl = new URL(urlStr);
		const params: Record<string, string> = {};

		parsedUrl.searchParams.forEach((value, key) => {
			params[key] = value;
		});

		return params;
	}
}
