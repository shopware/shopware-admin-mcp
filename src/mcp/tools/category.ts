import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	ApiContext,
	EntityRepository,
	uuid,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { z } from "zod";
import { getClient, serializeLLM } from "../../shopware";

export function categoryList(server: McpServer, shopId: string) {
	server.tool("category_list", {}, async () => {
		const client = await getClient(shopId);

		const categoryRepository = new EntityRepository<{
			id: string;
			active: boolean;
			translated: { name: string };
			parentId: string | null;
		}>(client, "category");

		const criteria = new Criteria();
		criteria.addFields("id", "name", "parentId", "active");
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

export function categoryCreate(server: McpServer, shopId: string) {
	server.tool(
		"category_create",
		{
			categories: z
				.array(
					z.object({
						name: z.string().describe("Category name"),
						parentId: z
							.string()
							.optional()
							.describe("Parent category ID (optional for root category)"),
						active: z
							.boolean()
							.default(true)
							.describe("Whether the category should be active"),
					}),
				)
				.describe("Array of categories to create"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
				name: string;
				parentId?: string;
				active: boolean;
			}>(client, "category");

			const payloads = data.categories.map((category) => ({
				id: uuid(),
				name: category.name,
				active: category.active,
				...(category.parentId && { parentId: category.parentId }),
			}));

			try {
				await categoryRepository.upsert(payloads, new ApiContext(null, true));

				return {
					content: [
						{
							type: "text",
							text: serializeLLM(
								payloads.map((p) => ({ id: p.id, name: p.name })),
							),
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating categories: ${serializeLLM(e)}`,
						},
					],
				};
			}
		},
	);
}

export function categoryUpdate(server: McpServer, shopId: string) {
	server.tool(
		"category_update",
		{
			categories: z
				.array(
					z.object({
						id: z.string().describe("Category ID to update"),
						name: z.string().optional().describe("New category name"),
						parentId: z.string().optional().describe("New parent category ID"),
						active: z
							.boolean()
							.optional()
							.describe("Whether the category should be active"),
					}),
				)
				.describe("Array of categories to update"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
				name?: string;
				parentId?: string;
				active?: boolean;
			}>(client, "category");

			const payloads = data.categories.map((category) => ({
				id: category.id,
				...(category.name && { name: category.name }),
				...(category.parentId !== undefined && { parentId: category.parentId }),
				...(category.active !== undefined && { active: category.active }),
			}));

			try {
				await categoryRepository.upsert(payloads, new ApiContext(null, true));

				return {
					content: [
						{
							type: "text",
							text: "Updated all categories successfully",
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error updating categories: ${serializeLLM(e)}`,
						},
					],
				};
			}
		},
	);
}

export function categoryDelete(server: McpServer, shopId: string) {
	server.tool(
		"category_delete",
		{
			ids: z.array(z.string()).describe("Array of category IDs to delete"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
			}>(client, "category");

			try {
				await categoryRepository.delete(
					data.ids.map((id) => ({ id })),
					new ApiContext(null, true),
				);

				return {
					content: [
						{
							type: "text",
							text: serializeLLM({
								success: true,
								count: data.ids.length,
								deletedIds: data.ids,
							}),
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error deleting categories: ${serializeLLM(e)}`,
						},
					],
				};
			}
		},
	);
}
