import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	ApiContext,
	Defaults,
	// Defaults,
	EntityRepository,
	SyncOperation,
	SyncService,
	uuid,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { z } from "zod";
import { serializeLLM } from "../shopware.js";
import { getOrCreateTaxByRate } from "./helper.js";

type Price = {
	currencyId: string;
	net: number;
	gross: number;
	linked: boolean;
};

type ProductVisibility = {
	salesChannelId: string;
	visibility: number;
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
	visibilities: ProductVisibility[];
	categories: { id: string }[];
	coverId?: string | null;
	media?: { id: string; mediaId: string; position: number; cover: boolean }[];
};

type ProductUpdate = {
	id: string;
	active?: boolean;
	name?: string;
	description?: string;
	stock?: number;
	visibilities?: ProductVisibility[];
	categories?: { id: string }[];
	coverId?: string | null;
	media?: { id: string; mediaId: string; position: number; cover: boolean }[];
};

export const productList = (server: McpServer, client: HttpClient) => {
	server.tool(
		"product_list",
		{
			page: z.number().min(1).default(1),
			term: z.string().optional().describe("Search term"),
		},
		async (data) => {
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

			if (data.term) {
				criteria.setTerm(data.term);
			}

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

export const productGet = (server: McpServer, client: HttpClient) => {
	server.tool("product_get", { id: z.string() }, async ({ id }) => {
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

export const productCreate = (server: McpServer, client: HttpClient) => {
	server.tool(
		"product_create",
		{
			name: z.string(),
			active: z.boolean().default(false),
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
			categories: z
				.array(z.string())
				.optional()
				.describe("Category ids to which the product belongs"),
			media: z
				.array(
					z.object({
						mediaId: z.string().describe("ID of the media to link"),
						position: z.number().optional().describe("Position of the media"),
						cover: z
							.boolean()
							.default(false)
							.describe("Whether this media is the cover of the product"),
					}),
				)
				.optional()
				.describe("Array of media items to add to the product"),
		},
		async (data) => {
			const productRepository = new EntityRepository<ProductCreate>(
				client,
				"product",
			);

			const taxId = await getOrCreateTaxByRate(client, data.taxRate);

			const id = uuid();

			const payload: ProductCreate = {
				id,
				productNumber: data.productNumber,
				name: data.name,
				active: data.active,
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
				visibilities:
					data.visibilities?.map((salesChannelId) => ({
						salesChannelId,
						visibility: 30, // Default visibility
					})) || [],
				categories:
					data.categories?.map((categoryId) => ({
						id: categoryId,
					})) || [],
			};

			if (data.media) {
				payload.media = data.media.map((item) => ({
					id: uuid(),
					mediaId: item.mediaId,
					position: item.position ?? 0,
					cover: item.cover,
				}));

				const cover = payload.media?.filter((m) => m.cover === true) || [];
				payload.coverId = cover.length ? cover[0].id : null;
			}

			try {
				await productRepository.upsert([payload], new ApiContext(null, true));
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
						text: `Product created with id: ${id}.`,
					},
				],
			};
		},
	);
};

export const productUpdate = (server: McpServer, client: HttpClient) => {
	server.tool(
		"product_update",
		{
			id: z.string(),
			active: z.boolean().optional(),
			name: z.string().optional(),
			description: z.string().optional(),
			stock: z.number().optional(),
			visibilities: z
				.array(z.string())
				.optional()
				.describe(
					"Sales channel ids in which the product should be visible (replaces existing visibilities)",
				),
			media: z
				.array(
					z.object({
						mediaId: z.string().describe("ID of the media to link"),
						position: z.number().optional().describe("Position of the media"),
						cover: z
							.boolean()
							.default(false)
							.describe("Whether this media is the cover of the product"),
					}),
				)
				.optional()
				.describe("Array of media items to add to the product"),
			categories: z
				.array(z.string())
				.optional()
				.describe(
					"Category ids to which the product belongs (replaces existing categories)",
				),
		},
		async (data) => {
			const syncService = new SyncService(client);

			const ops: SyncOperation[] = [];

			if (data.visibilities) {
				ops.push(
					new SyncOperation(
						"visibility-delete",
						"product_visibility",
						"delete",
						[],
						[Criteria.equals("productId", data.id)],
					),
				);
			}

			const updatePayload: ProductUpdate = {
				id: data.id,
				...(data.active !== undefined && { active: data.active }),
				...(data.name && { name: data.name }),
				...(data.description && { description: data.description }),
				...(data.stock !== undefined && { stock: data.stock }),
				...(data.visibilities && {
					visibilities: data.visibilities.map((salesChannelId) => ({
						salesChannelId: salesChannelId,
						visibility: 30,
					})),
				}),
				...(data.categories && {
					categories: data.categories.map((categoryId) => ({
						id: categoryId,
					})),
				}),
			};

			if (data.media) {
				ops.push(
					new SyncOperation(
						"media-delete",
						"product_media",
						"delete",
						[],
						[Criteria.equals("productId", data.id)],
					),
				);

				updatePayload.media = data.media.map((item) => ({
					id: uuid(),
					mediaId: item.mediaId,
					position: item.position ?? 0,
					cover: item.cover,
				}));

				const cover =
					updatePayload.media?.filter((m) => m.cover === true) || [];
				updatePayload.coverId = cover.length ? cover[0].id : null;
			}

			ops.push(
				new SyncOperation("product-update", "product", "upsert", [
					updatePayload,
				]),
			);

			await syncService.sync(ops);

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
