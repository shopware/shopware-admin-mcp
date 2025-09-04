import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import { EntityRepository } from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import z from "zod";
import { serializeLLM } from "../shopware.js";

export function fetchEntitySchemaListEntities(
	server: McpServer,
	httpClient: HttpClient,
) {
	server.tool("fetch_entity_list", {}, async () => {
		const response = await httpClient.get("_info/entity-schema.json");

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(Object.keys(response.body || {})),
				},
			],
		};
	});
}

export function fetchEntitySchema(server: McpServer, httpClient: HttpClient) {
	server.tool(
		"fetch_single_entity_schema",
		{
			entity: z
				.string()
				.describe(
					"The entity to fetch the schema for, e.g. product, order, category, etc.",
				),
		},
		async (data) => {
			const response = await httpClient.get("_info/entity-schema.json");

			return {
				content: [
					{
						type: "text",
						// @ts-expect-error
						text: JSON.stringify(response.body[data.entity] || {}),
					},
				],
			};
		},
	);
}

export function dalAggregate(server: McpServer, httpClient: HttpClient) {
	server.tool(
		"dal_aggregate",
		{
			entity: z
				.string()
				.describe(
					"The entity to aggregate on, use fetch_entity_schema to get a list of entities and available fields",
				),
			type: z
				.enum(["count", "max", "min", "stats", "terms", "histogram"])
				.describe("The type of aggregation to perform"),
			field: z
				.string()
				.describe(
					"The field to aggregate on. on associations the field can be nested like orderCustomer.firstName use fetch_entity_schema to get a list of available fields",
				),
			filter: z
				.array(
					z.object({
						type: z
							.enum(["equals", "not_equals", "contains", "not_contains"])
							.describe("The type of filter to apply"),
						field: z.string().describe("The field to filter on"),
						value: z.string().describe("The value to filter for"),
					}),
				)
				.optional(),
		},
		async (data) => {
			const orderRepository = new EntityRepository<{ id: string }>(
				httpClient,
				data.entity,
			);
			const criteria = new Criteria<unknown>();
			criteria.setLimit(1);

			let agg: Parameters<typeof criteria.addAggregation>[0] | null = null;

			if (data.type === "count") {
				agg = Criteria.count("order_count", data.field);
			} else if (data.type === "max") {
				agg = Criteria.max("order_max", data.field);
			} else if (data.type === "min") {
				agg = Criteria.min("order_min", data.field);
			} else if (data.type === "stats") {
				agg = Criteria.stats("order_stats", data.field);
			} else if (data.type === "terms") {
				agg = Criteria.terms("order_terms", data.field);
			} else if (data.type === "histogram") {
				agg = Criteria.histogram("order_histogram", data.field);
			}

			if (data.filter && agg) {
				const filters = [];

				for (const filter of data.filter) {
					if (filter.type === "equals") {
						filters.push(Criteria.equals(filter.field, filter.value));
					} else if (filter.type === "not_equals") {
						filters.push(
							Criteria.not("and", [
								Criteria.equals(filter.field, filter.value),
							]),
						);
					} else if (filter.type === "contains") {
						filters.push(Criteria.contains(filter.field, filter.value));
					} else if (filter.type === "not_contains") {
						filters.push(
							Criteria.not("and", [
								Criteria.contains(filter.field, filter.value),
							]),
						);
					}
				}

				agg = Criteria.filter("filtered_agg", filters, agg);
			}

			if (agg) {
				criteria.addAggregation(agg);
			}

			const resp = await orderRepository.aggregate(criteria);

			// @ts-expect-error
			delete resp.data;

			return {
				content: [
					{
						type: "text",
						text: serializeLLM(resp),
					},
				],
			};
		},
	);
}
