import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const expectedResourceLabels = [
	'Administration Backup',
	'Administration Custom Field',
	'Administration Debugging',
	'Administration General',
	'Administration Role',
	'Administration Settings',
	'Administration Station',
	'Administration Storage Location',
	'Administration User',
	'Miscellaneous',
	'My Account',
	'Public Miscellaneous',
	'Public Now Playing',
	'Public Station',
	'Station Broadcasting',
	'Station General',
	'Station HLS Stream',
	'Station Media',
	'Station Mount Point',
	'Station Playlist',
	'Station Podcast',
	'Station Queue',
	'Station Remote Relay',
	'Station Report',
	'Station SFTP User',
	'Station Streamer/DJ',
	'Station Web Hook',
];

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
	const nodeModulePath = pathToFileURL(
		path.join(projectRoot, 'dist', 'nodes', 'AzuraCast', 'AzuraCast.node.js'),
	).href;
	const modulePath = pathToFileURL(
		path.join(projectRoot, 'dist', 'nodes', 'AzuraCast', 'properties', 'index.js'),
	).href;
	const nodeModule = await import(nodeModulePath);
	const module = await import(modulePath);
	const node = new nodeModule.AzuraCast();
	const properties = Array.isArray(module.azuraCastNodeProperties) ? module.azuraCastNodeProperties : [];
	const subtitle = String(node?.description?.subtitle ?? '').trim();
	if (!subtitle.includes('$parameter["operation"]') || !subtitle.includes('$parameter["resource"]')) {
		throw new Error(`Node subtitle is not resource-aware: "${subtitle}"`);
	}

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
	const actualResourceLabels = resourceProperty.options.map((option) => String(option?.name ?? '').trim());
	assert.deepEqual(
		actualResourceLabels,
		expectedResourceLabels,
		`Resource selector labels do not match expected singular labels.\nExpected: ${expectedResourceLabels.join(', ')}\nActual: ${actualResourceLabels.join(', ')}`,
	);

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
		const sortedNames = [...options]
			.map((option) => String(option?.name ?? '').trim())
			.sort((a, b) => a.localeCompare(b));
		const actualNames = options.map((option) => String(option?.name ?? '').trim());
		assert.deepEqual(actualNames, sortedNames, 'Operation selector options must be sorted alphabetically.');
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
			const nameWordCount = name.split(/\s+/).filter(Boolean).length;
			if (nameWordCount > 8) {
				throw new Error(`Operation option label is too long (${nameWordCount} words): "${name}"`);
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
		if (property?.type === 'collection' && Array.isArray(property.options) && property.options.length > 1) {
			const actualCollectionNames = property.options.map((option) =>
				String(option?.displayName ?? option?.name ?? '').trim(),
			);
			const sortedCollectionNames = [...actualCollectionNames].sort((a, b) => a.localeCompare(b));
			assert.deepEqual(
				actualCollectionNames,
				sortedCollectionNames,
				`Optional collection "${property.name}" is not sorted alphabetically.`,
			);
		}
		if (property?.type === 'resourceLocator') {
			if (!displayName.endsWith('Name or ID')) {
				throw new Error(`Resource locator label must end with "Name or ID": "${displayName}"`);
			}
			const description = String(property?.description ?? '').trim();
			if (!description.includes('Choose a name from the list, or specify an ID using an expression.')) {
				throw new Error(`Resource locator guidance is missing for "${displayName}"`);
			}
			const modes = Array.isArray(property.modes) ? property.modes : [];
			if (modes.length !== 2 || modes[0]?.name !== 'list' || modes[1]?.name !== 'id') {
				throw new Error(`Resource locator "${displayName}" must expose only list and id modes.`);
			}
			if (String(property?.default?.mode ?? '') !== 'list') {
				throw new Error(`Resource locator "${displayName}" must default to list mode.`);
			}
			const listPlaceholder = String(modes[0]?.placeholder ?? '').trim();
			if (!/^Choose an? /i.test(listPlaceholder)) {
				throw new Error(`Resource locator list placeholder must start with "Choose a" or "Choose an": "${listPlaceholder}"`);
			}
		}
	}

	process.stdout.write(
		`UI metadata verified: resources=${resourceProperty.options.length} operationSelectors=${operationProperties.length} operations=${allValues.size}\n`,
	);
}

await main();
