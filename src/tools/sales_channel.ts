import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	Defaults,
	EntityRepository,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { serializeLLM } from "../shopware.js";

export function salesChannelList(server: McpServer, client: HttpClient) {
	server.tool("sales_channel_list", {}, async () => {
		const criteria = new Criteria();
		criteria.addFields("id", "name", "navigationCategoryId");
		criteria.addFilter(
			Criteria.equals("typeId", Defaults.salesChannelTypeSalesChannel),
		);

		const salesChannelRepository = new EntityRepository<{
			id: string;
			name: string;
			navigationCategoryId: string;
		}>(client, "sales_channel");

		const salesChannels = await salesChannelRepository.search(criteria);

		for (const channel of salesChannels.data) {
			//@ts-expect-error
			delete channel.translated;
		}

		return {
			content: [
				{
					type: "text",
					text: serializeLLM(salesChannels),
				},
			],
		};
	});
}
