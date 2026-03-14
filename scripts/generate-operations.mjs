import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const openApiUrl =
	process.env.AZURACAST_OPENAPI_URL ??
	'https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/web/static/openapi.yml';

const outputPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.openapi.snapshot.json');

const methodOrder = ['get', 'post', 'put', 'patch', 'delete', 'head'];

const responseTypeHints = {
	json: ['application/json'],
	text: [
		'text/plain',
		'text/csv',
		'text/x-yaml',
		'application/yaml',
		'application/x-yaml',
	],
	binary: ['application/octet-stream', 'audio/', 'image/', 'video/', 'application/zip'],
};

function refValue(document, ref) {
	if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) {
		return undefined;
	}
	return ref
		.slice(2)
		.split('/')
		.reduce((acc, key) => acc?.[key], document);
}

function resolveParameter(parameter, document) {
	if (!parameter) {
		return undefined;
	}
	if (parameter.$ref) {
		return refValue(document, parameter.$ref);
	}
	return parameter;
}

function resolveRequestBody(requestBody, document) {
	if (!requestBody) {
		return undefined;
	}
	if (requestBody.$ref) {
		return refValue(document, requestBody.$ref);
	}
	return requestBody;
}

function normalizeText(value) {
	if (!value || typeof value !== 'string') {
		return '';
	}
	return value.replace(/\s+/g, ' ').trim();
}

function dedupe(values) {
	return [...new Set(values.filter((value) => value !== undefined && value !== null))];
}

function inferResponseMode(contentTypes) {
	if (!contentTypes.length) {
		return 'text';
	}
	if (contentTypes.some((contentType) => responseTypeHints.json.some((hint) => contentType.includes(hint)))) {
		return 'json';
	}
	if (contentTypes.some((contentType) => responseTypeHints.text.some((hint) => contentType.includes(hint)))) {
		return 'text';
	}
	if (contentTypes.some((contentType) => responseTypeHints.binary.some((hint) => contentType.includes(hint)))) {
		return 'binary';
	}
	return 'text';
}

function inferBodyMode(requestBodyContentTypes) {
	if (!requestBodyContentTypes.length) {
		return 'none';
	}
	if (requestBodyContentTypes.some((contentType) => contentType.includes('multipart/form-data'))) {
		return 'multipart';
	}
	if (
		requestBodyContentTypes.some((contentType) =>
			['application/json', 'application/merge-patch+json', 'application/problem+json'].some((hint) =>
				contentType.includes(hint),
			),
		)
	) {
		return 'json';
	}
	if (
		requestBodyContentTypes.some((contentType) =>
			['application/x-www-form-urlencoded', 'text/plain', 'text/csv'].some((hint) =>
				contentType.includes(hint),
			),
		)
	) {
		return 'raw';
	}
	return 'raw';
}

function buildOperationName(operation) {
	const title = normalizeText(operation.summary) || operation.id;
	return `${operation.id} | ${operation.method} ${operation.path}`;
}

function buildOperationDescription(operation) {
	const descriptionParts = [];
	if (operation.tag) {
		descriptionParts.push(operation.tag);
	}
	if (operation.summary) {
		descriptionParts.push(operation.summary);
	}
	if (operation.isPublic) {
		descriptionParts.push('Public');
	}
	return descriptionParts.join(' | ');
}

function combineParameters(pathItem, operation, document) {
	const pathLevel = Array.isArray(pathItem?.parameters) ? pathItem.parameters : [];
	const operationLevel = Array.isArray(operation?.parameters) ? operation.parameters : [];
	return [...pathLevel, ...operationLevel]
		.map((parameter) => resolveParameter(parameter, document))
		.filter(Boolean);
}

function resolveResponseContentTypes(operation, document) {
	const responses = operation?.responses ?? {};
	const successResponseCodes = ['200', '201', '202', '203', '204', '206', '302'];
	for (const statusCode of successResponseCodes) {
		const response = responses[statusCode] ?? responses.default;
		if (!response) {
			continue;
		}
		const resolvedResponse = response.$ref ? refValue(document, response.$ref) : response;
		const content = resolvedResponse?.content ?? {};
		const contentTypes = Object.keys(content);
		if (contentTypes.length > 0) {
			return contentTypes;
		}
	}
	return [];
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

async function loadOpenApiDocument(url) {
	const response = await fetch(url, {
		headers: {
			Accept: 'application/yaml,text/yaml,text/plain,*/*',
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch OpenAPI document (${response.status} ${response.statusText})`);
	}
	const yamlText = await response.text();
	return YAML.parse(yamlText);
}

function extractOperations(document) {
	const operations = [];
	const paths = document?.paths ?? {};

	for (const [routePath, pathItem] of Object.entries(paths)) {
		for (const method of methodOrder) {
			const operation = pathItem?.[method];
			if (!operation || typeof operation !== 'object') {
				continue;
			}

			const operationId =
				normalizeText(operation.operationId) || generateFallbackOperationId(method, routePath);
			const parameters = combineParameters(pathItem, operation, document);

			const pathParameters = dedupe(
				parameters.filter((parameter) => parameter.in === 'path').map((parameter) => parameter.name),
			).sort((a, b) => a.localeCompare(b));

			const queryParameters = dedupe(
				parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name),
			).sort((a, b) => a.localeCompare(b));

			const requestBody = resolveRequestBody(operation.requestBody, document);
			const requestBodyContent = requestBody?.content ?? {};
			const requestBodyContentTypes = Object.keys(requestBodyContent).sort((a, b) =>
				a.localeCompare(b),
			);

			const responseContentTypes = resolveResponseContentTypes(operation, document).sort((a, b) =>
				a.localeCompare(b),
			);

			const entry = {
				id: operationId,
				method: method.toUpperCase(),
				path: routePath,
				tag: normalizeText(Array.isArray(operation.tags) ? operation.tags[0] : '') || 'General',
				summary: normalizeText(operation.summary) || normalizeText(operation.description),
				description: normalizeText(operation.description),
				pathParameters,
				queryParameters,
				requestBodyRequired: Boolean(requestBody?.required),
				requestBodyContentTypes,
				recommendedBodyMode: inferBodyMode(requestBodyContentTypes),
				responseContentTypes,
				recommendedResponseFormat: inferResponseMode(responseContentTypes),
				isPublic: Array.isArray(operation.security) && operation.security.length === 0,
			};

			operations.push(entry);
		}
	}

	return operations.sort((a, b) => a.id.localeCompare(b.id));
}

function createSnapshot(operations, sourceUrl) {
	const operationOptions = operations
		.map((operation) => ({
			name: buildOperationName(operation),
			value: operation.id,
			description: buildOperationDescription(operation),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	const operationMap = Object.fromEntries(operations.map((operation) => [operation.id, operation]));

	return {
		source: {
			openApiUrl: sourceUrl,
			generatedAt: new Date().toISOString(),
			operationCount: operations.length,
		},
		operations,
		operationMap,
		operationOptions,
	};
}

async function main() {
	const openApiDocument = await loadOpenApiDocument(openApiUrl);
	const operations = extractOperations(openApiDocument);
	const snapshot = createSnapshot(operations, openApiUrl);
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, '\t')}\n`, 'utf8');
	process.stdout.write(`Generated ${operations.length} operations to ${outputPath}\n`);
}

await main();
