import { ShopwareAdminMCP } from "./mcp/index";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import app from './app-server';

export { ShopwareAdminMCP } from "./mcp/index";

export default new OAuthProvider({
	apiHandler: ShopwareAdminMCP.mount("/sse"),
	apiRoute: "/sse",
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: app as any,
	tokenEndpoint: "/token",
});
