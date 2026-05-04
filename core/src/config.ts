import type { ISerializer } from "./serialization";
import type { IStorage } from "./storage";

export interface SimpleAuthPublicClientConfig<TState> {
	// OIDC
	endpoints: {
		issuer: string;
		discovery?: string;
		token?: string;
		authorize?: string;
		end_session?: string;
		userInfo?: string;
	};
	clientId: string;
	redirectUrl: string;
	postLogoutRedirectUri?: string;
	scope: string[];

	// Serializes the state before storing
	stateSerializer: ISerializer<TState>;
	// For storing the serialized state or session
	storage: IStorage;

	// Validation
	clockToleranceSeconds?: number;
	audience?: string;
}

export interface SimpleAuthConfidentialClientConfig<TState extends {}>
	extends SimpleAuthPublicClientConfig<TState> {
	clientSecret: string;
}
