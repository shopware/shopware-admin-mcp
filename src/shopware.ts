import { env } from "cloudflare:workers";
import { CloudflareHttpClientTokenCache, CloudflareShopRepository } from "@shopware-ag/app-server-sdk/integration/cloudflare-kv";
import { AppActivateEvent, AppDeactivateEvent, AppServer, HttpClient, ShopInterface } from "@shopware-ag/app-server-sdk";

export const shopRepo = new CloudflareShopRepository(env.shopStorage);
export const tokenCache = new CloudflareHttpClientTokenCache(env.OAUTH_KV);

export const appServer = new AppServer({
	appName: 'SwagAdminMCP',
	appSecret: env.APP_SECRET,
	authorizeCallbackUrl: `${env.APP_URL}/app/register/confirm`
}, shopRepo, tokenCache);

appServer.hooks.on(
	"onAppActivate",
	async (event: AppActivateEvent<ShopInterface>) => {
		const shopId = event.shop.getShopId();
		const authHeader = btoa(crypto.randomUUID());
		await Promise.all([
			env.OAUTH_KV.put(`auth_${authHeader}`, shopId),
			env.OAUTH_KV.put(`reverse_${shopId}`, authHeader),
		]);
	},
);

appServer.hooks.on(
	"onAppDeactivate",
	async (event: AppDeactivateEvent<ShopInterface>) => {
		const shopId = event.shop.getShopId();
		const authHeader = await env.OAUTH_KV.get(`reverse_${shopId}`);

		if (authHeader) {
			await Promise.all([
				env.OAUTH_KV.delete(`auth_${authHeader}`),
				env.OAUTH_KV.delete(`reverse_${shopId}`),
			]);
		}
	},
);

const clients = new Map<string, HttpClient>();

export async function getClient(shopId: string): Promise<HttpClient> {
	if (clients.has(shopId)) {
		return clients.get(shopId)!;
	}

	const shop = await shopRepo.getShopById(shopId);

	if (!shop) {
		throw new Error(`Shop with id ${shopId} not found`);
	}

	const client = new HttpClient(shop, tokenCache);
	clients.set(shopId, client);
	return client;
}

export type Price = {
	currencyId: string;
	net: number;
	gross: number;
	linked: boolean;
};
