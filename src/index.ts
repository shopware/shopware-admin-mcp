#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient, SimpleShop } from "@shopware-ag/app-server-sdk";
import { configureTools } from "./tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
	readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);
const version = packageJson.version;

const requiredEnvVars = [
	"SHOPWARE_API_URL",
	"SHOPWARE_API_CLIENT_ID",
	"SHOPWARE_API_CLIENT_SECRET",
];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
}

const server = new McpServer({
	name: "shopware-admin-mcp",
	version,
});

const shop = new SimpleShop(
	"static-id",
	process.env.SHOPWARE_API_URL as string,
	"shop-secret",
);

shop.setShopCredentials(
	process.env.SHOPWARE_API_CLIENT_ID as string,
	process.env.SHOPWARE_API_CLIENT_SECRET as string,
);

const client = new HttpClient(shop);

configureTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
