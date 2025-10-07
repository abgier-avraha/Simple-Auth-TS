# OAuth 2.0 Authorization Code Flow for non PKCE

### PKCE (Public Clients)

PKCE (**Proof Key for Code Exchange**) replaces the need for a client secret in public clients (SPAs or mobile apps).  
It works like this:

1. The app generates a random `code_verifier`.
2. It creates a `code_challenge = SHA256(code_verifier)` and sends that in the `/authorize` request.
3. After login, the authorization server returns an authorization code.
4. The app exchanges that code for tokens by sending the **plain `code_verifier`** to the `/token` endpoint.
5. The server verifies that `SHA256(code_verifier)` matches the original `code_challenge`.

Even if an attacker intercepts the authorization code or the challenge, they cannot redeem it without the original verifier.


### Non-PKCE (Confidential Clients)

For **backend applications**, a `client_secret` is stored securely on the server.  
This secret is used during the token exchange to prove that the request comes from the legitimate client.

> “In confidential client flows, the `client_secret` authenticates the client during the code-to-token exchange.”


---

### 1. Authorization Request

**Request:**

`GET /authorize`

**Query Parameters:**

| Parameter | Description |
|------------|--------------|
| **response_type=code** | Indicates you are using the Authorization Code flow. |
| **client_id** | Identifies your application to the authorization server. |
| **redirect_uri** | Must exactly match the URI registered on the authorization server (e.g. `https://yourapp.com/callback`). |
| **scope** | Defines what access or identity data your app requests. <br>• In **OAuth**, scopes define API permissions.<br>• In **OIDC**, scopes (e.g. `openid`, `profile`, `email`) also determine which user claims appear in the ID token. |
| **state** | A base64-encoded JSON value often containing:<br>• Application state (e.g. target page after login)<br>• A CSRF protection token. |
| **code_challenge** | *(Public clients only)* A base64-encoded, SHA256 hash of a random string (`code_verifier`). Used to prove that the same client exchanges the authorization code later. |
| **code_challenge_method** | *(Public clients only)* The hashing algorithm used (usually `S256`). |

---

### 2. Hosted Login

The user authenticates at the authorization server (auth provider).  
After login, the server redirects the user to the app’s `redirect_uri` with:

`GET https://yourapp.com/callback?code=AUTH_CODE&state=STATE_VALUE`


---

### 3. Handle Callback

**Query Parameters:**
- `code` — the authorization code.
- `state` — app state + CSRF token (verify this value before continuing).

---

### 4. Exchange Authorization Code for Tokens

Your **backend** sends a request to the **authorization server’s `/token` endpoint** (not your own API):

**POST /token**

| Parameter | Description |
|------------|--------------|
| **grant_type=authorization_code** | Indicates the authorization code flow. |
| **code** | The authorization code received from the callback. |
| **redirect_uri** | Must exactly match the one in the `/authorize` request. |
| **client_id** | Identifies your app. |
| **client_secret** | *(Confidential clients only)* Authenticates your app to the authorization server. |
| **code_verifier** | *(Public clients only)* The plaintext value corresponding to the original `code_challenge`. |

If validation succeeds, the server responds with:
- **access_token**
- **id_token** (if OIDC)
- **refresh_token** (if enabled)

---

### 5. Return Response to Frontend

Typical backend-for-frontend (BFF) behavior:

1. Store tokens securely (server session or encrypted cookies).
2. Send a response to the browser tpically with:

```
Set-Cookie: session=encrypted_token; HttpOnly; Secure; SameSite=Strict
HTTP/1.1 302 Found
Location: /target-page
```

This will redirect your users to whatever page want and avoid exposing the cookies to JavaScript.

---

### 6. Refreshing Tokens

To refresh tokens, send a new request to the **authorization server’s `/token` endpoint**:

**POST /token**

| Parameter | Description |
|------------|--------------|
| **grant_type=refresh_token** | Requests a new access token using a refresh token. |
| **refresh_token** | The refresh token previously issued. |
| **client_id** | Identifies your app. |
| **client_secret** | *(Confidential clients only)* Required for server-side apps. |

If your app uses cookies, you can create a `/refresh` endpoint that:
- Reads the refresh token from an encrypted cookie.
- Calls the `/token` endpoint.
- Updates the cookie with new tokens.
- Redirects the user back to their current page.

---

### Recommended Cookie Policies for Confidential Clients

| Attribute | Description |
|------------|--------------|
| **HttpOnly** | Prevents JavaScript from accessing cookies. |
| **Secure** | Sends cookies only over HTTPS. |
| **SameSite=Strict** | Sends cookies only in same-site requests. |
