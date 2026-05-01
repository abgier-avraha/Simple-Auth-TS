import http from "node:http";
import url from "node:url";

const PORT = 3000;
export const runClientServer = () => {
	const server = http.createServer((req, res) => {
		// biome-ignore lint/style/noNonNullAssertion: not undefined
		const parsedUrl = url.parse(req.url!, true);

		if (parsedUrl.pathname === "/callback") {
			// Extract query parameters
			const query = parsedUrl.query;

			// Respond with a simple success page
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
      <html>
        <body style="font-family:sans-serif;">
          <h2>✅ OAuth Redirect Received</h2>
          <p>You can close this window now.</p>
          <pre>${JSON.stringify(query, null, 2)}</pre>
        </body>
      </html>
    `);
		} else {
			// Any other route
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`<h1>Server running on port ${PORT}</h1>`);
		}
	});

	server.listen(PORT, () => {
		console.log(`🚀 Listening at http://localhost:${PORT}`);
	});

	return {
		stop: () => server.close(),
	};
};

export async function introspectToken(options: {
	token: string;
	clientId: string;
	clientSecret: string;
}): Promise<{ [propName: string]: unknown }> {
	const introspectionUrl =
		"http://localhost:8080/realms/demo/protocol/openid-connect/token/introspect";

	const params = new URLSearchParams({
		token: options.token,
		client_id: options.clientId,
		client_secret: options.clientSecret,
	});

	const res = await fetch(introspectionUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params,
	});

	return await res.json();
}
