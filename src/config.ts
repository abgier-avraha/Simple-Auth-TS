import type { ISerializer } from "./serialization.js";
import type { IStorage } from "./storage.js";

export interface SimpleAuthPublicClientConfig<TSession, TState> {
	client_id: string;
	redirect_uri: string;
	scope: string[];
	sessionSerialiser: ISerializer<TSession>;
	stateSerialiser: ISerializer<TState>;
	storage: IStorage;
}

export interface SimpleAuthConfidentialClientConfig<TSession, TState>
	extends SimpleAuthPublicClientConfig<TSession, TState> {
	client_secret: string;
}

// TODO: add cognito credentials provider, uses direct aws sdk API call to get token
