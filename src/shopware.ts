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
	for (const key of Object.keys(entity)) {
		if (Array.isArray(entity[key])) {
			for (const item of entity[key]) {
				reduceEntity(item);
			}
		} else if (entity[key] && typeof entity[key] === "object") {
			reduceEntity(entity[key]);
		}
	}

	if (Array.isArray(entity.translated) && entity.translated.length === 0) {
		delete entity.translated;
	}

	delete entity.versionId;

	if (entity.extensions) {
		delete entity.extensions.foreignKeys;
		delete entity.extensions.search;

		if (Object.keys(entity.extensions).length === 0) {
			delete entity.extensions;
		}
	}

	delete entity._uniqueIdentifier;
	delete entity.apiAlias;
	return entity;
}
