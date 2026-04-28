# Simple Auth TS

## Setting Up a Confidential Client

Read about [configuring your confidential client and all the jargon here](./confidential-clients.md)

### Client Configuration

Build your config

```ts
type IState = { targetUrl: string; csrf: string };

const config: SimpleAuthConfidentialClientConfig<IState> = {
  endpoints: {
issuer: "http://localhost:8080/realms/demo",
  },
  clientId: "test-client",
  clientSecret: "test-client-secret",
  redirectUrl: "http://localhost:3000/callback",
  scope: ["openid", "profile", "email"],
  tokenSerialiser: new EncryptedSerializer("key"),
  stateSerialiser: new DefaultSerializer(),
  storage: new CookieStorage(), // This storage provider be implemented by you, the implementation will depend on your web framework/library
	audience: "test-client",
};
```

Initialize your client

```ts
const client = new ConfidentialClient(config);
```

### Logging In

Use the client to get your sign in url, you can also pass in a state object to retrieve later.

```ts
const signInUrl = await client.getSignInUrl({
  targetUrl: "<target-url>",
  csrf: "<csrf>",
});
```

Retrieve your tokens from the url after being redirect back to your site. This will serialize and store your tokens. 

```ts
await client.handleRedirect(redirectedUrl)
```

### Fetching the Session

```ts
const session = await client.getValidSession();
```

You can then verify your tokens and view their payloads like this.

```ts
await client.verifyJwt(session.accessToken)
```

#### Refreshing the Session

**Sessions will automatically be refreshed if your access token is expired when you call `getValidSession()`**. If you want to force refresh you can use this.

```ts
const updatedTokens = await client.getValidSession({ forceRefresh: true });
```

### Signin Out

Get the sign out url using this method.

```ts
await client.getSignOutUrl()
```

After being redirected back to the logout page on your website you can clear your session.


```ts
await client.deleteSession()
```

## Test Suite

This library contains a test suite that runs a real web server to act as a client application as well as on OIDC server.

### Docker Services

Run `docker compose up` to get an instance of Keycloak running. This is required for running tests.

### Run Test Suite
Run `npm install` and `npm test` to run the test suite.