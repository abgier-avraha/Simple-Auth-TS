import { SimpleAuthConfidentialClientConfig } from "./config.js";
import { SimpleAuthConfidentialProvider } from "./provider.js";
import { assertDefined } from "./utils.js";

const STORAGE_KEYS = {
	SESSION: "SIMPLE_AUTH_SESSION",
	STATE: "SIMPLE_AUTH_STATE",
};

export class ConfidentialClient<
	TConfigs extends readonly SimpleAuthConfidentialProvider<unknown, unknown>[],
	TConfigLabel = TConfigs[number]["label"],
> {
	constructor(private configs: TConfigs) {}

	public getSignInUrl(providerLabel: TConfigLabel) {
		const provider = this.getProvider(providerLabel);
		// TODO: get sign in url
	}

	public getSignOutUrl(providerLabel: TConfigLabel) {
		const provider = this.getProvider(providerLabel);
		// TODO: get sign out url
	}

	public getSession(providerLabel: TConfigLabel) {
		const provider = this.getProvider(providerLabel);
		assertDefined(provider);
		provider.config.storage.load(STORAGE_KEYS.SESSION);
	}

	public deleteSession(providerLabel: TConfigLabel) {
		const provider = this.getProvider(providerLabel);
		assertDefined(provider);
		provider.config.storage.delete(STORAGE_KEYS.SESSION);
	}

	public parseRedirectRequest(requestedUrl: string) {
		// TODO: redirect handler for all providers
	}

	private getProvider(providerLabel: TConfigLabel) {
		const provider = this.configs.find((c) => c.label === providerLabel);
		assertDefined(provider);
		return provider;
	}
}

// TODO: class that consumes the config to be used on confidential clients
// TODO: method to output a public client config which omits all of the client secrets
// TODO: class that consumes the config to be used on public clients

// Config<SessionGeneric>
// - [x] OIDC provider config ??? Auth code flow only?

// Session persistence
// Has its own interface, comes with drivers and no-op driver
// - [x] storeSession(token)
// - [x] loadSession()

// Public methods
// - [x] getSignInUrl()
// - [x] getSignOutUrl()
// - [x] getSession() // This will auto refresh the token if expired
// - [x] deleteSession()
// - [ ] getSignInError()
// - [ ] redirectHandler(HTTP req url) // This willl then trigger the session persistence
