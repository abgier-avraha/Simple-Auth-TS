// From https://gist.github.com/meirkl/85f6e8556376e2929521600a038e04bf
import * as crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

export class AESEncryption {
	constructor(private secret: string) {}

	getKey(salt: Buffer) {
		return crypto.pbkdf2Sync(this.secret, salt, 100000, 32, "sha512");
	}

	encrypt(plainText: string) {
		const iv = crypto.randomBytes(IV_LENGTH);
		const salt = crypto.randomBytes(SALT_LENGTH);

		const key = this.getKey(salt);

		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
		const encrypted = Buffer.concat([
			cipher.update(String(plainText), "utf8"),
			cipher.final(),
		]);

		const tag = cipher.getAuthTag();

		return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
	}

	decrypt(cipherText: string) {
		const stringValue = Buffer.from(String(cipherText), "base64");

		const salt = Buffer.from(
			Uint8Array.prototype.slice.call(stringValue, 0, SALT_LENGTH),
		);
		const iv = Uint8Array.prototype.slice.call(
			stringValue,
			SALT_LENGTH,
			TAG_POSITION,
		);
		const tag = Uint8Array.prototype.slice.call(
			stringValue,
			TAG_POSITION,
			ENCRYPTED_POSITION,
		);
		const encrypted = Uint8Array.prototype.slice.call(
			stringValue,
			ENCRYPTED_POSITION,
		);

		const key = this.getKey(salt);

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

		decipher.setAuthTag(tag);

		return decipher.update(encrypted) + decipher.final("utf8");
	}
}
