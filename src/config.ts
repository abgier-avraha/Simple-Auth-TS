import type { ISerializer } from "./serialization.js";
import type { IStorage } from "./storage.js";

export interface SimpleAuthPublicClientConfig<
	TAccessToken,
	TState,
	TIdToken,
	TUserInfo,
> {
	endpoints: {
		issuer: string;
		discovery?: string;
		token?: string;
		authorize?: string;
		revocation?: string;
		userInfo?: string;
	};
	clientId: string;
	redirectUrl: string;
	scope: string[];
	// Serialises the session before storing
	accessTokenSerialiser: ISerializer<TAccessToken>;
	// Serialises the session before storing
	idTokenSerialiser?: ISerializer<TIdToken>;
	// Serialises the user info before storing
	userInfoSerialiser?: ISerializer<TUserInfo>;
	// Serialises the state before storing
	stateSerialiser: ISerializer<TState>;
	// For storing the serialised state or session
	storage: IStorage;
}

export interface SimpleAuthConfidentialClientConfig<
	TAccessToken,
	TState,
	TIdToken,
	TUserInfo,
> extends SimpleAuthPublicClientConfig<
		TAccessToken,
		TState,
		TIdToken,
		TUserInfo
	> {
	clientSecret: string;
}

// TODO: add cognito credentials provider, uses direct aws sdk API call to get token
// TODO: or just allow devs to manually call the AWS API and use the storage methods to save the JWT
