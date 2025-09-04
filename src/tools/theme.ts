import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import { EntityRepository } from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import z from "zod";
import { serializeLLM } from "../shopware.js";

export function themeConfigGet(server: McpServer, client: HttpClient) {
	server.tool(
		"theme_config_get",
		{
			salesChannelId: z
				.string()
				.describe("The ID of the sales channel to fetch the theme config for"),
		},
		async (data) => {
			const themeRepo = new EntityRepository<{
				configValues: Record<string, { value: string }>;
			}>(client, "theme");

			const criteria = new Criteria();
			criteria.addFilter(
				Criteria.equals("salesChannels.id", data.salesChannelId),
			);

			const themes = await themeRepo.search(criteria);

			if (themes.total === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No theme assigned to sales channel ${data.salesChannelId}.`,
						},
					],
				};
			}

			const theme = themes.data[0];

			return {
				content: [
					{
						type: "text",
						text: serializeLLM(theme.configValues),
					},
				],
			};
		},
	);
}

export function themeConfigChange(server: McpServer, client: HttpClient) {
	server.tool(
		"theme_config_change",
		{
			salesChannelId: z
				.string()
				.describe("The ID of the sales channel to update"),
			themeId: z.string().describe("The ID of the theme to assign"),
			brandPrimaryColor: z
				.string()
				.default("#7a9ccd")
				.describe("The new primary brand color in hex format, e.g. #7a9ccd")
				.optional(),
			brandSecondaryColor: z
				.string()
				.default("#7a9ccd")
				.describe("The new secondary brand color in hex format, e.g. #7a9ccd")
				.optional(),
			brandBackgroundColor: z
				.string()
				.default("#ffffff")
				.describe("The new background color in hex format, e.g. #ffffff"),
			logoId: z
				.string()
				.optional()
				.describe("The ID of the media object to use as logo"),
		},
		async (data) => {
			await client.patch(`_action/theme/${data.themeId}?validate=true`, {
				config: {
					...(data.brandPrimaryColor && {
						"sw-color-brand-primary": { value: data.brandPrimaryColor },
					}),
					...(data.brandSecondaryColor && {
						"sw-color-brand-secondary": { value: data.brandSecondaryColor },
					}),
					...(data.brandBackgroundColor && {
						"sw-background-color": { value: data.brandBackgroundColor },
					}),
					...(data.logoId && { "sw-logo-desktop": { value: data.logoId } }),
					...(data.logoId && { "sw-logo-tablet": { value: data.logoId } }),
					...(data.logoId && { "sw-logo-mobile": { value: data.logoId } }),
				},
			});

			return {
				content: [
					{
						type: "text",
						text: `Changed the theme color, it may take a few minutes until the changes are visible.`,
					},
				],
			};
		},
	);
}
