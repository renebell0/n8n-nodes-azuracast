import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const snapshotPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.openapi.snapshot.json');
const domainsPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.domains.json');
const packageJsonPath = path.join(projectRoot, 'package.json');
const nodesDir = path.join(projectRoot, 'nodes', 'AzuraCast');
const propertiesDir = path.join(nodesDir, 'properties');
const executeDir = path.join(nodesDir, 'execute');

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
				tag: normalizeText(Array.isArray(resolvedOperation?.tags) ? resolvedOperation.tags[0] : '') || 'General',
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

function expectedOperationIdsByTag(snapshot) {
	const tagMap = {};
	for (const operation of snapshot.operations ?? []) {
		const tag = String(operation.tag ?? 'General');
		tagMap[tag] = tagMap[tag] ?? [];
		tagMap[tag].push(String(operation.id ?? '').trim());
	}
	for (const [tag, operationIds] of Object.entries(tagMap)) {
		tagMap[tag] = [...new Set(operationIds.filter((id) => id.length > 0))].sort((a, b) =>
			a.localeCompare(b),
		);
	}
	return tagMap;
}

async function fileExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function readDirectoryFileNamesSafe(directoryPath) {
	try {
		return (await fs.readdir(directoryPath, { withFileTypes: true }))
			.filter((entry) => entry.isFile())
			.map((entry) => entry.name);
	} catch {
		return [];
	}
}

