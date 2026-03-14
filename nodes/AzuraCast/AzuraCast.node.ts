import {
	NodeConnectionTypes,
	NodeOperationError,
	type IBinaryData,
	type IBinaryKeyData,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeProperties,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import azuraCastOpenApiSnapshot from './azuracast.openapi.snapshot.json';

type BodyMode = 'binary' | 'json' | 'multipart' | 'none' | 'raw';
type ResponseFormat = 'auto' | 'binary' | 'json' | 'text';
type ResolvedResponseFormat = 'binary' | 'json' | 'text';

type AzuraCastSnapshotOperation = {
	id: string;
	method: string;
	path: string;
	tag: string;
	summary: string;
	description: string;
	pathParameters: string[];
	queryParameters: string[];
	requestBodyRequired: boolean;
	requestBodyContentTypes: string[];
	recommendedBodyMode: BodyMode;
	responseContentTypes: string[];
	recommendedResponseFormat: ResolvedResponseFormat;
	isPublic: boolean;
};

type AzuraCastSnapshotData = {
	source: {
		openApiUrl: string;
		generatedAt: string;
		operationCount: number;
	};
	operations: AzuraCastSnapshotOperation[];
	operationMap: Record<string, AzuraCastSnapshotOperation>;
	operationOptions: Array<{
		name: string;
		value: string;
		description: string;
	}>;
};

type FullHttpResponse = {
	body: unknown;
	headers: IDataObject;
	statusCode: number;
	statusMessage?: string;
};

const snapshot = azuraCastOpenApiSnapshot as AzuraCastSnapshotData;
const operationMap = snapshot.operationMap;
const operationOptions = snapshot.operationOptions as INodePropertyOptions[];

function isObject(value: unknown): value is IDataObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFullHttpResponse(value: unknown): value is FullHttpResponse {
	return isObject(value) && Object.prototype.hasOwnProperty.call(value, 'body');
}

function normalizeApiBaseUrl(baseUrl: string): string {
	const normalized = baseUrl.trim().replace(/\/+$/, '');
	if (!normalized) {
		return '';
	}
	if (normalized.endsWith('/api')) {
		return normalized;
	}
	return `${normalized}/api`;
}

function toJsonObject(value: unknown): IDataObject {
	if (isObject(value)) {
		return value;
	}
	return { data: value as string | number | boolean | null };
}

function parseJsonValue(
	node: ReturnType<IExecuteFunctions['getNode']>,
	rawValue: unknown,
	parameterName: string,
	itemIndex: number,
): unknown {
	if (typeof rawValue !== 'string') {
		return rawValue;
	}
	const trimmed = rawValue.trim();
	if (!trimmed) {
		return undefined;
	}
	try {
		return JSON.parse(trimmed);
	} catch (error) {
		throw new NodeOperationError(node, `Invalid JSON in "${parameterName}".`, {
			itemIndex,
			description: (error as Error).message,
		});
	}
}

function parseJsonObject(
	node: ReturnType<IExecuteFunctions['getNode']>,
	rawValue: unknown,
	parameterName: string,
	itemIndex: number,
): IDataObject {
	const parsedValue = parseJsonValue(node, rawValue, parameterName, itemIndex);
	if (parsedValue === undefined || parsedValue === null) {
		return {};
	}
	if (!isObject(parsedValue)) {
		throw new NodeOperationError(node, `"${parameterName}" must be a JSON object.`, {
			itemIndex,
		});
	}
	return parsedValue;
}

function applyPathParameters(
	node: ReturnType<IExecuteFunctions['getNode']>,
	pathTemplate: string,
	pathParameters: IDataObject,
	itemIndex: number,
): string {
	const missingParameters: string[] = [];
	const resolvedPath = pathTemplate.replace(/\{([^}]+)\}/g, (_, token: string) => {
		const value = pathParameters[token];
		if (value === undefined || value === null || value === '') {
			missingParameters.push(token);
			return `{${token}}`;
		}
		return encodeURIComponent(String(value));
	});
	if (missingParameters.length > 0) {
		throw new NodeOperationError(node, 'Missing required path parameter values.', {
			itemIndex,
			description: `Required: ${missingParameters.join(', ')}`,
		});
	}
	return resolvedPath;
}

function determineResponseFormat(
	selectedResponseFormat: ResponseFormat,
	operation: AzuraCastSnapshotOperation,
): ResolvedResponseFormat {
	if (selectedResponseFormat === 'auto') {
		if (operation.responseContentTypes.length === 0) {
			return 'text';
		}
		return operation.recommendedResponseFormat;
	}
	return selectedResponseFormat;
}

function getBaseUrlForItem(
	node: ReturnType<IExecuteFunctions['getNode']>,
	credentialBaseUrl: string,
	itemIndex: number,
): string {
	const normalized = normalizeApiBaseUrl(credentialBaseUrl);
	if (!normalized) {
		throw new NodeOperationError(node, 'AzuraCast API credentials are required.', { itemIndex });
	}
	return normalized;
}

