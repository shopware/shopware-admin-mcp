import type { HttpClient } from "@shopware-ag/app-server-sdk";
import {
	EntityRepository,
	uuid,
} from "@shopware-ag/app-server-sdk/helper/admin-api";
import { Criteria } from "@shopware-ag/app-server-sdk/helper/criteria";

export type Tax = {
	id: string;
	name: string;
	taxRate: number;
};

export async function getOrCreateTaxByRate(
	client: HttpClient,
	taxRate: number,
): Promise<string> {
	const taxRepository = new EntityRepository<Tax>(client, "tax");

	const taxCriteria = new Criteria();
	taxCriteria.addFilter(Criteria.equals("taxRate", taxRate));

	const tax = await taxRepository.searchIds(taxCriteria);

	if (tax.length) {
		return tax[0];
	}

	const taxId = uuid();

	await taxRepository.upsert([
		{
			id: uuid(),
			name: `Tax ${taxRate}`,
			taxRate: taxRate,
		},
	]);

	return taxId;
}
