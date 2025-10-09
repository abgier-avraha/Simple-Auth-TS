import { expect, test, vi } from "vitest";
import { getDefaultEncryptedSerializer } from "./serialization.js";

test("Encryption serializer works", () => {
	// Mock random bytes to fixed value
	vi.mock("crypto", async () => {
		const actual = await vi.importActual("crypto");
		return {
			...actual,
			randomBytes: (size: number) => Buffer.from("a".repeat(size)),
		};
	});

	const encryptedSerializer = getDefaultEncryptedSerializer("<key>");

	// Test serialization
	const serialized = encryptedSerializer.stringify("This is a test.");
	expect(serialized).toBe(
		"YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFxNbjMUzaeFFr1a3QN58ZHGQTTpLozdCsg4g10FUEp35yHI27548Xg",
	);

	// Test parsing
	const parsed = encryptedSerializer.parse(serialized);
	expect(parsed).toBe("This is a test.");
});