async function buildBody(
	this: IExecuteFunctions,
	itemIndex: number,
	bodyMode: BodyMode,
	jsonBody: unknown,
	rawBody: string,
	binaryBodyProperty: string,
	multipartFileFieldName: string,
	multipartFields: IDataObject,
): Promise<unknown> {
	if (bodyMode === 'none') {
		return undefined;
	}

	if (bodyMode === 'json') {
		return parseJsonValue(this.getNode(), jsonBody, 'jsonBody', itemIndex);
	}

	if (bodyMode === 'raw') {
		return rawBody;
	}

	if (bodyMode === 'binary') {
		return await this.helpers.getBinaryDataBuffer(itemIndex, binaryBodyProperty);
	}

	const formData = new FormData();
	for (const [key, value] of Object.entries(multipartFields)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (typeof value === 'string') {
			formData.append(key, value);
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			formData.append(key, String(value));
		} else {
			formData.append(key, JSON.stringify(value));
		}
	}

	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryBodyProperty);
	const binaryBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryBodyProperty);
	const blob = new Blob([binaryBuffer], {
		type: binaryData.mimeType ?? 'application/octet-stream',
	});
	formData.append(multipartFileFieldName, blob, binaryData.fileName ?? `${binaryBodyProperty}.bin`);
	return formData;
}

const properties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operationId',
		type: 'options',
		noDataExpression: true,
		options: operationOptions,
		default: 'getStatus',
	},
	{
		displayName: 'Path Parameters (JSON)',
		name: 'pathParameters',
		type: 'json',
		default: '{}',
		description: 'Provide values for path placeholders, for example {"station_id":"demo","queue_item_id":1}',
	},
	{
		displayName: 'Send Query Parameters',
		name: 'sendQueryParameters',
		type: 'boolean',
		default: false,
	},
	{
		displayName: 'Query Parameters (JSON)',
		name: 'queryParameters',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				sendQueryParameters: [true],
			},
		},
	},
	{
		displayName: 'Body Mode',
		name: 'bodyMode',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Binary', value: 'binary' },
			{ name: 'JSON', value: 'json' },
			{ name: 'Multipart Form-Data', value: 'multipart' },
			{ name: 'None', value: 'none' },
			{ name: 'Raw', value: 'raw' },
		],
		default: 'none',
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				bodyMode: ['json'],
			},
		},
	},
	{
		displayName: 'Raw Body',
		name: 'rawBody',
		type: 'string',
		default: '',
		typeOptions: {
			rows: 6,
		},
		displayOptions: {
			show: {
				bodyMode: ['raw'],
			},
		},
	},
	{
		displayName: 'Binary Body Property',
		name: 'binaryBodyProperty',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				bodyMode: ['binary', 'multipart'],
			},
		},
	},
	{
		displayName: 'Multipart File Field Name',
		name: 'multipartFileFieldName',
		type: 'string',
		default: 'file',
		displayOptions: {
			show: {
				bodyMode: ['multipart'],
			},
		},
	},
	{
		displayName: 'Multipart Fields (JSON)',
		name: 'multipartFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				bodyMode: ['multipart'],
			},
		},
	},
	{
		displayName: 'Send Additional Headers',
		name: 'sendAdditionalHeaders',
		type: 'boolean',
		default: false,
	},
	{
		displayName: 'Additional Headers (JSON)',
		name: 'additionalHeaders',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				sendAdditionalHeaders: [true],
			},
		},
	},
	{
		displayName: 'Response Format',
		name: 'responseFormat',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Auto', value: 'auto' },
			{ name: 'Binary', value: 'binary' },
			{ name: 'JSON', value: 'json' },
			{ name: 'Text', value: 'text' },
		],
		default: 'auto',
	},
	{
		displayName: 'Binary Output Property',
		name: 'binaryOutputProperty',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				responseFormat: ['binary'],
			},
		},
	},
	{
		displayName: 'Return Full Response',
		name: 'returnFullResponse',
		type: 'boolean',
		default: false,
	},
];