async function main() {
	const snapshotRaw = await fs.readFile(snapshotPath, 'utf8');
	const snapshot = JSON.parse(snapshotRaw);
	const domainsRaw = await fs.readFile(domainsPath, 'utf8');
	const domainsManifest = JSON.parse(domainsRaw);
	const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

	const snapshotOperationMap = Object.fromEntries(
		Object.entries(snapshot.operationMap ?? {}).map(([id, operation]) => [
			id,
			{
				method: String(operation.method ?? '').toUpperCase(),
				path: String(operation.path ?? ''),
				tag: String(operation.tag ?? ''),
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
				snapshotOperation.tag !== officialOperation.tag ||
				snapshotOperation.isPublic !== officialOperation.isPublic
			);
		})
		.map((id) => {
			const snapshotOperation = snapshotOperationMap[id];
			const officialOperation = officialOperationMap[id];
			return `${id}
  snapshot: ${snapshotOperation.method} ${snapshotOperation.path} tag=${snapshotOperation.tag} public=${snapshotOperation.isPublic}
  official: ${officialOperation.method} ${officialOperation.path} tag=${officialOperation.tag} public=${officialOperation.isPublic}`;
		});

	const domains = Array.isArray(domainsManifest.domains) ? domainsManifest.domains : [];
	const expectedByTag = expectedOperationIdsByTag(snapshot);
	const expectedTags = Object.keys(expectedByTag).sort((a, b) => a.localeCompare(b));
	const domainTags = domains.map((domain) => String(domain.tag ?? '')).sort((a, b) => a.localeCompare(b));
	const missingDomainTags = expectedTags.filter((tag) => !domainTags.includes(tag));
	const extraDomainTags = domainTags.filter((tag) => !expectedTags.includes(tag));

	const domainCoverageMissing = [];
	const domainCoverageExtra = [];
	for (const domain of domains) {
		const tag = String(domain.tag ?? '');
		const operationIds = [...new Set((domain.operationIds ?? []).map((id) => String(id ?? '').trim()))]
			.filter((id) => id.length > 0)
			.sort((a, b) => a.localeCompare(b));
		const expectedIds = expectedByTag[tag] ?? [];
		const missingIds = expectedIds.filter((id) => !operationIds.includes(id));
		const extraIds = operationIds.filter((id) => !expectedIds.includes(id));
		if (missingIds.length > 0) {
			domainCoverageMissing.push(`${tag}: ${missingIds.join(', ')}`);
		}
		if (extraIds.length > 0) {
			domainCoverageExtra.push(`${tag}: ${extraIds.join(', ')}`);
		}
	}

	const duplicateDomainAssignments = [];
	const domainOperationOwner = new Map();
	for (const domain of domains) {
		const tag = String(domain.tag ?? '');
		for (const operationIdRaw of domain.operationIds ?? []) {
			const operationId = String(operationIdRaw ?? '').trim();
			if (!operationId) {
				continue;
			}
			if (domainOperationOwner.has(operationId)) {
				duplicateDomainAssignments.push(
					`${operationId}: ${domainOperationOwner.get(operationId)} and ${tag}`,
				);
				continue;
			}
			domainOperationOwner.set(operationId, tag);
		}
	}

	const missingInDomainManifest = officialOperationIds.filter((id) => !domainOperationOwner.has(id));
	const extraInDomainManifest = [...domainOperationOwner.keys()].filter(
		(id) => !officialOperationIds.includes(id),
	);

	const requiredNodeSourceFiles = [
		path.join(nodesDir, 'AzuraCast.node.ts'),
		path.join(nodesDir, 'AzuraCast.node.json'),
		path.join(propertiesDir, 'index.ts'),
		path.join(propertiesDir, 'resources.ts'),
		path.join(executeDir, 'index.ts'),
	];
	const missingNodeSourceFiles = [];
	for (const requiredFilePath of requiredNodeSourceFiles) {
		if (!(await fileExists(requiredFilePath))) {
			missingNodeSourceFiles.push(path.relative(projectRoot, requiredFilePath));
		}
	}

	const propertiesFiles = await readDirectoryFileNamesSafe(propertiesDir);
	const executeFiles = await readDirectoryFileNamesSafe(executeDir);
	const operationPropertyFiles = propertiesFiles.filter((name) => name.endsWith('.operations.ts'));
	const fieldPropertyFiles = propertiesFiles.filter((name) => name.endsWith('.fields.ts'));
	const executeResourceFiles = executeFiles.filter((name) => name !== 'index.ts' && name.endsWith('.ts'));
	const expectedResourceFileCount = domains.length;
	const moduleFileCountMismatchMessages = [];
	if (operationPropertyFiles.length !== expectedResourceFileCount) {
		moduleFileCountMismatchMessages.push(
			`properties/*.operations.ts expected=${expectedResourceFileCount} actual=${operationPropertyFiles.length}`,
		);
	}
	if (fieldPropertyFiles.length !== expectedResourceFileCount) {
		moduleFileCountMismatchMessages.push(
			`properties/*.fields.ts expected=${expectedResourceFileCount} actual=${fieldPropertyFiles.length}`,
		);
	}
	if (executeResourceFiles.length !== expectedResourceFileCount) {
		moduleFileCountMismatchMessages.push(
			`execute/*.ts expected=${expectedResourceFileCount} actual=${executeResourceFiles.length}`,
		);
	}

	const expectedNodePaths = ['dist/nodes/AzuraCast/AzuraCast.node.js'];
	const packageNodePaths = [...(packageJson.n8n?.nodes ?? [])]
		.map((value) => String(value))
		.sort((a, b) => a.localeCompare(b));
	const missingPackageNodePaths = expectedNodePaths.filter((value) => !packageNodePaths.includes(value));
	const extraPackageNodePaths = packageNodePaths.filter((value) => !expectedNodePaths.includes(value));

	if (
		duplicateOperationIds.length ||
		missing.length ||
		extra.length ||
		drift.length ||
		missingDomainTags.length ||
		extraDomainTags.length ||
		domainCoverageMissing.length ||
		domainCoverageExtra.length ||
		duplicateDomainAssignments.length ||
		missingInDomainManifest.length ||
		extraInDomainManifest.length ||
		missingNodeSourceFiles.length ||
		moduleFileCountMismatchMessages.length ||
		missingPackageNodePaths.length ||
		extraPackageNodePaths.length
	) {
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
		if (missingDomainTags.length) {
			process.stderr.write(
				`Missing domains in azuracast.domains.json (${missingDomainTags.length}):\n${missingDomainTags.join('\n')}\n`,
			);
		}
		if (extraDomainTags.length) {
			process.stderr.write(
				`Extra domains in azuracast.domains.json (${extraDomainTags.length}):\n${extraDomainTags.join('\n')}\n`,
			);
		}
		if (domainCoverageMissing.length) {
			process.stderr.write(
				`Domain operation coverage missing entries (${domainCoverageMissing.length}):\n${domainCoverageMissing.join('\n')}\n`,
			);
		}
		if (domainCoverageExtra.length) {
			process.stderr.write(
				`Domain operation coverage extra entries (${domainCoverageExtra.length}):\n${domainCoverageExtra.join('\n')}\n`,
			);
		}
		if (duplicateDomainAssignments.length) {
			process.stderr.write(
				`Duplicate operation assignments across domains (${duplicateDomainAssignments.length}):\n${duplicateDomainAssignments.join('\n')}\n`,
			);
		}
		if (missingInDomainManifest.length) {
			process.stderr.write(
				`Official operations missing from domains manifest (${missingInDomainManifest.length}):\n${missingInDomainManifest.join('\n')}\n`,
			);
		}
		if (extraInDomainManifest.length) {
			process.stderr.write(
				`Operations in domains manifest not present in official OpenAPI (${extraInDomainManifest.length}):\n${extraInDomainManifest.join('\n')}\n`,
			);
		}
		if (missingNodeSourceFiles.length) {
			process.stderr.write(
				`Missing generated AzuraCast node files (${missingNodeSourceFiles.length}):\n${missingNodeSourceFiles.join('\n')}\n`,
			);
		}
		if (moduleFileCountMismatchMessages.length) {
			process.stderr.write(
				`Generated module file count mismatch (${moduleFileCountMismatchMessages.length}):\n${moduleFileCountMismatchMessages.join('\n')}\n`,
			);
		}
		if (missingPackageNodePaths.length) {
			process.stderr.write(
				`Missing node paths in package.json n8n.nodes (${missingPackageNodePaths.length}):\n${missingPackageNodePaths.join('\n')}\n`,
			);
		}
		if (extraPackageNodePaths.length) {
			process.stderr.write(
				`Extra node paths in package.json n8n.nodes (${extraPackageNodePaths.length}):\n${extraPackageNodePaths.join('\n')}\n`,
			);
		}
		process.exit(1);
	}

	process.stdout.write(
		`Operation coverage verified: ${officialOperationIds.length}/${officialOperationIds.length} across ${domains.length} grouped resources in one node (metadata aligned)\n`,
	);
}

await main();
