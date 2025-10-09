import type { ISerializer } from "./serialization.js";
import type { IStorage } from "./storage.js";

export interface SimpleAuthPublicClientConfig<TSession, TState> {
	client_id: string;
	redirect_uri: string;
	scope: string[];
	// Serialises the session before storing
	sessionSerialiser: ISerializer<TSession>;
	// Serialises the state before storing
	stateSerialiser: ISerializer<TState>;
	// For storing the serialised state or session
	storage: IStorage;
}

export interface SimpleAuthConfidentialClientConfig<TSession, TState>
	extends SimpleAuthPublicClientConfig<TSession, TState> {
	client_secret: string;
}

// TODO: add cognito credentials provider, uses direct aws sdk API call to get token
