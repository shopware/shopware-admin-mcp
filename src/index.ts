#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient, SimpleShop } from "@shopware-ag/app-server-sdk";
import {
	categoryCreate,
	categoryDelete,
	categoryList,
	categoryUpdate,
} from "./tools/category.js";
import { uploadMediaByUrl } from "./tools/media.js";
import {
	productCreate,
	productGet,
	productList,
	productUpdate,
} from "./tools/product.js";
import { salesChannelList } from "./tools/sales_channel.js";

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
	version: "0.0.1",
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

salesChannelList(server, client);

uploadMediaByUrl(server, client);

// Category tools
categoryList(server, client);
categoryCreate(server, client);
categoryUpdate(server, client);
categoryDelete(server, client);

// Product tools
productList(server, client);
productGet(server, client);
productCreate(server, client);
productUpdate(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
