import { expect, test, vi } from "vitest";
import { EncryptedSerializer } from "./serialization.js";

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
