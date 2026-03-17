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
const propertiesDir = path.join(nodesDir, 'properties');
const executeDir = path.join(nodesDir, 'execute');

function sanitizeNameSegment(value) {
	return value
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

function toDisplayName(value) {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[:/]/g, ' ')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function toCamelCase(value) {
	const segments = String(value)
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((segment) => segment.toLowerCase());
	if (segments.length === 0) {
		return 'resource';
	}
	const [first, ...rest] = segments;
	const camel = `${first}${rest.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join('')}`;
	if (/^[0-9]/.test(camel)) {
		return `resource${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
	}
	return camel;
}

function asLiteral(value) {
	return JSON.stringify(value);
}

function buildNodeSource() {
	return `import {
\tNodeApiError,
\tNodeConnectionTypes,
\ttype IExecuteFunctions,
\ttype INodeExecutionData,
\ttype INodeType,
\ttype INodeTypeDescription,
} from 'n8n-workflow';
import { azuraCastCredentialTypeName } from './AzuraCast.shared';
import { resourceOperationsFunctions } from './execute';
import { azuraCastNodeProperties } from './properties';

export class AzuraCast implements INodeType {
\tdescription: INodeTypeDescription = {
\t\tdisplayName: 'AzuraCast',
\t\tname: 'azuraCast',
\t\ticon: { light: 'file:azuracast.svg', dark: 'file:azuracast.dark.svg' },
\t\tgroup: ['transform'],
\t\tversion: 1,
\t\tsubtitle: '={{$parameter["operation"]}}',
\t\tdescription: 'Interact with AzuraCast Web API',
\t\tdefaults: {
\t\t\tname: 'AzuraCast',
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
\t\tproperties: azuraCastNodeProperties,
\t};

\tasync execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
\t\tconst resource = this.getNodeParameter('resource', 0) as string;
\t\tconst operation = this.getNodeParameter('operation', 0) as string;
\t\tconst operationGroup = resourceOperationsFunctions[resource];
\t\tconst operationExecutor = operationGroup?.[operation];

\t\tif (!operationExecutor) {
\t\t\tthrow new NodeApiError(this.getNode(), {
\t\t\t\tmessage: 'Unsupported operation.',
\t\t\t\tdescription: \`Operation "\${operation}" for resource "\${resource}" is not supported.\`,
\t\t\t});
\t\t}

\t\treturn operationExecutor.call(this);
\t}
}
`;
}

function buildNodeJson() {
	return `${JSON.stringify(
		{
			node: '@renebello/n8n-nodes-azuracast.azuraCast',
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

function buildPropertiesResourcesSource(resources) {
	return `import type { INodeProperties } from 'n8n-workflow';
import { createResourceProperty } from '../AzuraCast.shared';

export const azuraCastResourceProperty: INodeProperties = createResourceProperty();
`;
}

function buildPropertiesOperationSource(resource) {
	return `import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const ${resource.identifier}OperationProperty: INodeProperties = createResourceOperationProperty(
\t${asLiteral(resource.tag)},
\t${asLiteral(resource.resourceValue)},
);
`;
}

function buildPropertiesFieldsSource(resource) {
	return `import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const ${resource.identifier}FieldProperties: INodeProperties[] = createResourceFieldProperties(
\t${asLiteral(resource.tag)},
\t${asLiteral(resource.resourceValue)},
);
`;
}

function buildPropertiesIndexSource(resources) {
	const operationImports = resources
		.map(
			(resource) =>
				`import { ${resource.identifier}OperationProperty } from './${resource.moduleName}.operations';`,
		)
		.join('\n');
	const fieldsImports = resources
		.map(
			(resource) =>
				`import { ${resource.identifier}FieldProperties } from './${resource.moduleName}.fields';`,
		)
		.join('\n');
	const operationEntries = resources
		.map((resource) => `\t${resource.identifier}OperationProperty,`)
		.join('\n');
	const fieldEntries = resources
		.map((resource) => `\t...${resource.identifier}FieldProperties,`)
		.join('\n');
	return `import type { INodeProperties } from 'n8n-workflow';
import { createSharedAdvancedProperties } from '../AzuraCast.shared';
import { azuraCastResourceProperty } from './resources';
${operationImports}
${fieldsImports}

export const azuraCastNodeProperties: INodeProperties[] = [
\tazuraCastResourceProperty,
${operationEntries}
${fieldEntries}
\t...createSharedAdvancedProperties(),
];
`;
}

function buildExecuteResourceSource(resource) {
	const operationEntries = resource.operations
		.map(
			(operation) =>
				`\t${asLiteral(operation.id)}: async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {\n\t\treturn executeOperationById.call(this, ${asLiteral(operation.id)});\n\t},`,
		)
		.join('\n');
	return `import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const ${resource.identifier}ResourceOperations: Record<string, AzuraCastOperationExecutor> = {
${operationEntries}
};
`;
}

function buildExecuteIndexSource(resources) {
	const imports = resources
		.map(
			(resource) =>
				`import { ${resource.identifier}ResourceOperations } from './${resource.moduleName}';`,
		)
		.join('\n');
	const entries = resources
		.map(
			(resource) =>
				`\t${asLiteral(resource.resourceValue)}: ${resource.identifier}ResourceOperations,`,
		)
		.join('\n');
	return `import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
${imports}

export type AzuraCastOperationExecutor = (
\tthis: IExecuteFunctions,
) => Promise<INodeExecutionData[][]>;

export const resourceOperationsFunctions: Record<
\tstring,
\tRecord<string, AzuraCastOperationExecutor>
> = {
${entries}
};
`;
}

function buildResourceMetadata(operations) {
	const grouped = new Map();
	for (const operation of operations) {
		const tag = String(operation.tag ?? 'General');
		const operationsForTag = grouped.get(tag) ?? [];
		operationsForTag.push(operation);
		grouped.set(tag, operationsForTag);
	}
	const usedModuleNames = new Set();
	const orderedTags = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
	return orderedTags.map((tag) => {
		const rawModuleName = sanitizeNameSegment(tag) || 'general';
		let moduleName = rawModuleName;
		let suffix = 2;
		while (usedModuleNames.has(moduleName)) {
			moduleName = `${rawModuleName}_${suffix}`;
			suffix += 1;
		}
		usedModuleNames.add(moduleName);
		return {
			tag,
			moduleName,
			identifier: toCamelCase(moduleName),
			resourceValue: `resource_${sanitizeNameSegment(tag)}`,
			displayName: toDisplayName(tag),
			operations: [...(grouped.get(tag) ?? [])].sort((a, b) => String(a.id).localeCompare(String(b.id))),
		};
	});
}

async function clearGeneratedNodeFiles() {
	const files = await fs.readdir(nodesDir);
	for (const fileName of files) {
		if (!/^AzuraCast.*\.node\.(ts|json)$/.test(fileName)) {
			continue;
		}
		await fs.unlink(path.join(nodesDir, fileName));
	}
	await fs.rm(propertiesDir, { recursive: true, force: true });
	await fs.rm(executeDir, { recursive: true, force: true });
}

async function writeNodeFiles(resources) {
	await fs.writeFile(path.join(nodesDir, 'AzuraCast.node.ts'), buildNodeSource(), 'utf8');
	await fs.writeFile(path.join(nodesDir, 'AzuraCast.node.json'), buildNodeJson(), 'utf8');

	await fs.mkdir(propertiesDir, { recursive: true });
	await fs.writeFile(path.join(propertiesDir, 'resources.ts'), buildPropertiesResourcesSource(resources), 'utf8');
	for (const resource of resources) {
		await fs.writeFile(
			path.join(propertiesDir, `${resource.moduleName}.operations.ts`),
			buildPropertiesOperationSource(resource),
			'utf8',
		);
		await fs.writeFile(
			path.join(propertiesDir, `${resource.moduleName}.fields.ts`),
			buildPropertiesFieldsSource(resource),
			'utf8',
		);
	}
	await fs.writeFile(path.join(propertiesDir, 'index.ts'), buildPropertiesIndexSource(resources), 'utf8');

	await fs.mkdir(executeDir, { recursive: true });
	for (const resource of resources) {
		await fs.writeFile(
			path.join(executeDir, `${resource.moduleName}.ts`),
			buildExecuteResourceSource(resource),
			'utf8',
		);
	}
	await fs.writeFile(path.join(executeDir, 'index.ts'), buildExecuteIndexSource(resources), 'utf8');
}

async function writeIndexes() {
	await fs.writeFile(nodesIndexPath, `export * from './AzuraCast.node';\n`, 'utf8');
	await fs.writeFile(
		rootIndexPath,
		`export * from './credentials/AzuraCastApi.credentials';\nexport * from './nodes/AzuraCast';\n`,
		'utf8',
	);
}

async function updatePackageJson() {
	const raw = await fs.readFile(packageJsonPath, 'utf8');
	const packageJson = JSON.parse(raw);
	packageJson.n8n = packageJson.n8n ?? {};
	packageJson.n8n.nodes = ['dist/nodes/AzuraCast/AzuraCast.node.js'];
	await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, '\t')}\n`, 'utf8');
}

async function writeDomainsManifest(operations) {
	const grouped = new Map();
	for (const operation of operations) {
		const tag = String(operation.tag ?? 'General');
		const operationsForTag = grouped.get(tag) ?? [];
		operationsForTag.push(String(operation.id ?? '').trim());
		grouped.set(tag, operationsForTag);
	}
	const tags = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
	const domains = tags.map((tag) => {
		const operationIds = [...new Set((grouped.get(tag) ?? []).filter(Boolean))].sort((a, b) =>
			a.localeCompare(b),
		);
		return {
			tag,
			resourceValue: `resource_${sanitizeNameSegment(tag)}`,
			displayName: toDisplayName(tag),
			operationCount: operationIds.length,
			operationIds,
		};
	});
	const manifest = {
		generatedAt: new Date().toISOString(),
		domainCount: domains.length,
		operationCount: operations.length,
		domains,
	};
	await fs.writeFile(domainsPath, `${JSON.stringify(manifest, null, '\t')}\n`, 'utf8');
}

async function main() {
	const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
	const operations = Array.isArray(snapshot.operations) ? snapshot.operations : [];
	const resources = buildResourceMetadata(operations);

	await clearGeneratedNodeFiles();
	await writeNodeFiles(resources);
	await writeIndexes();
	await updatePackageJson();
	await writeDomainsManifest(operations);

	process.stdout.write(
		`Generated single AzuraCast node with modular properties/execute files for ${operations.length} operations across ${resources.length} resources.\n`,
	);
}

await main();
