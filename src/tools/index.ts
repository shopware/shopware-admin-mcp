import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	categoryCreate,
	categoryDelete,
	categoryList,
	categoryUpdate,
} from "./category.js";
import {
	countryList,
	dalAggregate,
	fetchEntitySchema,
	fetchEntitySchemaListEntities,
} from "./general.js";
import { uploadMediaByUrl } from "./media.js";
import { orderDetail, orderList, orderUpdate } from "./order.js";
import {
	productCreate,
	productGet,
	productList,
	productUpdate,
} from "./product.js";
import { salesChannelList, salesChannelUpdate } from "./sales_channel.js";
import { themeConfigChange, themeConfigGet } from "./theme.js";

export function configureTools(server: McpServer, client: HttpClient) {
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
}
