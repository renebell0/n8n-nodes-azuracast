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
const jsonContentTypePriority = [
	'application/json',
	'application/merge-patch+json',
	'application/problem+json',
];

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

function decodeRefToken(token) {
	return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function refValue(document, ref) {
	if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) {
		return undefined;
	}
	return ref
		.slice(2)
		.split('/')
		.map((token) => decodeRefToken(token))
		.reduce((acc, key) => acc?.[key], document);
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

function resolveSchema(schema, document, seenRefs = new Set()) {
	if (!schema || typeof schema !== 'object') {
		return undefined;
	}

	if (schema.$ref) {
		const ref = String(schema.$ref);
		if (seenRefs.has(ref)) {
			return undefined;
		}
		seenRefs.add(ref);
		const referenced = refValue(document, ref);
		if (!referenced) {
			return undefined;
		}
		return resolveSchema(referenced, document, seenRefs);
	}

	if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
		const merged = {};
		const mergedProperties = {};
		const mergedRequired = new Set();
		for (const part of schema.allOf) {
			const resolvedPart = resolveSchema(part, document, seenRefs) ?? {};
			if (resolvedPart.properties && typeof resolvedPart.properties === 'object') {
				Object.assign(mergedProperties, resolvedPart.properties);
			}
			if (Array.isArray(resolvedPart.required)) {
				for (const requiredName of resolvedPart.required) {
					mergedRequired.add(String(requiredName));
				}
			}
			for (const key of ['type', 'format', 'description', 'default', 'nullable', 'additionalProperties']) {
				if (merged[key] === undefined && resolvedPart[key] !== undefined) {
					merged[key] = resolvedPart[key];
				}
			}
			if (resolvedPart.enum && merged.enum === undefined) {
				merged.enum = resolvedPart.enum;
			}
			if (resolvedPart.items && merged.items === undefined) {
				merged.items = resolvedPart.items;
			}
		}
		if (Object.keys(mergedProperties).length > 0) {
			merged.properties = mergedProperties;
			if (!merged.type) {
				merged.type = 'object';
			}
		}
		if (mergedRequired.size > 0) {
			merged.required = [...mergedRequired];
		}
		return resolveSchema(merged, document, seenRefs);
	}

	const variants = Array.isArray(schema.oneOf)
		? schema.oneOf
		: Array.isArray(schema.anyOf)
			? schema.anyOf
			: [];
	if (variants.length > 0) {
		const preferredVariant =
			variants.find((variant) => {
				const resolved = resolveSchema(variant, document, seenRefs);
				return Boolean(resolved?.properties);
			}) ?? variants[0];
		return resolveSchema(preferredVariant, document, seenRefs);
	}

	const normalized = { ...schema };
	if (normalized.items) {
		normalized.items = resolveSchema(normalized.items, document, seenRefs) ?? normalized.items;
	}
	if (normalized.properties && typeof normalized.properties === 'object') {
		const resolvedProperties = {};
		for (const [propertyName, propertySchema] of Object.entries(normalized.properties)) {
			resolvedProperties[propertyName] =
				resolveSchema(propertySchema, document, seenRefs) ?? propertySchema;
		}
		normalized.properties = resolvedProperties;
	}
	return normalized;
}

function inferEnumValueType(enumValues) {
	if (!Array.isArray(enumValues) || enumValues.length === 0) {
		return '';
	}
	const firstValue = enumValues[0];
	if (typeof firstValue === 'number') {
		return 'number';
	}
	if (typeof firstValue === 'boolean') {
		return 'boolean';
	}
	return 'string';
}

function buildFieldType(schema, enumValues) {
	if (enumValues.length > 0) {
		return 'options';
	}
	if (schema?.type === 'integer' || schema?.type === 'number') {
		return 'number';
	}
	if (schema?.type === 'boolean') {
		return 'boolean';
	}
	if (
		schema?.type === 'object' ||
		schema?.type === 'array' ||
		schema?.properties ||
		schema?.items ||
		schema?.additionalProperties
	) {
		return 'json';
	}
	return 'string';
}

function buildFieldDefinition({ name, schema, required, description }) {
	const normalizedName = String(name ?? '').trim();
	if (!normalizedName) {
		return undefined;
	}

	const normalizedSchema = resolveSchema(schema, currentDocumentRef) ?? {};
	const enumValues = Array.isArray(normalizedSchema.enum)
		? normalizedSchema.enum.filter(
				(value) =>
					typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
			)
		: [];

	const fieldType = buildFieldType(normalizedSchema, enumValues);
	const normalizedFormat = normalizeText(String(normalizedSchema.format ?? ''));
	const format =
		fieldType === 'json' && !normalizedFormat
			? normalizedSchema.type === 'array'
				? 'array'
				: 'object'
			: normalizedFormat;

	return {
		name: normalizedName,
		type: fieldType,
		format,
		description:
			normalizeText(description) || normalizeText(String(normalizedSchema.description ?? '')),
		required: Boolean(required),
		enumValues,
		enumValueType: inferEnumValueType(enumValues),
	};
}

