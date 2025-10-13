import { expect, test } from "vitest";
import type { SimpleAuthConfidentialClientConfig } from "./config.js";
import { DefaultSerializer, EncryptedSerializer } from "./serialization.js";
import { InMemoryStorage } from "./storage.js";
import { ConfidentialClient, STORAGE_KEYS } from "./index.js";
import { chromium } from "playwright";
import {
	introspectToken,
	runClientServer,
	validateJWT,
} from "./test-utilts.js";

type IState = { targetUrl: string; csrf: string };

test("Can get sign in url for confidential client", async () => {
	// Arrange
	const config: SimpleAuthConfidentialClientConfig<IState, void> = {
		endpoints: {
			issuer: "http://localhost:8080/realms/demo",
		},
		clientId: "test-client",
		clientSecret: "test-client-secret",
		redirectUrl: "http://localhost:3000/callback",
		scope: ["openid", "profile", "email"],
		tokenSerialiser: new EncryptedSerializer("key"),
		userInfoSerialiser: new EncryptedSerializer("key"),
		stateSerialiser: new DefaultSerializer(),
		storage: new InMemoryStorage(),
	};
	const client = new ConfidentialClient(config);

	// Act
	const signInUrl = await client.getSignInUrl({
		targetUrl: "<target-url>",
		csrf: "<csrf>",
	});

	// Assert
	expect(signInUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/auth?response_type=code&client_id=test-client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid+profile+email&state=eyJ0YXJnZXRVcmwiOiI8dGFyZ2V0LXVybD4iLCJjc3JmIjoiPGNzcmY%2BIn0%3D",
	);
});

test("Can get sign out for confidential client", async () => {
	// Arrange
	const config: SimpleAuthConfidentialClientConfig<IState, void> = {
		endpoints: {
			issuer: "http://localhost:8080/realms/demo",
		},
		clientId: "test-client",
		clientSecret: "test-client-secret",
		redirectUrl: "http://localhost:3000/callback",
		scope: ["openid", "profile", "email"],
		tokenSerialiser: new EncryptedSerializer("key"),
		userInfoSerialiser: new EncryptedSerializer("key"),
		stateSerialiser: new DefaultSerializer(),
		storage: new InMemoryStorage(),
	};
	const client = new ConfidentialClient(config);

	// Act
	const signOutUrl = await client.getSignOutUrl();

	// Assert
	expect(signOutUrl).toBe(
		"http://localhost:8080/realms/demo/protocol/openid-connect/logout",
	);
});

test(
	"Can sign in and handle redirect url to exchange code for token",
	{ timeout: 5000 },
	async () => {
		// Arrange
		const config: SimpleAuthConfidentialClientConfig<IState, void> = {
			endpoints: {
				issuer: "http://localhost:8080/realms/demo",
			},
			clientId: "test-client",
			clientSecret: "test-client-secret",
			redirectUrl: "http://localhost:3000/callback",
			scope: ["openid", "profile", "email"],
			tokenSerialiser: new EncryptedSerializer("key"),
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

		// Act
		const server = runClientServer();
		const signInUrl = await client.getSignInUrl({
			targetUrl: "<target-url>",
			csrf: "<csrf>",
		});
		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		await page.goto(signInUrl);
		await page.fill('input[name="username"]', "test@example.com");
		await page.fill('input[name="password"]', "password");
		await page.click('input[type="submit"]');
		await page.waitForURL("**/callback*");
		const redirectedUrl = page.url();
		await browser.close();
		server.stop();

		const parsedRedirect = await client.handleRedirect(redirectedUrl);

		// Assert
		const discoveryDocument = await client.getDiscoveryDocument();
		if (!discoveryDocument) {
			throw new Error("Discovery document not found");
		}

		const accessToken = await validateJWT({
			token: parsedRedirect.accessToken,
			issuer: discoveryDocument.issuer,
			jwksUri: discoveryDocument.jwks_uri,
		});

		// Validate acccess token
		expect(accessToken.payload.scope).toBe("openid profile email");
		expect(accessToken.payload.name).toBe("Test User");
		expect(accessToken.payload.preferred_username).toBe("testuser");
		expect(accessToken.payload.given_name).toBe("Test");
		expect(accessToken.payload.family_name).toBe("User");
		expect(accessToken.payload.email).toBe("test@example.com");

		// Validate id token
		const idToken = await validateJWT({
			token: parsedRedirect.idToken,
			issuer: discoveryDocument.issuer,
			jwksUri: discoveryDocument.jwks_uri,
		});
		expect(idToken.payload.name).toBe("Test User");
		expect(idToken.payload.preferred_username).toBe("testuser");
		expect(idToken.payload.given_name).toBe("Test");
		expect(idToken.payload.family_name).toBe("User");
		expect(idToken.payload.email).toBe("test@example.com");

		// Validate refresh token
		const refreshToken = await introspectToken({
			token: parsedRedirect.refreshToken,
			clientId: "test-client",
			clientSecret: "test-client-secret",
		});
		expect(refreshToken.scope).toBe(
			"openid profile basic email web-origins roles acr",
		);
		expect(refreshToken.name).toBe("Test User");
		expect(refreshToken.preferred_username).toBe("testuser");
		expect(refreshToken.given_name).toBe("Test");
		expect(refreshToken.family_name).toBe("User");
		expect(refreshToken.email).toBe("test@example.com");
	},
);
