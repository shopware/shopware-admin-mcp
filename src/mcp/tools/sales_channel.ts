import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	Defaults,
	EntityRepository,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { getClient, serializeLLM } from "../../shopware";

export function salesChannelResource(server: McpServer, shopId: string) {
	server.tool("sales_channel_list", {}, async () => {
		const client = await getClient(shopId);

		const criteria = new Criteria();
		criteria.addFields("id", "name");
		criteria.addFilter(
			Criteria.equals("typeId", Defaults.salesChannelTypeSalesChannel),
		);

		const salesChannelRepository = new EntityRepository<{
			id: string;
			name: string;
		}>(client, "sales_channel");
		const salesChannels = await salesChannelRepository.search(criteria);

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
