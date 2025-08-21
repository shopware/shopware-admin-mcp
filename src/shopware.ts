import { env } from "cloudflare:workers";
import { CloudflareShopRepository } from "@shopware-ag/app-server-sdk/integration/cloudflare-kv";
import { HttpClient } from "@shopware-ag/app-server-sdk";

export const shopRepo = new CloudflareShopRepository(env.shopStorage);

const clients = new Map<string, HttpClient>();

export async function getClient(shopId: string): Promise<HttpClient> {
	if (clients.has(shopId)) {
		return clients.get(shopId)!;
	}

	const shop = await shopRepo.getShopById(shopId);

	if (!shop) {
		throw new Error(`Shop with id ${shopId} not found`);
	}

	const client = new HttpClient(shop);
	clients.set(shopId, client);
	return client;
}

export type Price = {
	currencyId: string;
	net: number;
	gross: number;
	linked: boolean;
};
