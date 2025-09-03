// biome-ignore lint/suspicious/noExplicitAny: we want to reduce any entity
export function serializeLLM(result: { data: any[] } | any): string {
	if ("data" in result) {
		for (const item of result.data) {
			reduceEntity(item);
		}

		return JSON.stringify(result);
	} else {
		return JSON.stringify(reduceEntity(result));
	}
}

// biome-ignore lint/suspicious/noExplicitAny: we want to reduce any entity
function reduceEntity(entity: any) {
	delete entity.extensions;
	delete entity._uniqueIdentifier;
	delete entity.apiAlias;
	return entity;
}
