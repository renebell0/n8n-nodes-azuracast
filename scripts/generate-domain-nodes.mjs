import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const snapshotPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.openapi.snapshot.json');
const domainsPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.domains.json');
const nodesDir = path.join(projectRoot, 'nodes', 'AzuraCast');
const packageJsonPath = path.join(projectRoot, 'package.json');
const rootIndexPath = path.join(projectRoot, 'index.ts');
const nodesIndexPath = path.join(nodesDir, 'index.ts');

function toWords(value) {
	return value
		.replace(/&/g, ' and ')
		.replace(/[:/]/g, ' ')
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
}

function toPascalCase(words) {
	return words
		.map((word) => {
			const cleaned = word.replace(/[^a-zA-Z0-9]/g, '');
			if (!cleaned) {
				return '';
			}
			return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
		})
		.join('');
}

function uniqueBy(values, keyFn) {
	const map = new Map();
	for (const value of values) {
		map.set(keyFn(value), value);
	}
	return [...map.values()];
}

function buildNodeSource(domain) {
	return `import { NodeConnectionTypes, type IExecuteFunctions, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { azuraCastCredentialTypeName, createDomainOperationConfig, executeDomainNode } from './AzuraCast.shared';

const operationConfig = createDomainOperationConfig(${JSON.stringify(domain.tag)});

export class ${domain.className} implements INodeType {
\tdescription: INodeTypeDescription = {
\t\tdisplayName: ${JSON.stringify(domain.displayName)},
\t\tname: ${JSON.stringify(domain.nodeName)},
\t\ticon: 'file:azuracast.svg',
\t\tgroup: ['transform'],
\t\tversion: 1,
\t\tsubtitle: '={{$parameter["operationId"]}}',
\t\tdescription: ${JSON.stringify(domain.description)},
\t\tdefaults: {
\t\t\tname: ${JSON.stringify(domain.displayName)},
\t\t},
\t\tusableAsTool: true,
\t\tinputs: [NodeConnectionTypes.Main],
\t\toutputs: [NodeConnectionTypes.Main],
\t\tcredentials: [
\t\t\t{
\t\t\t\tname: azuraCastCredentialTypeName,
\t\t\t\trequired: true,
\t\t\t},
\t\t],
\t\tproperties: operationConfig.properties,
\t};

\tasync execute(this: IExecuteFunctions) {
\t\treturn executeDomainNode.call(this, operationConfig.operationMap);
\t}
}
`;
}

function buildNodeJson(domain) {
	return `${JSON.stringify(
		{
			node: `@renebello/n8n-nodes-azuracast.${domain.nodeName}`,
			nodeVersion: '1.0',
			codexVersion: '1.0',
			categories: ['Development', 'Productivity'],
			resources: {
				credentialDocumentation: [
					{
						url: 'https://github.com/renebell0/n8n-nodes-azuracast?tab=readme-ov-file#credentials',
					},
				],
				primaryDocumentation: [
					{
						url: 'https://github.com/renebell0/n8n-nodes-azuracast?tab=readme-ov-file',
					},
				],
			},
		},
		null,
		'\t',
	)}\n`;
}

async function writeDomainNodeFiles(domains) {
	for (const domain of domains) {
		const nodeTsPath = path.join(nodesDir, `${domain.className}.node.ts`);
		const nodeJsonPath = path.join(nodesDir, `${domain.className}.node.json`);
		await fs.writeFile(nodeTsPath, buildNodeSource(domain), 'utf8');
		await fs.writeFile(nodeJsonPath, buildNodeJson(domain), 'utf8');
	}
}

async function clearGeneratedDomainNodeFiles() {
	const files = await fs.readdir(nodesDir);
	for (const fileName of files) {
		if (!/^AzuraCast.*\.node\.(ts|json)$/.test(fileName)) {
			continue;
		}
		const filePath = path.join(nodesDir, fileName);
		await fs.unlink(filePath);
	}
}

async function writeIndexes(domains) {
	const exportLines = domains
		.map((domain) => `export * from './${domain.className}.node';`)
		.join('\n');
	await fs.writeFile(nodesIndexPath, `${exportLines}\n`, 'utf8');
	await fs.writeFile(
		rootIndexPath,
		`export * from './credentials/AzuraCastApi.credentials';\nexport * from './nodes/AzuraCast';\n`,
		'utf8',
	);
}

async function updatePackageJson(domains) {
	const raw = await fs.readFile(packageJsonPath, 'utf8');
	const packageJson = JSON.parse(raw);
	const nodePaths = domains.map((domain) => `dist/nodes/AzuraCast/${domain.className}.node.js`);
	packageJson.n8n = packageJson.n8n ?? {};
	packageJson.n8n.nodes = nodePaths;
	await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, '\t')}\n`, 'utf8');
}

async function writeDomainsManifest(domains, operationCount) {
	const manifest = {
		generatedAt: new Date().toISOString(),
		domainCount: domains.length,
		operationCount,
		domains: domains.map((domain) => ({
			tag: domain.tag,
			className: domain.className,
			nodeName: domain.nodeName,
			displayName: domain.displayName,
			operationCount: domain.operationIds.length,
			operationIds: domain.operationIds,
		})),
	};
	await fs.writeFile(domainsPath, `${JSON.stringify(manifest, null, '\t')}\n`, 'utf8');
}

async function deleteLegacyUniversalNode() {
	const legacyPaths = [
		path.join(nodesDir, 'AzuraCast.node.ts'),
		path.join(nodesDir, 'AzuraCast.node.json'),
	];
	for (const legacyPath of legacyPaths) {
		try {
			await fs.unlink(legacyPath);
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error;
			}
		}
	}
}

async function main() {
	const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
	const operations = Array.isArray(snapshot.operations) ? snapshot.operations : [];
	const grouped = operations.reduce((acc, operation) => {
		const tag = String(operation.tag ?? 'General');
		acc[tag] = acc[tag] ?? [];
		acc[tag].push(operation);
		return acc;
	}, {});

	const tags = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
	const domains = tags.map((tag) => {
		const words = toWords(tag);
		const classSuffix = toPascalCase(words);
		const displayTag = words.join(' ');
		const domainOperations = uniqueBy(
			grouped[tag]
				.map((operation) => String(operation.id ?? '').trim())
				.filter((operationId) => operationId.length > 0)
				.sort((a, b) => a.localeCompare(b)),
			(value) => value,
		);
		return {
			tag,
			className: `AzuraCast${classSuffix}`,
			nodeName: `azuraCast${classSuffix}`,
			displayName: `AzuraCast ${displayTag}`,
			description: `Execute AzuraCast Web API operations for ${tag}`,
			operationIds: domainOperations,
		};
	});

	await deleteLegacyUniversalNode();
	await clearGeneratedDomainNodeFiles();
	await writeDomainNodeFiles(domains);
	await writeIndexes(domains);
	await updatePackageJson(domains);
	await writeDomainsManifest(domains, operations.length);

	process.stdout.write(
		`Generated ${domains.length} domain nodes with ${operations.length} operations coverage.\n`,
	);
}

await main();
