import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	getMediaDefaultFolderByEntity,
	uploadMediaByUrl as uploadUrl,
} from "@shopware-ag/app-server-sdk/helper/media";
import { z } from "zod";
import { serializeLLM } from "../shopware.js";

export function uploadMediaByUrl(server: McpServer, client: HttpClient) {
	server.tool(
		"upload_media_by_url",
		{
			url: z.string().url().describe("The URL of the media to upload"),
			fileName: z.string().describe("File name for the uploaded media"),
		},
		async (data) => {
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
