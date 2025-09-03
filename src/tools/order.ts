import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "@shopware-ag/app-server-sdk";
import { EntityRepository } from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";
import z from "zod";
import { serializeLLM } from "../shopware.js";

const orderStatuses = [
	"open",
	"in_progress",
	"completed",
	"cancelled",
] as const;

type OrderListItem = {
	id: string;
	orderNumber: string;
	orderDateTime: string;
	amountTotal: number;
	orderCustomer: {
		firstName: string;
		lastName: string;
		email: string;
	};
	primaryOrderDelivery: {
		stateMachineState: {
			technicalName: string;
		};
	};
	primaryOrderTransaction: {
		stateMachineState: {
			technicalName: string;
		};
	};
	stateMachineState: {
		technicalName: string;
	};
	currency: {
		name: string;
	};
};

// list orders, list by status,
export function orderList(server: McpServer, httpClient: HttpClient) {
	server.tool(
		"order_list",
		{
			page: z.number().min(1).default(1),
			filters: z
				.object({
					status: z
						.enum(orderStatuses)
						.optional()
						.describe("Filter by order status"),
				})
				.optional(),
		},
		async (data) => {
			const orderRepository = new EntityRepository<OrderListItem>(
				httpClient,
				"order",
			);
			const criteria = new Criteria<OrderListItem>();
			criteria.addSorting(Criteria.sort("orderDateTime", "DESC"));
			criteria.setLimit(20);
			criteria.setPage(data.page);
			criteria.addFields(
				"id",
				"orderNumber",
				"orderDateTime",
				"amountTotal",
				"orderCustomer.firstName",
				"orderCustomer.lastName",
				"orderCustomer.email",
				"primaryOrderDelivery.stateMachineState.technicalName",
				"primaryOrderTransaction.stateMachineState.technicalName",
				"stateMachineState.technicalName",
				"currency.name",
			);

			if (data.filters?.status) {
				criteria.addFilter(
					Criteria.equals(
						"stateMachineState.technicalName",
						data.filters.status,
					),
				);
			}

			const orders = await orderRepository.search(criteria);

			return {
				content: [
					{
						type: "text",
						text: serializeLLM(orders),
					},
				],
			};
		},
	);
}

type OrderDetailItem = {
	id: string;
	orderNumber: string;
	orderDateTime: string;
	amountTotal: number;
	orderCustomer: {
		firstName: string;
		lastName: string;
		email: string;
	};
	billingAddress: {
		firstName: string;
		lastName: string;
		company: string;
		street: string;
		city: string;
		zipcode: string;
		country: {
			name: string;
		};
	};
	primaryOrderDelivery: {
		stateMachineState: {
			technicalName: string;
		};
		trackingCodes: string[];
		shippingOrderAddress: {
			firstName: string;
			lastName: string;
			company: string;
			street: string;
			city: string;
			zipcode: string;
			country: {
				name: string;
			};
		};
	};
	primaryOrderTransaction: {
		stateMachineState: {
			technicalName: string;
		};
	};
	stateMachineState: {
		technicalName: string;
	};
	lineItems: {
		referencedId: string;
		label: string;
		quantity: number;
		position: number;
		unitPrice: number;
		totalPrice: number;
	}[];
	currency: {
		name: string;
	};
};

// get detailed a single order
export function orderDetail(server: McpServer, httpClient: HttpClient) {
	server.tool(
		"order_detail",
		{
			id: z.string().describe("The ID of the order to retrieve"),
		},
		async (data) => {
			const orderRepository = new EntityRepository<OrderDetailItem>(
				httpClient,
				"order",
			);
			const criteria = new Criteria<OrderDetailItem>([data.id]);
			criteria.addFields(
				"id",
				"orderNumber",
				"orderDateTime",
				"amountTotal",
				"orderCustomer.firstName",
				"orderCustomer.lastName",
				"orderCustomer.email",
				"primaryOrderDelivery.stateMachineState.technicalName",
				"primaryOrderTransaction.stateMachineState.technicalName",
				"stateMachineState.technicalName",
				"billingAddress.firstName",
				"billingAddress.lastName",
				"billingAddress.company",
				"billingAddress.street",
				"billingAddress.city",
				"billingAddress.zipcode",
				"billingAddress.country.name",
				"primaryOrderDelivery.trackingCodes",
				"primaryOrderDelivery.shippingOrderAddress.firstName",
				"primaryOrderDelivery.shippingOrderAddress.lastName",
				"primaryOrderDelivery.shippingOrderAddress.company",
				"primaryOrderDelivery.shippingOrderAddress.street",
				"primaryOrderDelivery.shippingOrderAddress.city",
				"primaryOrderDelivery.shippingOrderAddress.zipcode",
				"primaryOrderDelivery.shippingOrderAddress.country.name",

				"currency.name",

				"lineItems.referencedId",
				"lineItems.label",
				"lineItems.quantity",
				"lineItems.position",
				"lineItems.unitPrice",
				"lineItems.totalPrice",
			);

			const orders = await orderRepository.search(criteria);

			return {
				content: [
					{
						type: "text",
						text: serializeLLM(orders),
					},
				],
			};
		},
	);
}

// update order status, shipping address, billing address
export function orderUpdate(server: McpServer, httpClient: HttpClient) {
	server.tool(
		"order_update",
		{
			id: z.string().describe("The ID of the order to update"),
			status: z
				.enum(["cancel", "reopen", "in_progress", "completed"])
				.describe("The new status of the order")
				.optional(),
		},
		async (data) => {
			if (data.status) {
				await httpClient.post(`/_action/order/${data.id}/state/${data.status}`);
			}

			return {
				content: [
					{
						type: "text",
						text: `Order ${data.id} updated successfully.`,
					},
				],
			};
		},
	);
}
