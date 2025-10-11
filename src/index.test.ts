import { expect, test, vi } from "vitest";
import type { SimpleAuthConfidentialClientConfig } from "./config.js";
import { DefaultSerializer, EncryptedSerializer } from "./serialization.js";
import { InMemoryStorage } from "./storage.js";
import { ConfidentialClient } from "./index.js";

test("Encryption serializer works", async () => {
	// Mock random bytes to fixed value
	vi.mock("crypto", async () => {
		const actual = await vi.importActual("crypto");
		return {
			...actual,
			randomBytes: (size: number) => Buffer.from("a".repeat(size)),
		};
	});

	const encryptedSerializer = new EncryptedSerializer("<key>");

	// Test serialization
	const serialized = await encryptedSerializer.stringify("This is a test.");
	expect(serialized).toBe(
		"YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFxNbjMUzaeFFr1a3QN58ZHGQTTpLozdCsg4g10FUEp35yHI27548Xg",
	);

	// Test parsing
	const parsed = await encryptedSerializer.parse(serialized);
	expect(parsed).toBe("This is a test.");
});

test("Can get sign in url for confidential client", async () => {
	const playgroundConfig: SimpleAuthConfidentialClientConfig<unknown, string> =
		{
			issuerUrl: process.env.ISSUER_URL,
			clientId: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			redirectUri: "https://www.oauth.com/playground/authorization-code.html",
			scope: ["photo", "offline_access"],
			sessionSerialiser: new EncryptedSerializer("key"),
			stateSerialiser: new DefaultSerializer(),
			storage: new InMemoryStorage(),
		};

	const client = new ConfidentialClient(playgroundConfig);
	const signInUrl = await client.getSignInUrl("1GCOfvNKn1edDk61");

	expect(signInUrl).toBe(
		"https://www.oauth.com/playground/auth-dialog.html?response_type=code&client_id=S-WhFb6bwhNuV9UxIdrhxjje&redirect_uri=https%3A%2F%2Fwww.oauth.com%2Fplayground%2Fauthorization-code.html&scope=photo+offline_access&state=IjFHQ09mdk5LbjFlZERrNjEi",
	);
});
