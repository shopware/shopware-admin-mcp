import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	ApiContext,
	EntityRepository,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { getClient, serializeLLM } from "../../shopware";

export function categoryList(server: McpServer, shopId: string) {
	server.tool("category_list", {}, async () => {
		const client = await getClient(shopId);

		const categoryRepository = new EntityRepository<{
			id: string;
			translated: { name: string };
			parentId: string | null;
		}>(client, "category");

		const criteria = new Criteria();
		criteria.addFields("id", "name", "parentId");
		criteria.setLimit(50);

		const categories = await categoryRepository.search(
			criteria,
			new ApiContext(null, true),
		);

		for (const category of categories.data) {
			//@ts-expect-error
			delete category.translated;
		}

		return {
			content: [
				{
					type: "text",
					text: serializeLLM(categories),
				},
			],
		};
	});
}