export class AzuraCast implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AzuraCast',
		name: 'azuraCast',
		icon: 'file:azuracast.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operationId"]}}',
		description: 'Execute any AzuraCast Web API operation from the official OpenAPI specification',
		defaults: {
			name: 'AzuraCast',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'renebelloAzuraCastApi',
				required: true,
			},
		],
		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operationId = this.getNodeParameter('operationId', i) as string;
				const operation = operationMap[operationId];
				if (!operation) {
					throw new NodeOperationError(this.getNode(), `Unsupported operation "${operationId}".`, {
						itemIndex: i,
					});
				}

				const credentialData = await this.getCredentials('renebelloAzuraCastApi');
				const credentialBaseUrl = String(credentialData?.baseUrl ?? '');
				const apiBaseUrl = getBaseUrlForItem(this.getNode(), credentialBaseUrl, i);

				const pathParameters = parseJsonObject(
					this.getNode(),
					this.getNodeParameter('pathParameters', i, '{}'),
					'pathParameters',
					i,
				);
				const endpoint = applyPathParameters(this.getNode(), operation.path, pathParameters, i);

				const sendQueryParameters = this.getNodeParameter('sendQueryParameters', i) as boolean;
				const queryParameters = sendQueryParameters
					? parseJsonObject(
							this.getNode(),
							this.getNodeParameter('queryParameters', i, '{}'),
							'queryParameters',
							i,
						)
					: undefined;

				const sendAdditionalHeaders = this.getNodeParameter('sendAdditionalHeaders', i) as boolean;
				const additionalHeaders = sendAdditionalHeaders
					? parseJsonObject(
							this.getNode(),
							this.getNodeParameter('additionalHeaders', i, '{}'),
							'additionalHeaders',
							i,
						)
					: undefined;

				const bodyMode = this.getNodeParameter('bodyMode', i) as BodyMode;
				const jsonBody = this.getNodeParameter('jsonBody', i, '{}');
				const rawBody = this.getNodeParameter('rawBody', i, '') as string;
				const binaryBodyProperty = this.getNodeParameter('binaryBodyProperty', i, 'data') as string;
				const multipartFileFieldName = this.getNodeParameter(
					'multipartFileFieldName',
					i,
					'file',
				) as string;
				const multipartFields =
					bodyMode === 'multipart'
						? parseJsonObject(
								this.getNode(),
								this.getNodeParameter('multipartFields', i, '{}'),
								'multipartFields',
								i,
							)
						: {};

				const requestBody = await buildBody.call(
					this,
					i,
					bodyMode,
					jsonBody,
					rawBody,
					binaryBodyProperty,
					multipartFileFieldName,
					multipartFields,
				);

				const selectedResponseFormat = this.getNodeParameter('responseFormat', i) as ResponseFormat;
				const responseFormat = determineResponseFormat(selectedResponseFormat, operation);
				const returnFullResponse = this.getNodeParameter('returnFullResponse', i) as boolean;
				const binaryOutputProperty = this.getNodeParameter('binaryOutputProperty', i, 'data') as string;

				const requestOptions: IHttpRequestOptions = {
					method: operation.method as IHttpRequestMethods,
					url: `${apiBaseUrl}${endpoint}`,
					json: responseFormat === 'json',
					returnFullResponse,
				};

				if (queryParameters && Object.keys(queryParameters).length > 0) {
					requestOptions.qs = queryParameters;
				}

				if (additionalHeaders && Object.keys(additionalHeaders).length > 0) {
					requestOptions.headers = additionalHeaders;
				}

				if (requestBody !== undefined) {
					requestOptions.body = requestBody as IDataObject;
				}

				if (responseFormat === 'binary') {
					requestOptions.encoding = 'arraybuffer';
					requestOptions.json = false;
				} else if (responseFormat === 'text') {
					requestOptions.encoding = 'text';
					requestOptions.json = false;
				}

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'renebelloAzuraCastApi',
						requestOptions,
					);

				if (returnFullResponse) {
					if (responseFormat === 'binary') {
						const fullResponse = isFullHttpResponse(responseData)
							? responseData
							: {
									body: responseData,
									headers: {},
									statusCode: 200,
									statusMessage: '',
								};
						const binaryBody = fullResponse.body;
						const responseBuffer = Buffer.isBuffer(binaryBody)
							? binaryBody
							: Buffer.from(binaryBody as ArrayBuffer);
						const binaryData = await this.helpers.prepareBinaryData(responseBuffer);
						const binaryOutput: IBinaryKeyData = {
							[binaryOutputProperty]: binaryData,
						};
						returnData.push({
							json: {
								statusCode: fullResponse.statusCode,
								statusMessage: fullResponse.statusMessage ?? '',
								headers: fullResponse.headers,
								bodyLength: responseBuffer.length,
							},
							binary: binaryOutput,
							pairedItem: { item: i },
						});
					} else {
						const fullResponse = isFullHttpResponse(responseData)
							? responseData
							: {
									body: responseData,
									headers: {},
									statusCode: 200,
									statusMessage: '',
								};
						returnData.push({
							json: {
								statusCode: fullResponse.statusCode,
								statusMessage: fullResponse.statusMessage ?? '',
								headers: fullResponse.headers,
								body: fullResponse.body as IDataObject,
							},
							pairedItem: { item: i },
						});
					}
					continue;
				}

				if (responseFormat === 'binary') {
					const responseBuffer = Buffer.isBuffer(responseData)
						? responseData
						: Buffer.from(responseData as ArrayBuffer);
					const binaryData: IBinaryData = await this.helpers.prepareBinaryData(responseBuffer);
					const binaryOutput: IBinaryKeyData = {
						[binaryOutputProperty]: binaryData,
					};
					returnData.push({
						json: {
							bodyLength: responseBuffer.length,
						},
						binary: binaryOutput,
						pairedItem: { item: i },
					});
					continue;
				}

				if (responseFormat === 'text') {
					returnData.push({
						json: {
							data: String(responseData ?? ''),
						},
						pairedItem: { item: i },
					});
					continue;
				}

				if (Array.isArray(responseData)) {
					for (const entry of responseData) {
						returnData.push({
							json: toJsonObject(entry),
							pairedItem: { item: i },
						});
					}
					continue;
				}

				returnData.push({
					json: toJsonObject(responseData),
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
