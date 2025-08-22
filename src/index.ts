import OAuthProvider from "@cloudflare/workers-oauth-provider";
import app from "./app-server";
import { ShopwareAdminMCP } from "./mcp/index";

export { ShopwareAdminMCP } from "./mcp/index";

export default new OAuthProvider({
	apiHandlers: {
		"/sse": ShopwareAdminMCP.serveSSE("/sse"),
		"/mcp": ShopwareAdminMCP.serve("/mcp"),
	},
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: app as any,
	tokenEndpoint: "/token",
});
