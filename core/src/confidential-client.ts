import { createRemoteJWKSet, jwtVerify } from "jose";
import type { SimpleAuthConfidentialClientConfig } from "./config";
import { AuthError } from "./auth-error";
import type { AuthSession } from "./session";

// TODO: add verbose logging
// TODO: expose storage for custom token retrieval like amplify

export const STORAGE_KEYS = {
	ACCESS_TOKEN: "SIMPLE_AUTH_ACCESS_TOKEN",
	ID_TOKEN: "SIMPLE_AUTH_ID_TOKEN",
	REFRESH_TOKEN: "SIMPLE_AUTH_REFRESH_TOKEN",
};

export type AuthResponse<TState> = AuthSession & {
	state: TState;
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

export class ConfidentialClient<TState extends {}> {
	private cachedDiscoveryDocument?: IDiscoveryDocument;
	private cachedJwksSet?: ReturnType<typeof createRemoteJWKSet>;

	constructor(private config: SimpleAuthConfidentialClientConfig<TState>) {}

	public async getSignInUrl(state: TState) {
		const serializedState = await this.config.stateSerializer.stringify(state);

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
				throw new AuthError(
					"Invalid scopes",
					`Invalid scopes, supported scopes are ${discoveryDocument.scopes_supported.join(", ")}`,
				);
			}
		}

		if (this.config.endpoints.authorize) {
			return `${this.config.endpoints.authorize}?${params.toString()}`;
		} else if (discoveryDocument) {
			return `${discoveryDocument.authorization_endpoint}?${params.toString()}`;
		}

		throw new AuthError(
			"Authorization endpoint missing",
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

		throw new AuthError(
			"End session endpoint missing",
			"No end session endpoint found in config or discovery document.",
		);
	}

	public async getSession(): Promise<AuthSession | undefined> {

		const accessToken = await this.getAccessToken();

		if (!accessToken) {
			return undefined;
		}

		return {
			accessToken:accessToken,
			idToken: await this.getIdToken(),
			refreshToken: await this.getRefreshToken(),
		};
	}


	// Will automatically refresh your session
	public async getValidSession(args?: { forceRefresh: boolean }): Promise<AuthSession | undefined>  {
		const accessToken = await this.getAccessToken();

		if (!accessToken) {
			return undefined;
		}

		// No refresh required
		if (!this.isExpired(accessToken) && !args?.forceRefresh) {
			return {
				accessToken,
				idToken: await this.getIdToken(),
				refreshToken: await this.getRefreshToken(),
			};
		}

		// Refresh token expired
		if (this.isExpired(accessToken)) {
			this.deleteSession();
		}

		// Refresh
		return await this.refreshTokens();
	}

	public async deleteSession() {
		await this.config.storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.ID_TOKEN);
		await this.config.storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
	}

	public async handleRedirect(
		requestedUrl: string,
	): Promise<AuthResponse<TState>> {
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
			throw new AuthError(
				"Token endpoint missing",
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
			id_token?: string;
			refresh_token?: string;
			error?: string;
			error_description?: string;
		} = await response.json();

		// Throw error if error in code exchange response
		if (tokenData.error) {
			throw new AuthError(tokenData.error, tokenData.error_description ?? "");
		}

		// Store all tokens
		if (tokenData.access_token) {
			await this.setAccessToken(tokenData.access_token);
		}

		if (tokenData.id_token) {
			await this.setIdToken(tokenData.id_token);
		}

		// Important: refresh token may be rotated
		if (tokenData.refresh_token) {
			await this.setRefreshToken(tokenData.refresh_token);
		}

		const state = await this.config.stateSerializer.parse(
			redirectUrlParams.state,
		);

		return {
			idToken: tokenData.id_token,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			state: state,
		};
	}

	public async verifyJwt(
		token: string,
		args?: { disableAudienceValidation?: boolean },
	) {
		const discoveryDocument = await this.getDiscoveryDocument();
		if (!discoveryDocument) {
			throw new AuthError(
				"Missing discovery document",
				"Discovery document not found",
			);
		}

		const jwksSet = await this.getJwksSet(discoveryDocument);

		const validateAudience =
			!args?.disableAudienceValidation && this.config.audience !== undefined;

		return await jwtVerify(token, jwksSet, {
			issuer: discoveryDocument.issuer,
			audience: validateAudience ? this.config.audience : undefined,
			clockTolerance: this.config.clockToleranceSeconds,
		});
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
				throw new AuthError(
					"Discovery document missing",
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

	private async refreshTokens(): Promise<AuthSession> {
		// 1. Load refresh token from storage
		const refreshToken = await this.getRefreshToken();

		if (!refreshToken) {
			throw new AuthError(
				"Refresh token missing",
				"No refresh token found in storage.",
			);
		}

		// 2. Resolve token endpoint
		const discoveryDocument = await this.getDiscoveryDocument();

		let tokenUrl: string | undefined;
		if (this.config.endpoints.token) {
			tokenUrl = this.config.endpoints.token;
		} else if (discoveryDocument) {
			tokenUrl = discoveryDocument.token_endpoint;
		} else {
			throw new AuthError(
				"Token endpoint missing",
				"No end token endpoint found in config or discovery document.",
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
			throw new AuthError(tokenData.error, tokenData.error_description ?? "");
		}

		// 6. Store updated tokens
		if (tokenData.access_token) {
			await this.setAccessToken(tokenData.access_token);
		}

		if (tokenData.id_token) {
			await this.setIdToken(tokenData.id_token);
		}

		// Important: refresh token may be rotated
		if (tokenData.refresh_token) {
			await this.setRefreshToken(tokenData.refresh_token);
		}

		return {
			accessToken: tokenData.access_token,
			idToken: tokenData.id_token,
			refreshToken: tokenData.refresh_token,
		};
	}

	public getConfig() {
		return this.config;
	}

	private async getIdToken() {
		const idToken = await this.config.storage.load(STORAGE_KEYS.ID_TOKEN);
		if (!idToken) {
			return undefined;
		}
		return this.config.tokenSerializer.parse(idToken);
	}

	private async getAccessToken() {
		const accessToken = await this.config.storage.load(
			STORAGE_KEYS.ACCESS_TOKEN,
		);
		if (!accessToken) {
			return undefined;
		}
		return this.config.tokenSerializer.parse(accessToken);
	}

	private async getRefreshToken() {
		const refreshToken = await this.config.storage.load(
			STORAGE_KEYS.REFRESH_TOKEN,
		);
		if (!refreshToken) {
			return undefined;
		}
		return this.config.tokenSerializer.parse(refreshToken);
	}

	private async setIdToken(token: string) {
		const serialized = await this.config.tokenSerializer.stringify(token);
		await this.config.storage.save(STORAGE_KEYS.ID_TOKEN, serialized);
	}

	private async setAccessToken(token: string) {
		const serialized = await this.config.tokenSerializer.stringify(token);
		await this.config.storage.save(STORAGE_KEYS.ACCESS_TOKEN, serialized);
	}

	private async setRefreshToken(token: string) {
		const serialized = await this.config.tokenSerializer.stringify(token);
		await this.config.storage.save(STORAGE_KEYS.REFRESH_TOKEN, serialized);
	}

	private isExpired(token: string): boolean {
		const [, payloadBase64] = token.split(".");
		const payload = JSON.parse(
			Buffer.from(payloadBase64, "base64").toString("utf-8"),
		);

		const now = Math.floor(Date.now() / 1000);
		return !payload.exp || payload.exp <= now + 30;
	}

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
