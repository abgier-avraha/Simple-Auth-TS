// Token request
export interface SimpleAuthTokenRequest {
	grant_type: "authorization_code";
	code: string;
	redirect_uri: string;
	client_id: string;
	client_secret: string;
	code_verifier: string;
}

export interface SimpleAuthTokenConfidentialClientRequest
	extends SimpleAuthTokenRequest {
	client_secret: string;
}

export interface SimpleAuthTokenPublicClientRequest
	extends SimpleAuthTokenRequest {
	code_verifier: string;
}

// Token response
export interface SimpleAuthTokenTokenResponse {
	access_token: string;
	id_token?: string;
	refresh_token?: string;
}