function buildOperationName(operation) {
	const summary = normalizeText(operation.summary) || normalizeText(operation.description);
	if (summary) {
		return summary.replace(/[.]+$/, '');
	}
	return operation.id;
}

function buildOperationDescription(operation) {
	const descriptionParts = [];
	if (operation.tag) {
		descriptionParts.push(operation.tag);
	}
	descriptionParts.push(`${operation.method} ${operation.path}`);
	if (operation.isPublic) {
		descriptionParts.push('Public');
	}
	return descriptionParts.join(' | ');
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

function sortFieldDefinitions(fieldDefinitions) {
	return [...fieldDefinitions].sort((a, b) => {
		if (a.required && !b.required) {
			return -1;
		}
		if (!a.required && b.required) {
			return 1;
		}
		return a.name.localeCompare(b.name);
	});
}

function selectPreferredBodyContentType(contentTypes) {
	for (const preferred of jsonContentTypePriority) {
		const exactMatch = contentTypes.find((contentType) => contentType === preferred);
		if (exactMatch) {
			return exactMatch;
		}
	}
	const genericJson = contentTypes.find((contentType) => contentType.includes('json'));
	if (genericJson) {
		return genericJson;
	}
	return contentTypes[0] ?? '';
}

function extractRequestBodyFieldDefinitions(requestBodySchema) {
	if (!requestBodySchema || typeof requestBodySchema !== 'object') {
		return [];
	}

	const properties = requestBodySchema.properties;
	if (!properties || typeof properties !== 'object') {
		return [];
	}

	const requiredSet = new Set(
		Array.isArray(requestBodySchema.required)
			? requestBodySchema.required.map((fieldName) => String(fieldName))
			: [],
	);

	const fieldDefinitions = [];
	for (const [propertyName, propertySchema] of Object.entries(properties)) {
		const readOnly =
			Boolean(propertySchema?.readOnly) ||
			Boolean(propertySchema?.['x-readOnly']) ||
			Boolean(propertySchema?.['x-readonly']);
		if (readOnly) {
			continue;
		}
		const definition = buildFieldDefinition({
			name: propertyName,
			schema: propertySchema,
			required: requiredSet.has(propertyName),
			description: propertySchema?.description,
		});
		if (definition) {
			fieldDefinitions.push(definition);
		}
	}

	return sortFieldDefinitions(fieldDefinitions);
}

let currentDocumentRef = undefined;

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
	currentDocumentRef = document;

	for (const [routePath, pathItem] of Object.entries(paths)) {
		for (const method of methodOrder) {
			const operation = pathItem?.[method];
			if (!operation || typeof operation !== 'object') {
				continue;
			}

			const operationId =
				normalizeText(operation.operationId) || generateFallbackOperationId(method, routePath);
			const parameters = combineParameters(pathItem, operation, document);

			const pathParameterDefinitions = sortFieldDefinitions(
				parameters
					.filter((parameter) => parameter.in === 'path')
					.map((parameter) =>
						buildFieldDefinition({
							name: parameter.name,
							schema: parameter.schema,
							required: true,
							description: parameter.description,
						}),
					)
					.filter(Boolean),
			);

			const queryParameterDefinitions = sortFieldDefinitions(
				parameters
					.filter((parameter) => parameter.in === 'query')
					.map((parameter) =>
						buildFieldDefinition({
							name: parameter.name,
							schema: parameter.schema,
							required: Boolean(parameter.required),
							description: parameter.description,
						}),
					)
					.filter(Boolean),
			);

			const requestBody = resolveRequestBody(operation.requestBody, document);
			const requestBodyContent = requestBody?.content ?? {};
			const requestBodyContentTypes = Object.keys(requestBodyContent).sort((a, b) =>
				a.localeCompare(b),
			);
			const preferredBodyContentType = selectPreferredBodyContentType(requestBodyContentTypes);
			const preferredBodySchema = preferredBodyContentType
				? resolveSchema(requestBodyContent[preferredBodyContentType]?.schema, document)
				: undefined;
			const requestBodyFieldDefinitions = extractRequestBodyFieldDefinitions(preferredBodySchema);

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
				pathParameters: pathParameterDefinitions.map((definition) => definition.name),
				queryParameters: queryParameterDefinitions.map((definition) => definition.name),
				pathParameterDefinitions,
				queryParameterDefinitions,
				requestBodyRequired: Boolean(requestBody?.required),
				requestBodyContentTypes,
				requestBodyPreferredContentType: preferredBodyContentType,
				requestBodyFieldDefinitions,
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
