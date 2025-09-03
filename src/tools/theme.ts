import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import z from "zod";

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
				.describe("The new primary brand color in hex format, e.g. #7a9ccd"),
			brandSecondaryColor: z
				.string()
				.default("#7a9ccd")
				.describe("The new secondary brand color in hex format, e.g. #7a9ccd"),
			brandBackgroundColor: z
				.string()
				.default("#ffffff")
				.describe("The new background color in hex format, e.g. #ffffff"),
		},
		async (data) => {
			await client.patch(
				`_action/theme/${data.themeId}?reset=true&validate=true`,
				{
					config: {
						"sw-color-brand-primary": {
							value: data.brandPrimaryColor,
						},
						"sw-color-brand-secondary": {
							value: data.brandSecondaryColor,
						},
						"sw-background-color": {
							value: data.brandBackgroundColor,
						},
					},
				},
			);

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
