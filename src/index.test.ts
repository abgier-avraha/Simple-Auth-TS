import { expect, test } from "vitest";
import type { SimpleAuthConfidentialClientConfig } from "./config.js";
import { DefaultSerializer, EncryptedSerializer } from "./serialization.js";
import { InMemoryStorage } from "./storage.js";
import { ConfidentialClient } from "./index.js";

test("Can get sign in url for confidential client", async () => {
	const config: SimpleAuthConfidentialClientConfig<void, void, void, void> = {
		endpoints: {
			issuer: "http://localhost:8080/realms/demo",
		},
		clientId: "test-client",
		clientSecret: "test-client-secret",
		redirectUrl: "http://localhost:3000/callback",
		scope: ["openid", "profile", "email"],
		accessTokenSerialiser: new EncryptedSerializer("key"),
		idTokenSerialiser: new EncryptedSerializer("key"),
		userInfoSerialiser: new EncryptedSerializer("key"),
		stateSerialiser: new DefaultSerializer(),
		storage: new InMemoryStorage(),
	};

	const client = new ConfidentialClient(config);
	const signInUrl = await client.getSignInUrl();

	expect(signInUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/auth?response_type=code&client_id=test-client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid+profile+email&state=dW5kZWZpbmVk",
	);
});

test("Can get sign in out for confidential client", async () => {
	const config: SimpleAuthConfidentialClientConfig<void, void, void, void> = {
		endpoints: {
			issuer: "http://localhost:8080/realms/demo",
		},
		clientId: "test-client",
		clientSecret: "test-client-secret",
		redirectUrl: "http://localhost:3000/callback",
		scope: ["openid", "profile", "email"],
		accessTokenSerialiser: new EncryptedSerializer("key"),
		idTokenSerialiser: new EncryptedSerializer("key"),
		userInfoSerialiser: new EncryptedSerializer("key"),
		stateSerialiser: new DefaultSerializer(),
		storage: new InMemoryStorage(),
	};

	const client = new ConfidentialClient(config);
	const signInUrl = await client.getSignOutUrl();

	expect(signInUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/logout",
	);
});
