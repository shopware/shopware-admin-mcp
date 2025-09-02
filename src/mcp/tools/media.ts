import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	getMediaDefaultFolderByEntity,
	uploadMediaByUrl as uploadUrl,
} from "@shopware-ag/app-server-sdk/helper/media";
import { z } from "zod";
import { getClient, serializeLLM } from "../../shopware";

export function uploadMediaByUrl(server: McpServer, shopId: string) {
	server.tool(
		"upload_media_by_url",
		{
			url: z.string().url().describe("The URL of the media to upload"),
			fileName: z.string().describe("File name for the uploaded media"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const mediaFolderId = await getMediaDefaultFolderByEntity(
				client,
				"product",
			);

			const mediaId = await uploadUrl(client, {
				url: data.url,
				fileName: data.fileName,
				mediaFolderId,
			});

			return {
				content: [
					{
						type: "text",
						text: serializeLLM({ mediaId }),
					},
				],
			};
		},
	);
}
