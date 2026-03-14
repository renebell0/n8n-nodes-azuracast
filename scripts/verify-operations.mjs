import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const snapshotPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.openapi.snapshot.json');

const openApiUrl =
	process.env.AZURACAST_OPENAPI_URL ??
	'https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/web/static/openapi.yml';

const methodOrder = ['get', 'post', 'put', 'patch', 'delete', 'head'];

function normalizeText(value) {
	if (!value || typeof value !== 'string') {
		return '';
	}
	return value.replace(/\s+/g, ' ').trim();
}

function refValue(document, ref) {
	if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) {
		return undefined;
	}
	return ref
		.slice(2)
		.split('/')
		.reduce((acc, key) => acc?.[key], document);
}

function generateFallbackOperationId(method, routePath) {
	const slug = routePath
		.replace(/[{}]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
	return `${method.toLowerCase()}${slug}`;
}

function extractOperationMap(document) {
	const operationMap = {};
	const duplicateOperationIds = [];
	const paths = document?.paths ?? {};
	for (const [routePath, pathItem] of Object.entries(paths)) {
		for (const method of methodOrder) {
			const operation = pathItem?.[method];
			if (!operation || typeof operation !== 'object') {
				continue;
			}
			const resolvedOperation = operation.$ref ? refValue(document, operation.$ref) : operation;
			const operationId =
				normalizeText(resolvedOperation?.operationId) ||
				generateFallbackOperationId(method, routePath);
			if (operationMap[operationId]) {
				duplicateOperationIds.push(operationId);
			}
			operationMap[operationId] = {
				method: method.toUpperCase(),
				path: routePath,
				isPublic:
					Array.isArray(resolvedOperation?.security) && resolvedOperation.security.length === 0,
			};
		}
	}
	return {
		operationMap,
		duplicateOperationIds: [...new Set(duplicateOperationIds)].sort((a, b) => a.localeCompare(b)),
	};
}

async function loadOpenApiDocument(url) {
	const response = await fetch(url, {
		headers: {
			Accept: 'application/yaml,text/yaml,text/plain,*/*',
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch OpenAPI document (${response.status} ${response.statusText})`);
	}
	return YAML.parse(await response.text());
}

async function main() {
	const snapshotRaw = await fs.readFile(snapshotPath, 'utf8');
	const snapshot = JSON.parse(snapshotRaw);
	const snapshotOperationMap = Object.fromEntries(
		Object.entries(snapshot.operationMap ?? {}).map(([id, operation]) => [
			id,
			{
				method: String(operation.method ?? '').toUpperCase(),
				path: String(operation.path ?? ''),
				isPublic: Boolean(operation.isPublic),
			},
		]),
	);
	const snapshotOperationIds = Object.keys(snapshotOperationMap).sort((a, b) => a.localeCompare(b));
	const openApiDocument = await loadOpenApiDocument(openApiUrl);
	const { operationMap: officialOperationMap, duplicateOperationIds } =
		extractOperationMap(openApiDocument);
	const officialOperationIds = Object.keys(officialOperationMap).sort((a, b) => a.localeCompare(b));

	const missing = officialOperationIds.filter((id) => !snapshotOperationIds.includes(id));
	const extra = snapshotOperationIds.filter((id) => !officialOperationIds.includes(id));
	const drift = officialOperationIds
		.filter((id) => snapshotOperationMap[id])
		.filter((id) => {
			const snapshotOperation = snapshotOperationMap[id];
			const officialOperation = officialOperationMap[id];
			return (
				snapshotOperation.method !== officialOperation.method ||
				snapshotOperation.path !== officialOperation.path ||
				snapshotOperation.isPublic !== officialOperation.isPublic
			);
		})
		.map((id) => {
			const snapshotOperation = snapshotOperationMap[id];
			const officialOperation = officialOperationMap[id];
			return `${id}
  snapshot: ${snapshotOperation.method} ${snapshotOperation.path} public=${snapshotOperation.isPublic}
  official: ${officialOperation.method} ${officialOperation.path} public=${officialOperation.isPublic}`;
		});

	if (duplicateOperationIds.length || missing.length || extra.length || drift.length) {
		if (duplicateOperationIds.length) {
			process.stderr.write(
				`Duplicate operation IDs in official OpenAPI (${duplicateOperationIds.length}):\n${duplicateOperationIds.join('\n')}\n`,
			);
		}
		if (missing.length) {
			process.stderr.write(`Missing operations (${missing.length}):\n${missing.join('\n')}\n`);
		}
		if (extra.length) {
			process.stderr.write(`Extra operations (${extra.length}):\n${extra.join('\n')}\n`);
		}
		if (drift.length) {
			process.stderr.write(`Operation metadata drift (${drift.length}):\n${drift.join('\n')}\n`);
		}
		process.exit(1);
	}

	process.stdout.write(
		`Operation coverage verified: ${officialOperationIds.length}/${officialOperationIds.length} (metadata aligned)\n`,
	);
}

await main();
