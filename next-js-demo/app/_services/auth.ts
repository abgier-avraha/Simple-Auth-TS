import {
	ConfidentialClient,
	DefaultSerializer,
	EncryptedSerializer,
} from "simple-auth-ts";
import { NextCookieStorage } from "simple-auth-ts-next/storage";
import { globals } from "./globals";

export type AuthState = {
	redirectTo: string;
};

globals.authClient =
	globals.authClient ??
	new ConfidentialClient({
		endpoints: {
			issuer: "http://localhost:8080/realms/demo",
		},
		clientId: "test-client",
		clientSecret: "test-client-secret",
		redirectUrl: "http://localhost:3000/api/auth/callback",
		postLogoutRedirectUri: "http://localhost:3000/api/auth/logout",
		scope: ["openid", "profile", "email"],
		stateSerializer: new DefaultSerializer(),
		storage: new NextCookieStorage(new EncryptedSerializer("development")),
	});

export const authClient = globals.authClient;
