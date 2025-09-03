import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	Defaults,
	EntityRepository,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import z from "zod";
import { serializeLLM } from "../shopware.js";

type SalesChannel = {
	id: string;
	name: string;
	active: boolean;
	maintenance: boolean;
	navigationCategoryId: string;
	domains: { url: string }[];
	extensions: {
		themes: { id: string }[];
	};
	themeId?: string;
};

export function salesChannelList(server: McpServer, client: HttpClient) {
	server.tool("sales_channel_list", {}, async () => {
		const criteria = new Criteria<SalesChannel>();
		criteria.addFields(
			"id",
			"active",
			"name",
			"maintenance",
			"navigationCategoryId",
			"domains.url",
			"themes.id",
		);
		criteria.addFilter(
			Criteria.equals("typeId", Defaults.salesChannelTypeSalesChannel),
		);
		criteria.addAssociation("domains");

		const salesChannelRepository = new EntityRepository<SalesChannel>(
			client,
			"sales_channel",
		);

		const salesChannels = await salesChannelRepository.search(criteria);

		for (const channel of salesChannels.data) {
			//@ts-expect-error
			delete channel.translated;

			if (channel.extensions?.themes) {
				channel.themeId =
					channel.extensions.themes.length > 0
						? channel.extensions.themes[0].id
						: undefined;
			}

			//@ts-expect-error
			delete channel.extensions;
			//@ts-expect-error
			delete channel.themes;
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

export function salesChannelUpdate(server: McpServer, client: HttpClient) {
	server.tool(
		"sales_channel_update",
		{
			id: z.string().describe("The ID of the sales channel to update"),
			active: z
				.boolean()
				.describe("Set the sales channel active or inactive")
				.optional(),
			maintenance: z
				.boolean()
				.describe("Set the sales channel in maintenance mode or not")
				.optional(),
		},
		async (data) => {
			const salesChannelRepository = new EntityRepository<{
				id: string;
				active?: boolean;
				maintenance?: boolean;
			}>(client, "sales_channel");

			await salesChannelRepository.upsert([
				{
					id: data.id,
					...(data.active !== undefined && { active: data.active }),
					...(data.maintenance !== undefined && {
						maintenance: data.maintenance,
					}),
				},
			]);

			return {
				content: [
					{
						type: "text",
						text: "Sales channel updated successfully",
					},
				],
			};
		},
	);
}
