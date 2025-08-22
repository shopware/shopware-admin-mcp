import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	ApiContext,
	Defaults,
	// Defaults,
	EntityRepository,
	uuid,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { z } from "zod";
import { getClient, serializeLLM } from "../../shopware";
import { getOrCreateTaxByRate } from "./helper";

type Price = {
	currencyId: string;
	net: number;
	gross: number;
	linked: boolean;
};

type ProductCreate = {
	id: string;
	active: boolean;
	name: string;
	taxId: string;
	description: string;
	productNumber: string;
	price: Price[];
	stock: number;
	visibilities: {
		salesChannelId: string;
		visibility: number;
	}[];
}

export const productList = (server: McpServer, shopId: string) => {
	server.tool(
		"product_list",
		{
			page: z.number().min(1).default(1),
			term: z.string().optional().describe("Search term"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const productRepository = new EntityRepository<{
				productNumber: string;
				name: string;
				description: string;
				stock: number;
				price: Price[];
			}>(client, "product");

			const criteria = new Criteria();
			criteria.addFields("id", "productNumber", "name", "stock", "price");
			criteria.setLimit(50);
			criteria.setPage(data.page);

			const products = await productRepository.search(
				criteria,
				new ApiContext(null, true),
			);

			return {
				content: [
					{
						type: "text",
						text: serializeLLM(products),
					},
				],
			};
		},
	);
};

export const productGet = (server: McpServer, shopId: string) => {
	server.tool("product_get", { id: z.string() }, async ({ id }) => {
		const client = await getClient(shopId);

		const productRepository = new EntityRepository<{
			productNumber: string;
			name: string;
			description: string;
			price: Price[];
		}>(client, "product");

		const criteria = new Criteria([id]);
		criteria.addFields("name", "description", "price");

		const product = (
			await productRepository.search(criteria, new ApiContext(null, true))
		).first();

		if (!product) {
			return {
				content: [
					{
						type: "text",
						text: "Product not found",
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: serializeLLM(product),
				},
			],
		};
	});
};

export const productCreate = (server: McpServer, shopId: string) => {
	server.tool(
		"product_create",
		{
			name: z.string(),
			productNumber: z.string(),
			description: z.string(),
			taxRate: z.number().default(19),
			stock: z.number().default(0),
			netPrice: z.number().min(0),
			grossPrice: z.number().min(0),
			visibilities: z
				.array(z.string())
				.optional()
				.describe("Sales channel ids in which the product should be visible"),
		},
		async (data) => {
			const client = await getClient(shopId);

			const productRepository = new EntityRepository<ProductCreate>(client, "product");

			const taxId = await getOrCreateTaxByRate(client, data.taxRate);

			const id = uuid();

			try {
				await productRepository.upsert([{
				id,
				productNumber: data.productNumber,
				name: data.name,
				active: false,
				description: data.description,
				taxId,
				stock: data.stock,
				price: [
					{
						currencyId: Defaults.systemCurrencyId,
						net: data.netPrice,
						gross: data.grossPrice,
						linked: false,
					},
				],
				visibilities: data.visibilities?.map((salesChannelId) => ({
					salesChannelId,
					visibility: 30, // Default visibility
				})) || [],
			}], new ApiContext(null, true));
			} catch (e) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating product: ${serializeLLM(e)}`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: `Product created with id: ${id}. Product is not yet active`,
					},
				],
			};
		},
	);
};

export const productUpdate = (server: McpServer, shopId: string) => {
	server.tool(
		"product_update",
		{
			id: z.string(),
			active: z.boolean().optional(),
			name: z.string().optional(),
			description: z.string().optional(),
		},
		async (data) => {
			const client = await getClient(shopId);

			const productRepository = new EntityRepository<{
				name?: string;
				description?: string;
				active?: boolean;
			}>(client, "product");

			const payload = {
				id: data.id,
				...(data.active !== undefined && { active: data.active }),
				...(data.name && { name: data.name }),
				...(data.description && { description: data.description }),
			};

			await productRepository.upsert([payload], new ApiContext(null, true));

			return {
				content: [
					{
						type: "text",
						text: "Product updated successfully",
					},
				],
			};
		},
	);
};
