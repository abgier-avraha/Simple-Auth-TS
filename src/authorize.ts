// Authorize request
export interface SimpleAuthAuthorizeConfidentialClientRequest {
	response_type: "code";
	client_id: string;
	redirect_uri: string;
	scope: string;
	state: string;
}

export interface SimpleAuthAuthorizePublicClientRequest
	extends SimpleAuthAuthorizeConfidentialClientRequest {
	code_challenge: string;
	code_challenge_method: string;
}

// Authorize reponse
export interface SimpleAuthAuthorizeResponse {
	code: string;
	state: string;
}
