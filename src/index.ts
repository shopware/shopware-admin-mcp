#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient, SimpleShop } from "@shopware-ag/app-server-sdk";
import {
	categoryCreate,
	categoryDelete,
	categoryList,
	categoryUpdate,
} from "./tools/category.js";
import {
	countryList,
	dalAggregate,
	fetchEntitySchema,
	fetchEntitySchemaListEntities,
} from "./tools/general.js";
import { uploadMediaByUrl } from "./tools/media.js";
import { orderDetail, orderList, orderUpdate } from "./tools/order.js";
import {
	productCreate,
	productGet,
	productList,
	productUpdate,
} from "./tools/product.js";
import { salesChannelList, salesChannelUpdate } from "./tools/sales_channel.js";
import { themeConfigChange, themeConfigGet } from "./tools/theme.js";

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

fetchEntitySchemaListEntities(server, client);
fetchEntitySchema(server, client);
dalAggregate(server, client);
countryList(server, client);

salesChannelList(server, client);
salesChannelUpdate(server, client);

themeConfigGet(server, client);
themeConfigChange(server, client);

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

// Order tools
orderList(server, client);
orderDetail(server, client);
orderUpdate(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
