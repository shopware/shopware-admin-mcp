import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import {
	categoryCreate,
	categoryDelete,
	categoryList,
	categoryUpdate,
} from "./tools/category";
import {
	productCreate,
	productGet,
	productList,
	productUpdate,
} from "./tools/product";
import { salesChannelList } from "./tools/sales_channel";
import { uploadMediaByUrl } from "./tools/media";

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
		salesChannelList(this.server, this.props.shopId);

		uploadMediaByUrl(this.server, this.props.shopId);

		// Category tools
		categoryList(this.server, this.props.shopId);
		categoryCreate(this.server, this.props.shopId);
		categoryUpdate(this.server, this.props.shopId);
		categoryDelete(this.server, this.props.shopId);

		// Product tools
		productList(this.server, this.props.shopId);
		productGet(this.server, this.props.shopId);
		productCreate(this.server, this.props.shopId);
		productUpdate(this.server, this.props.shopId);
	}
}
