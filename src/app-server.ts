import { env } from "cloudflare:workers";
import type {
	AppActivateEvent,
	AppDeactivateEvent,
	ShopInterface,
} from "@shopware-ag/app-server-sdk";
import { configureAppServer } from "@shopware-ag/app-server-sdk/integration/hono";
import { Hono } from "hono";
import { shopRepo } from "./shopware";
import { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

// @ts-expect-error
configureAppServer(app, {
	appName: "SwagAdminMCP",
	appSecret: env.APP_SECRET,
	shopRepository: shopRepo,
	appUrl: env.APP_URL,
	setup: (app) => {
		app.hooks.on(
			"onAppActivate",
			async (event: AppActivateEvent<ShopInterface>) => {
				const shopId = event.shop.getShopId();
				const authHeader = btoa(crypto.randomUUID());
				await Promise.all([
					env.OAUTH_KV.put(`auth_${authHeader}`, shopId),
					env.OAUTH_KV.put(`reverse_${shopId}`, authHeader),
				]);
			},
		);

		app.hooks.on(
			"onAppDeactivate",
			async (event: AppDeactivateEvent<ShopInterface>) => {
				const shopId = event.shop.getShopId();
				const authHeader = await env.OAUTH_KV.get(`reverse_${shopId}`);

				if (authHeader) {
					await Promise.all([
						env.OAUTH_KV.delete(`auth_${authHeader}`),
						env.OAUTH_KV.delete(`reverse_${shopId}`),
					]);
				}
			},
		);
	},
});

app.get("/app/iframe", async (ctx) => {
	const shop = ctx.get("shop");

	const authHeader = await env.OAUTH_KV.get(`reverse_${shop.getShopId()}`);

	return new Response(
		`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shopware MCP Server Configuration</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
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
                                <input type="text" class="form-control" value="${env.APP_URL}/sse" readonly>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Authorization Token:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" value="${authHeader}" readonly>
                            </div>
                        </div>
                        <div class="alert alert-info">
                            <strong>HTTP Transport:</strong> Use the URL and token above in your MCP client configuration.
                        </div>
                        
                        <h6 class="text-muted mb-3">Claude Desktop Configuration</h6>
                        <pre class="bg-dark text-light p-3 rounded small"><code>{
  "mcpServers": {
    "shopware": {
      "transport": {
        "type": "http",
        "url": "${env.APP_URL}/sse"
      }
    }
  }
}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    window.parent.postMessage('sw-app-loaded', '*');
    </script>
</body>
`,
		{
			headers: {
				"content-type": "text/html",
			},
		},
	);
});

app.get("/authorize", async (c) => {
	const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);

	return new Response(`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Shopware MCP - Authorize</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
	<div class="container">
		<div class="row justify-content-center">
			<div class="col-md-6">
				<div class="card mt-5">
					<div class="card-body">
						<h1 class="card-title text-center mb-4">Authorize Access</h1>
						<p class="text-muted text-center mb-4">Enter your token to authenticate</p>
						
						<form method="POST">
							<div class="mb-3">
								<label for="token" class="form-label">Token</label>
								<input type="text" class="form-control" id="token" name="token" placeholder="Enter your token" required />
							</div>
							<input type="hidden" name="state" value="${btoa(JSON.stringify(oauthReqInfo))}" />
							<div class="d-grid">
								<button type="submit" class="btn btn-primary">Authorize</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`, {
		headers: {
			"content-type": "text/html",
		},
	})
});

app.post("/authorize", async (c) => {
	const body = await c.req.parseBody<{ token?: string, state?: string }>();

	if (!body.token || !body.state) {
		return new Response('Missing token or state', { status: 400 });
	}

	const shopId = await c.env.OAUTH_KV.get(`auth_${body.token}`);
	if (!shopId) {
		return new Response('Invalid token', { status: 401 });
	}

	const oauthHelper = c.env.OAUTH_PROVIDER as OAuthHelpers;

	const { redirectTo } = await oauthHelper.completeAuthorization ({
		props: {
			shopId,
		},
		request: JSON.parse(atob(body.state)) as AuthRequest,
		userId: shopId,
		scope: ['write'],
		metadata: {
			label: "Shopware"
		}
	})

	return Response.redirect(redirectTo);
});

export default app;