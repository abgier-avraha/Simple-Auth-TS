import type { ISerializer } from "./serialization.js";
import type { IStorage } from "./storage.js";

export interface SimpleAuthPublicClientConfig<TState, TUserInfo> {
	endpoints: {
		issuer: string;
		discovery?: string;
		token?: string;
		authorize?: string;
		end_sesssion?: string;
		userInfo?: string;
	};
	clientId: string;
	redirectUrl: string;
	scope: string[];
	// Serialises access tokens, id tokens and refresh tokens
	tokenSerialiser: ISerializer<string>;
	// Serialises the user info before storing
	userInfoSerialiser?: ISerializer<TUserInfo>;
	// Serialises the state before storing
	stateSerialiser: ISerializer<TState>;
	// For storing the serialised state or session
	storage: IStorage;
	validationOptions?: {
		clockToleranceSeconds?: number;
	};
}

export interface SimpleAuthConfidentialClientConfig<
	TState extends {},
	TUserInfo,
> extends SimpleAuthPublicClientConfig<TState, TUserInfo> {
	clientSecret: string;
}

// TODO: add cognito credentials provider, uses direct aws sdk API call to get token
// TODO: or just allow devs to manually call the AWS API and use the storage methods to save the JWT
