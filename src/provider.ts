import type {
	SimpleAuthConfidentialClientConfig,
	SimpleAuthPublicClientConfig,
} from "./config.js";

export interface SimpleAuthConfidentialProvider<TSession, TState> {
	label: string;
	config:
		| SimpleAuthConfidentialClientConfig<TSession, TState>
		| SimpleAuthPublicClientConfig<TSession, TState>;
}

export interface SimpleAuthPublicProvider<TSession, TState> {
	label: string;
	config:
		| SimpleAuthConfidentialClientConfig<TSession, TState>
		| SimpleAuthPublicClientConfig<TSession, TState>;
}
