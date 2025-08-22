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
			name: z.string().describe("Category name"),
			parentId: z
				.string()
				.optional()
				.describe("Parent category ID (optional for root category)"),
			active: z
				.boolean()
				.default(true)
				.describe("Whether the category should be active"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
				name: string;
				parentId?: string;
				active: boolean;
			}>(client, "category");

			const id = uuid();

			const payload = {
				id,
				name: data.name,
				active: data.active,
				...(data.parentId && { parentId: data.parentId }),
			};

			try {
				await categoryRepository.upsert([payload], new ApiContext(null, true));

				return {
					content: [
						{
							type: "text",
							text: `Category created successfully with ID: ${id}`,
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating category: ${serializeLLM(e)}`,
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
			id: z.string().describe("Category ID to update"),
			name: z.string().optional().describe("New category name"),
			parentId: z.string().optional().describe("New parent category ID"),
			active: z
				.boolean()
				.optional()
				.describe("Whether the category should be active"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
				name?: string;
				parentId?: string;
				active?: boolean;
			}>(client, "category");

			const payload = {
				id: data.id,
				...(data.name && { name: data.name }),
				...(data.parentId !== undefined && { parentId: data.parentId }),
				...(data.active !== undefined && { active: data.active }),
			};

			try {
				await categoryRepository.upsert([payload], new ApiContext(null, true));

				return {
					content: [
						{
							type: "text",
							text: "Category updated successfully",
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error updating category: ${serializeLLM(e)}`,
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
			id: z.string().describe("Category ID to delete"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const categoryRepository = new EntityRepository<{
				id: string;
			}>(client, "category");

			try {
				await categoryRepository.delete(
					[{ id: data.id }],
					new ApiContext(null, true),
				);

				return {
					content: [
						{
							type: "text",
							text: "Category deleted successfully",
						},
					],
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error deleting category: ${serializeLLM(e)}`,
						},
					],
				};
			}
		},
	);
}
