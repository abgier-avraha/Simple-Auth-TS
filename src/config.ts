import type { ISerializer } from "./serialization.js";
import type { IStorage } from "./storage.js";

export interface SimpleAuthPublicClientConfig<TSession, TState> {
	// TODO: add optional override for authorize url
	// TODO: add optional override for token url
	// TODO: add optional override discovery endpoint override
	issuerUrl: string;
	clientId: string;
	redirectUri: string;
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
// TODO: or just allow devs to manually call the AWS API and use the storage methods to save the JWT
