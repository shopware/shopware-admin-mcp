import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SimpleShop } from "@shopware-ag/app-server-sdk";
import {
	ApiContext,
	Defaults,
	EntityRepository,
	uuid,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { getClient, shopRepo, type Price } from "../shopware";

export class ShopwareAdminMCP extends McpAgent<unknown, unknown, { shopId: string }> {
	server = new McpServer({
		name: "Shopware",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"product_list",
			{
				page: z.number().min(1).default(1),
				term: z.string().optional().describe("Search term"),
			},
			async (data) => {
				const client = await getClient(this.props.shopId)

				const productRepository = new EntityRepository<{
					productNumber: string;
					name: string;
					description: string;
				}>(client, "product");

				const criteria = new Criteria();
				criteria.addFields("id", "productNumber", "name");
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
							text: JSON.stringify(products, null, 2),
						},
					],
				};
			},
		);

		this.server.tool("product_get", { id: z.string() }, async ({ id }) => {
			const client = await getClient(this.props.shopId);

			const productRepository = new EntityRepository<{
				productNumber: string;
				name: string;
				description: string;
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
						text: JSON.stringify(product, null, 2),
					},
				],
			};
		});

		this.server.tool(
			"product_create",
			{
				name: z.string(),
				productNumber: z.string(),
				description: z.string(),
				taxRate: z.number().default(19),
				stock: z.number().default(0),
				netPrice: z.number().min(0),
				grossPrice: z.number().min(0),
			},
			async (data) => {
				const client = await getClient(this.props.shopId)

				const productRepository = new EntityRepository<{
					name: string;
					taxId: string;
					description: string;
					productNumber: string;
					price: Price[];
					stock: number;
				}>(client, "product");

				const taxRepository = new EntityRepository<{
					id: string;
					name: string;
					taxRate: number;
				}>(client, "tax");
				const taxCriteria = new Criteria();
				taxCriteria.addFilter(Criteria.equals("taxRate", data.taxRate));

				let tax = (
					await taxRepository.search(taxCriteria, new ApiContext(null, true))
				).first();

				if (!tax) {
					tax = {
						id: uuid(),
						name: `Tax ${data.taxRate}`,
						taxRate: data.taxRate,
					};

					await taxRepository.upsert([tax]);
				}

				const payload = {
					id: uuid(),
					productNumber: data.productNumber,
					name: data.name,
					active: false,
					description: data.description,
					taxId: tax.id,
					stock: data.stock,
					price: [
						{
							currencyId: Defaults.systemCurrencyId,
							net: data.netPrice,
							gross: data.grossPrice,
							linked: false,
						},
					],
				};

				try {
					await productRepository.upsert([payload], new ApiContext(null, true));
				} catch (e) {
					console.log(JSON.stringify(e, null, 2));
				}

				return {
					content: [
						{
							type: "text",
							text: `Product created with id: ${payload.id}. Product is not yet active`,
						},
					],
				};
			},
		);

		this.server.tool(
			"product_update",
			{
				id: z.string(),
				active: z.boolean().optional(),
				name: z.string().optional(),
				description: z.string().optional(),
			},
			async (data) => {
				const client = await getClient(this.props.shopId)

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
	}
}
