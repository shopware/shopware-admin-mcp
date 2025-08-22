import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import {
	productCreate,
	productGet,
	productList,
	productUpdate,
} from "./tools/product";
import { salesChannelResource } from "./tools/sales_channel";

export class ShopwareAdminMCP extends McpAgent<
	unknown,
	unknown,
	{ shopId: string }
> {
	server = new McpServer({
		name: "Shopware Admin",
		version: "1.0.0",
	});

	async init() {
		salesChannelResource(this.server, this.props.shopId);

		productList(this.server, this.props.shopId);
		productGet(this.server, this.props.shopId);
		productCreate(this.server, this.props.shopId);
		productUpdate(this.server, this.props.shopId);
	}
}
