import type { SimpleAuthProvider } from "./provider.js";
import {
	getDefaultEncryptedSerializer,
	getDefaultSerializer,
} from "./serialization.js";
import { getDefaultLocalStorage } from "./storage.js";

const apple: SimpleAuthProvider<unknown, unknown> = {
	label: "Apple",
	config: {
		client_id: "1",
		client_secret: "2",
		redirect_uri: "https://",
		scope: ["openid"],
		sessionSerialiser: getDefaultEncryptedSerializer("key"),
		stateSerialiser: getDefaultSerializer(),
		// TODO: cookie storage
		storage: {
			async load(_key) {
				return "";
			},
			async save(_key, _value) {},
		},
	},
};

const google: SimpleAuthProvider<unknown, unknown> = {
	label: "Google",
	config: {
		client_id: "1",
		redirect_uri: "https://",
		scope: ["openid"],
		sessionSerialiser: getDefaultSerializer(),
		stateSerialiser: getDefaultSerializer(),
		storage: getDefaultLocalStorage(),
	},
};

const _authConfigs = [apple, google];

// TODO: class that consumes the config to be used on confidential clients
// TODO: method to output a public client config which omits all of the client secrets
// TODO: class that consumes the config to be used on public clients

// Config<SessionGeneric>
// - [ ] OIDC provider config ??? Auth code flow only?

// Session persistence
// Has its own interface, comes with drivers and no-op driver
// - [ ] storeSession(token)
// - [ ] loadSession()

// Public methods
// - [ ] signInWithProvider()
// - [ ] signInWithCredentials()
// - [ ] signOut()
// - [ ] getSession() // This will auto refresh the token if expired
// - [ ] deleteSession()
// - [ ] getSignInError()
// - [ ] redirectHandler(HTTP req url) // This willl then trigger the session persistence
