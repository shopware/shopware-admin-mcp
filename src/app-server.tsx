import { env } from "cloudflare:workers";
import { configureAppServer } from "@shopware-ag/app-server-sdk/integration/hono";
import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { appServer } from "./shopware";
import type {
	AuthRequest,
	OAuthHelpers,
} from "@cloudflare/workers-oauth-provider";

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

// @ts-expect-error
configureAppServer(app, {
	appServer,
});

const Layout: FC<{ title: string; children: any }> = ({ title, children }) => {
	return (
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{title}</title>
				<link
					href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
					rel="stylesheet"
				/>
			</head>
			<body class="bg-light">
				{children}
				<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>
			</body>
		</html>
	);
};

const ConfigurationPage: FC<{ appUrl: string; authHeader: string }> = ({
	appUrl,
	authHeader,
}) => {
	return (
		<Layout title="Shopware MCP Server Configuration">
			<div class="container-fluid py-4">
				<div class="row">
					<div class="col-12">
						<div class="card shadow-sm mb-4">
							<div class="card-header bg-primary text-white">
								<h5 class="card-title mb-0">
									<i class="bi bi-gear-fill me-2"></i>
									MCP Server Configuration
								</h5>
							</div>
							<div class="card-body">
								<div class="mb-3">
									<label class="form-label fw-bold">MCP Server URL:</label>
									<div class="input-group">
										<input
											type="text"
											class="form-control"
											value={`${appUrl}/sse`}
											readonly
										/>
									</div>
								</div>
								<div class="mb-3">
									<label class="form-label fw-bold">Authorization Token:</label>
									<div class="input-group">
										<input
											type="text"
											class="form-control"
											value={authHeader}
											readonly
										/>
									</div>
								</div>
								<div class="alert alert-info">
									<strong>HTTP Transport:</strong> Use the URL and token above
									in your MCP client configuration.
								</div>

								<h6 class="text-muted mb-3">Claude Desktop Configuration</h6>
								<pre class="bg-dark text-light p-3 rounded small">
									<code>{`{
  "mcpServers": {
    "shopware": {
      "transport": {
        "type": "http",
        "url": "${appUrl}/sse"
      }
    }
  }
}`}</code>
								</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
			<script
				dangerouslySetInnerHTML={{
					__html: "window.parent.postMessage('sw-app-loaded', '*');",
				}}
			></script>
		</Layout>
	);
};

const AuthorizePage: FC<{ state: string }> = ({ state }) => {
	return (
		<Layout title="Shopware MCP - Authorize">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-md-6">
						<div class="card mt-5">
							<div class="card-body">
								<h1 class="card-title text-center mb-4">Authorize Access</h1>
								<p class="text-muted text-center mb-4">
									Enter your token to authenticate
								</p>

								<form method="post">
									<div class="mb-3">
										<label for="token" class="form-label">
											Token
										</label>
										<input
											type="text"
											class="form-control"
											id="token"
											name="token"
											placeholder="Enter your token"
											required
										/>
									</div>
									<input type="hidden" name="state" value={state} />
									<div class="d-grid">
										<button type="submit" class="btn btn-primary">
											Authorize
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

app.get("/app/iframe", async (ctx) => {
	const shop = ctx.get("shop");

	const authHeader = await env.OAUTH_KV.get(`reverse_${shop.getShopId()}`);

	return ctx.html(
		<ConfigurationPage appUrl={env.APP_URL} authHeader={authHeader || ""} />,
	);
});

app.get("/authorize", async (c) => {
	const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);

	return c.html(<AuthorizePage state={btoa(JSON.stringify(oauthReqInfo))} />);
});

app.post("/authorize", async (c) => {
	const body = await c.req.parseBody<{ token?: string; state?: string }>();

	if (!body.token || !body.state) {
		return new Response("Missing token or state", { status: 400 });
	}

	const shopId = await c.env.OAUTH_KV.get(`auth_${body.token}`);
	if (!shopId) {
		return new Response("Invalid token", { status: 401 });
	}

	const oauthHelper = c.env.OAUTH_PROVIDER as OAuthHelpers;

	const { redirectTo } = await oauthHelper.completeAuthorization({
		props: {
			shopId,
		},
		request: JSON.parse(atob(body.state)) as AuthRequest,
		userId: shopId,
		scope: ["write"],
		metadata: {
			label: "Shopware",
		},
	});

	return Response.redirect(redirectTo);
});

export default app;
