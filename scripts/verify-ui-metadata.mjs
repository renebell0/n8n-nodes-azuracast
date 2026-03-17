import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function isPathLikeLabel(value) {
	const normalized = String(value ?? '').trim();
	if (!normalized) {
		return false;
	}
	return normalized.startsWith('/') || normalized.includes('/api/') || /[\[\]{}]/.test(normalized);
}

function hasDiscouragedBinaryLabel(value) {
	const normalized = String(value ?? '').toLowerCase();
	return normalized.includes('binary property') || normalized.includes('binary data');
}

async function main() {
	const modulePath = pathToFileURL(
		path.join(projectRoot, 'dist', 'nodes', 'AzuraCast', 'properties', 'index.js'),
	).href;
	const module = await import(modulePath);
	const properties = Array.isArray(module.azuraCastNodeProperties) ? module.azuraCastNodeProperties : [];

	const resourceProperty = properties.find((property) => property?.name === 'resource');
	if (!resourceProperty || !Array.isArray(resourceProperty.options) || resourceProperty.options.length === 0) {
		throw new Error('Resource options are missing from node properties.');
	}
	const resourceDefault = String(resourceProperty.default ?? '').trim();
	if (!resourceDefault) {
		throw new Error('Resource selector default is empty.');
	}
	if (!resourceProperty.options.some((option) => String(option?.value ?? '').trim() === resourceDefault)) {
		throw new Error(`Resource selector default "${resourceDefault}" does not match available options.`);
	}

	const operationProperties = properties.filter((property) => property?.name === 'operation');
	if (operationProperties.length !== resourceProperty.options.length) {
		throw new Error(
			`Operation selector count mismatch. expected=${resourceProperty.options.length} actual=${operationProperties.length}`,
		);
	}

	const allValues = new Set();
	for (const operationProperty of operationProperties) {
		const options = Array.isArray(operationProperty.options) ? operationProperty.options : [];
		if (options.length === 0) {
			throw new Error('Found an operation selector without options.');
		}
		const operationDefault = String(operationProperty.default ?? '').trim();
		if (!operationDefault) {
			throw new Error('Found an operation selector with empty default.');
		}
		if (!options.some((option) => String(option?.value ?? '').trim() === operationDefault)) {
			throw new Error(
				`Operation selector default "${operationDefault}" does not match available options.`,
			);
		}
		const names = new Set();
		for (const option of options) {
			const name = String(option?.name ?? '').trim();
			const value = String(option?.value ?? '').trim();
			const action = String(option?.action ?? '').trim();
			if (!name || !value || !action) {
				throw new Error(`Operation option is missing required fields. name="${name}" value="${value}" action="${action}"`);
			}
			if (isPathLikeLabel(name)) {
				throw new Error(`Operation option label is not UI-safe: "${name}"`);
			}
			if (isPathLikeLabel(action)) {
				throw new Error(`Operation action label is not UI-safe: "${action}"`);
			}
			if (!action.includes(' in ')) {
				throw new Error(`Operation action label is missing resource context: "${action}"`);
			}
			if (names.has(name)) {
				throw new Error(`Duplicate operation label within the same resource: "${name}"`);
			}
			names.add(name);
			if (allValues.has(value)) {
				throw new Error(`Duplicate operation value detected: "${value}"`);
			}
			allValues.add(value);
		}
	}

	for (const property of properties) {
		const displayName = String(property?.displayName ?? '').trim();
		if (hasDiscouragedBinaryLabel(displayName)) {
			throw new Error(`Discouraged binary field label found: "${displayName}"`);
		}
	}

	process.stdout.write(
		`UI metadata verified: resources=${resourceProperty.options.length} operationSelectors=${operationProperties.length} operations=${allValues.size}\n`,
	);
}

await main();
