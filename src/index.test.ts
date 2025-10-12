import { expect, test } from "vitest";
import type { SimpleAuthConfidentialClientConfig } from "./config.js";
import { DefaultSerializer, EncryptedSerializer } from "./serialization.js";
import { InMemoryStorage } from "./storage.js";
import { ConfidentialClient, STORAGE_KEYS } from "./index.js";

type IState = { targetUrl: string; csrf: string };

test("Can get sign in url for confidential client", async () => {
	const config: SimpleAuthConfidentialClientConfig<void, IState, void, void> = {
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
	const signInUrl = await client.getSignInUrl({
		targetUrl: "<target-url>",
		csrf: "<csrf>",
	});

	expect(signInUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/auth?response_type=code&client_id=test-client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid+profile+email&state=eyJ0YXJnZXRVcmwiOiI8dGFyZ2V0LXVybD4iLCJjc3JmIjoiPGNzcmY%2BIn0%3D",
	);
});

test("Can get sign out for confidential client", async () => {
	const config: SimpleAuthConfidentialClientConfig<void, IState, void, void> = {
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
	const signOutUrl = await client.getSignOutUrl();

	expect(signOutUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/logout",
	);
});

test("Can sign in and handle redirect url to exchange code for token", async () => {
	const config: SimpleAuthConfidentialClientConfig<void, IState, void, void> = {
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

	await config.storage.save(
		STORAGE_KEYS.STATE,
		await config.stateSerialiser.stringify({
			targetUrl: "<target-url>",
			csrf: "<csrf>",
		}),
	);

	// TODO: automate going into the browser and entering credentials to sign in
	// const redirectUrl = await getTestRedirectUrl({
	// 	issuer: config.endpoints.issuer,
	// 	clientId: config.clientId,
	// 	clientSecret: config.clientSecret,
	// 	redirectUri: config.redirectUrl,
	// 	username: "test@example.com",
	// 	password: "password",
	// });
	// const d = await client.handleRedirect(redirectUrl);
	// console.log(d);
});
