import type {
	SimpleAuthConfidentialClientConfig,
	SimpleAuthPublicClientConfig,
} from "./config.js";

export interface SimpleAuthProvider<TSession, TState> {
	label: string;
	config:
		| SimpleAuthConfidentialClientConfig<TSession, TState>
		| SimpleAuthPublicClientConfig<TSession, TState>;
}
