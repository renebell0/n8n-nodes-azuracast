import {
	NodeApiError,
	NodeOperationError,
	type IBinaryData,
	type IBinaryKeyData,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeListSearchItems,
	type INodeListSearchResult,
	type INodeProperties,
	type INodePropertyOptions,
	type JsonObject,
} from 'n8n-workflow';
import azuraCastOpenApiSnapshot from './azuracast.openapi.snapshot.json';

type BodyMode = 'binary' | 'json' | 'multipart' | 'none' | 'raw';
type BodyModeOverride = 'auto' | BodyMode;
type ResponseFormat = 'auto' | 'binary' | 'json' | 'text';
type ResolvedResponseFormat = 'binary' | 'json' | 'text';
type SnapshotFieldType = 'boolean' | 'json' | 'number' | 'options' | 'string';
type SnapshotEnumValueType = '' | 'boolean' | 'number' | 'string';

type AzuraCastSnapshotFieldDefinition = {
	name: string;
	type: SnapshotFieldType;
	format: string;
	description: string;
	required: boolean;
	enumValues: Array<boolean | number | string>;
	enumValueType: SnapshotEnumValueType;
	typeOptions?: IDataObject;
};

type AzuraCastSnapshotOperation = {
	id: string;
	method: string;
	path: string;
	tag: string;
	summary: string;
	description: string;
	pathParameters: string[];
	queryParameters: string[];
	pathParameterDefinitions?: AzuraCastSnapshotFieldDefinition[];
	queryParameterDefinitions?: AzuraCastSnapshotFieldDefinition[];
	requestBodyRequired: boolean;
	requestBodyContentTypes: string[];
	requestBodyPreferredContentType?: string;
	requestBodyFieldDefinitions?: AzuraCastSnapshotFieldDefinition[];
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

type AzuraCastUnifiedResource = {
	tag: string;
	value: string;
	displayName: string;
	operations: AzuraCastSnapshotOperation[];
	operationOptions: INodePropertyOptions[];
};

type FullHttpResponse = {
	body: unknown;
	headers: IDataObject;
	statusCode: number;
	statusMessage?: string;
};

type LocatorEntityType =
	| 'adminStation'
	| 'customField'
	| 'episode'
	| 'hlsStream'
	| 'media'
	| 'mount'
	| 'playlist'
	| 'podcast'
	| 'queueItem'
	| 'relay'
	| 'request'
	| 'role'
	| 'sftpUser'
	| 'station'
	| 'storageLocation'
	| 'streamer'
	| 'streamerBroadcast'
	| 'user'
	| 'webhook';

type LocatorConfig = {
	entity: LocatorEntityType;
	displayName: string;
	searchMethod: string;
	idPlaceholder: string;
};

const rawSnapshot = azuraCastOpenApiSnapshot as AzuraCastSnapshotData;
const credentialTypeName = 'renebelloAzuraCastApi';
const resourceDisplayNameByTag: Record<string, string> = {
	'Administration: Backups': 'Administration Backup',
	'Administration: Custom Fields': 'Administration Custom Field',
	'Administration: Debugging': 'Administration Debugging',
	'Administration: General': 'Administration General',
	'Administration: Roles': 'Administration Role',
	'Administration: Settings': 'Administration Settings',
	'Administration: Stations': 'Administration Station',
	'Administration: Storage Locations': 'Administration Storage Location',
	'Administration: Users': 'Administration User',
	Miscellaneous: 'Miscellaneous',
	'My Account': 'My Account',
	'Public: Miscellaneous': 'Public Miscellaneous',
	'Public: Now Playing': 'Public Now Playing',
	'Public: Stations': 'Public Station',
	'Stations: Broadcasting': 'Station Broadcasting',
	'Stations: General': 'Station General',
	'Stations: HLS Streams': 'Station HLS Stream',
	'Stations: Media': 'Station Media',
	'Stations: Mount Points': 'Station Mount Point',
	'Stations: Playlists': 'Station Playlist',
	'Stations: Podcasts': 'Station Podcast',
	'Stations: Queue': 'Station Queue',
	'Stations: Remote Relays': 'Station Remote Relay',
	'Stations: Reports': 'Station Report',
	'Stations: SFTP Users': 'Station SFTP User',
	'Stations: Streamers/DJs': 'Station Streamer/DJ',
	'Stations: Web Hooks': 'Station Web Hook',
};

const operationMetadataOverrides: Record<string, Partial<AzuraCastSnapshotOperation>> = {
	adminSendTestEmail: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'email',
				type: 'string',
				format: 'email',
				description: 'Recipient email address for the test message.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	postStationFilesMkdir: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'currentDirectory',
				type: 'string',
				format: '',
				description: 'Current media directory path.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'name',
				type: 'string',
				format: '',
				description: 'Name of the directory to create.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	postStationFilesRename: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'file',
				type: 'string',
				format: '',
				description: 'Current file path to rename.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'newPath',
				type: 'string',
				format: '',
				description: 'New file path.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putAdminDebugTelnetCommand: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'command',
				type: 'string',
				format: '',
				description: 'Telnet command to run on the station backend.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putStationFileBatchAction: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'do',
				type: 'options',
				format: '',
				description: 'Batch action to perform.',
				required: true,
				enumValues: ['delete', 'playlist', 'move', 'queue', 'immediate', 'reprocess', 'clear-extra'],
				enumValueType: 'string',
			},
			{
				name: 'files',
				type: 'json',
				format: 'array',
				description: 'List of file paths to include in the batch action.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'dirs',
				type: 'json',
				format: 'array',
				description: 'List of directory paths to include in the batch action.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'playlists',
				type: 'json',
				format: 'array',
				description: 'Playlist IDs to use when batch action is playlist.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'new_playlist_name',
				type: 'string',
				format: '',
				description: 'Name of the new playlist when using playlists=["new"].',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'currentDirectory',
				type: 'string',
				format: '',
				description: 'Current directory path when using move action.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'directory',
				type: 'string',
				format: '',
				description: 'Target directory path when using move action.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putStationPlaylistOrder: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'order',
				type: 'json',
				format: 'array',
				description: 'Sequential playlist media order array.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	postAdminDoBackup: {
		requestBodyRequired: false,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'storage_location',
				type: 'number',
				format: 'int64',
				description: 'Storage location ID where the backup will be stored.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'path',
				type: 'string',
				format: '',
				description: 'Custom backup filename or path.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'exclude_media',
				type: 'boolean',
				format: '',
				description: 'Whether media files should be excluded from the backup.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	postStationMediaWaveform: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'data',
				type: 'json',
				format: 'object',
				description: 'Waveform payload object containing the cue data array.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putAccountTwoFactor: {
		requestBodyRequired: false,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'secret',
				type: 'string',
				format: '',
				description: 'Optional existing TOTP secret. If omitted, AzuraCast generates one.',
				required: false,
				enumValues: [],
				enumValueType: '',
				typeOptions: {
					password: true,
				},
			},
			{
				name: 'otp',
				type: 'string',
				format: '',
				description: 'One-time password from your authenticator app to confirm registration.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putAccountWebAuthnRegister: {
		requestBodyRequired: true,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'createResponse',
				type: 'json',
				format: 'object',
				description:
					'WebAuthn registration response object containing clientDataJSON and attestationObject.',
				required: true,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'name',
				type: 'string',
				format: '',
				description: 'Optional display name for the new passkey.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
	putMe: {
		requestBodyRequired: false,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		recommendedBodyMode: 'json',
	},
	putStationLiquidsoapConfig: {
		requestBodyRequired: false,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		recommendedBodyMode: 'json',
	},
	putStationPlaylistApplyTo: {
		requestBodyRequired: false,
		requestBodyContentTypes: ['application/json'],
		requestBodyPreferredContentType: 'application/json',
		requestBodyFieldDefinitions: [
			{
				name: 'copyPlaylist',
				type: 'boolean',
				format: '',
				description: 'Whether to clone the playlist for each target directory.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
			{
				name: 'directories',
				type: 'json',
				format: 'array',
				description: 'Array of directory paths where the playlist should be applied.',
				required: false,
				enumValues: [],
				enumValueType: '',
			},
		],
		recommendedBodyMode: 'json',
	},
};

function applySnapshotMetadataOverrides(source: AzuraCastSnapshotData): AzuraCastSnapshotData {
	const operations = source.operations.map((operation) => {
		const override = operationMetadataOverrides[operation.id];
		if (!override) {
			return operation;
		}
		const mergedOperation: AzuraCastSnapshotOperation = {
			...operation,
			...override,
		};
		if (override.pathParameterDefinitions !== undefined) {
			mergedOperation.pathParameterDefinitions = [...override.pathParameterDefinitions];
		}
		if (override.queryParameterDefinitions !== undefined) {
			mergedOperation.queryParameterDefinitions = [...override.queryParameterDefinitions];
		}
		if (override.requestBodyFieldDefinitions !== undefined) {
			mergedOperation.requestBodyFieldDefinitions = [...override.requestBodyFieldDefinitions];
		}
		if (override.requestBodyContentTypes !== undefined) {
			mergedOperation.requestBodyContentTypes = [...override.requestBodyContentTypes];
		}
		if (override.responseContentTypes !== undefined) {
			mergedOperation.responseContentTypes = [...override.responseContentTypes];
		}
		return mergedOperation;
	});
	return {
		...source,
		operations,
		operationMap: Object.fromEntries(operations.map((operation) => [operation.id, operation])),
	};
}

const snapshot = applySnapshotMetadataOverrides(rawSnapshot);

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

function toNodeApiErrorBody(error: unknown): JsonObject {
	if (error instanceof Error) {
		const normalizedError: Record<string, unknown> = {
			message: error.message || String(error),
			name: error.name,
		};
		for (const [key, value] of Object.entries(error as unknown as Record<string, unknown>)) {
			if (value !== undefined) {
				normalizedError[key] = value;
			}
		}
		return normalizedError as JsonObject;
	}
	if (isObject(error)) {
		return error as unknown as JsonObject;
	}
	return {
		message: String(error ?? 'Unknown error'),
	} as JsonObject;
}

function toOutputJsonItems(value: unknown): IDataObject[] {
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return [{ data: [] }];
		}
		return value.map((entry) => toJsonObject(entry));
	}
	if (value === undefined || value === null) {
		return [{ success: true, data: null }];
	}
	if (typeof value === 'string' && value.trim() === '') {
		return [{ success: true, data: '' }];
	}
	return [toJsonObject(value)];
}

function normalizeOperationLabel(value: string): string {
	const normalized = value.replace(/\s+/g, ' ').trim();
	if (!normalized) {
		return '';
	}
	return normalized.replace(/[.]+$/, '');
}

function sanitizeUiLabel(value: string): string {
	return value
		.replace(/[[\]{}]/g, '')
		.replace(/\s*\/\s*/g, ' or ')
		.replace(/\s+/g, ' ')
		.trim();
}

function isPathLikeLabel(value: string): boolean {
	const normalized = value.trim();
	if (!normalized) {
		return false;
	}
	if (normalized.startsWith('/')) {
		return true;
	}
	if (normalized.includes('/api/')) {
		return true;
	}
	if (/\{[^}]+\}/.test(normalized)) {
		return true;
	}
	return false;
}

function toActionLabel(value: string): string {
	const normalized = sanitizeUiLabel(normalizeOperationLabel(value));
	if (!normalized) {
		return '';
	}
	const tokens = normalized.split(/\s+/).filter(Boolean);
	if (tokens.length === 0) {
		return '';
	}
	return tokens
		.map((token) => {
			if (/^[A-Z0-9]{2,}$/.test(token)) {
				return token;
			}
			return token.toLowerCase();
		})
		.join(' ');
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
		const resolvedBinaryBodyProperty = String(binaryBodyProperty ?? '').trim();
		if (!resolvedBinaryBodyProperty) {
			throw new NodeOperationError(this.getNode(), 'Binary body property is required.', {
				itemIndex,
			});
		}
		return await this.helpers.getBinaryDataBuffer(itemIndex, resolvedBinaryBodyProperty);
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
	const resolvedBinaryBodyProperty = String(binaryBodyProperty ?? '').trim();
	if (resolvedBinaryBodyProperty) {
		const binaryData = this.helpers.assertBinaryData(itemIndex, resolvedBinaryBodyProperty);
		const binaryBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, resolvedBinaryBodyProperty);
		const blob = new Blob([binaryBuffer], {
			type: binaryData.mimeType ?? 'application/octet-stream',
		});
		const resolvedMultipartFileFieldName =
			String(multipartFileFieldName ?? '').trim() || 'file';
		formData.append(
			resolvedMultipartFileFieldName,
			blob,
			binaryData.fileName ?? `${resolvedBinaryBodyProperty}.bin`,
		);
	}
	return formData;
}

function operationIdToLabel(operationId: string): string {
	const readable = operationId
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim();
	if (!readable) {
		return '';
	}
	return readable
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

const leadingOperationContextTokens = new Set([
	'account',
	'acme',
	'admin',
	'administration',
	'all',
	'api',
	'asset',
	'assets',
	'backend',
	'broadcasting',
	'custom',
	'field',
	'fields',
	'frontend',
	'general',
	'hooks',
	'miscellaneous',
	'my',
	'now',
	'on',
	'playing',
	'points',
	'public',
	'relays',
	'reports',
	'service',
	'stations',
	'station',
	'streamers',
	'users',
	'web',
]);

const entityContextTokens = new Set([
	'account',
	'admin',
	'backend',
	'frontend',
	'general',
	'miscellaneous',
	'my',
	'public',
]);

const entityLeadingNoiseTokens = new Set([
	'add',
	'delete',
	'edit',
	'get',
	'list',
	'patch',
	'post',
	'put',
	'update',
]);

const actionLabelByToken: Record<string, string> = {
	add: 'Create',
	change: 'Change',
	clear: 'Clear',
	clone: 'Clone',
	create: 'Create',
	delete: 'Delete',
	do: 'Run',
	download: 'Download',
	edit: 'Update',
	export: 'Export',
	get: 'Get',
	import: 'Import',
	initialize: 'Initialize',
	list: 'Get Many',
	patch: 'Update',
	post: 'Run',
	put: 'Update',
	restart: 'Restart',
	run: 'Run',
	send: 'Send',
	set: 'Set',
	submit: 'Submit',
	test: 'Test',
	toggle: 'Toggle',
	update: 'Update',
	upload: 'Upload',
	view: 'View',
};

const operationNameOverrides: Record<string, string> = {
	adminAcmeViewLog: 'View ACME Log',
	getStationStreamerDeleteBroadcast: 'Delete Broadcast',
	getStationStreamerDownloadBroadcast: 'Download Broadcast',
	postAdminStationsClone: 'Clone Station',
	putStationWebhookTest: 'Test Webhook',
	putStationWebhookToggle: 'Toggle Webhook',
};

function splitOperationIdTokens(operationId: string): string[] {
	return operationId
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ')
		.map((token) => token.toLowerCase())
		.filter(Boolean);
}

function normalizeEntityTokens(tokens: string[]): string[] {
	const normalized = tokens.filter((token) => !entityContextTokens.has(token));
	while (normalized.length > 0 && entityLeadingNoiseTokens.has(normalized[0])) {
		normalized.shift();
	}
	return normalized;
}

function mapActionToken(token: string, method: string): string {
	const normalizedToken = token.toLowerCase();
	const mapped = actionLabelByToken[normalizedToken];
	if (mapped) {
		return mapped;
	}
	const normalizedMethod = method.toUpperCase();
	if (normalizedMethod === 'GET') {
		return 'Get';
	}
	if (normalizedMethod === 'POST') {
		return 'Run';
	}
	if (normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') {
		return 'Update';
	}
	if (normalizedMethod === 'DELETE') {
		return 'Delete';
	}
	return 'Run';
}

function findActionTokenIndex(tokens: string[], operation: AzuraCastSnapshotOperation): number {
	if (tokens.length === 0) {
		return -1;
	}
	const normalizedMethod = operation.method.toUpperCase();
	const priorityTokensByMethod: Record<string, string[]> = {
		DELETE: ['delete'],
		GET: ['download', 'view', 'list', 'get'],
		PATCH: ['update', 'patch', 'toggle', 'test'],
		POST: ['clone', 'import', 'export', 'upload', 'download', 'restart', 'submit', 'send', 'run', 'create', 'add', 'post', 'do'],
		PUT: ['toggle', 'test', 'update', 'put', 'edit', 'set'],
	};
	const priorityTokens = priorityTokensByMethod[normalizedMethod] ?? [];
	for (const priorityToken of priorityTokens) {
		const index = tokens.indexOf(priorityToken);
		if (index !== -1) {
			return index;
		}
	}
	for (let index = 0; index < tokens.length; index += 1) {
		if (actionLabelByToken[tokens[index]]) {
			return index;
		}
	}
	return 0;
}

function buildOperationNameFromId(operation: AzuraCastSnapshotOperation): string {
	if (operationNameOverrides[operation.id]) {
		return operationNameOverrides[operation.id];
	}

	const rawTokens = splitOperationIdTokens(operation.id);
	if (rawTokens.length === 0) {
		return '';
	}

	while (rawTokens.length > 0 && leadingOperationContextTokens.has(rawTokens[0])) {
		rawTokens.shift();
	}
	if (rawTokens.length === 0) {
		return '';
	}

	const actionTokenIndex = findActionTokenIndex(rawTokens, operation);
	const actionToken = rawTokens[actionTokenIndex] ?? rawTokens[0];
	const actionLabel = mapActionToken(actionToken, operation.method);

	let entityTokens = normalizeEntityTokens(rawTokens.slice(actionTokenIndex + 1));
	if (entityTokens.length === 0 && actionTokenIndex > 0) {
		const fallbackEntityTokens = normalizeEntityTokens(rawTokens.slice(0, actionTokenIndex));
		entityTokens = fallbackEntityTokens.map((token, index, source) => {
			if (source.length > 1 || index < source.length - 1) {
				return token;
			}
			return singularizeToken(token);
		});
	}

	if (entityTokens.length === 0) {
		return actionLabel;
	}

	const entityLabel = toDisplayName(entityTokens.join(' '));
	return `${actionLabel} ${entityLabel}`.trim();
}

function getOperationBaseName(operation: AzuraCastSnapshotOperation): string {
	const idBasedName = buildOperationNameFromId(operation);
	if (idBasedName) {
		return toDisplayName(sanitizeUiLabel(idBasedName));
	}

	const idLabel = operationIdToLabel(operation.id);
	if (idLabel) {
		return toDisplayName(sanitizeUiLabel(idLabel));
	}

	const summaryLabel = normalizeOperationLabel(operation.summary);
	if (summaryLabel && !isPathLikeLabel(summaryLabel)) {
		return toDisplayName(sanitizeUiLabel(summaryLabel));
	}

	const descriptionLabel = normalizeOperationLabel(operation.description);
	if (descriptionLabel && !isPathLikeLabel(descriptionLabel)) {
		return toDisplayName(sanitizeUiLabel(descriptionLabel));
	}
	return `${operation.method.toUpperCase()} request`;
}

function buildUniqueOperationName(
	baseName: string,
	method: string,
	usedNames: Set<string>,
): string {
	if (!usedNames.has(baseName)) {
		usedNames.add(baseName);
		return baseName;
	}
	const methodName = `${baseName} (${method.toUpperCase()})`;
	if (!usedNames.has(methodName)) {
		usedNames.add(methodName);
		return methodName;
	}
	let index = 2;
	while (usedNames.has(`${methodName} ${index}`)) {
		index += 1;
	}
	const indexedName = `${methodName} ${index}`;
	usedNames.add(indexedName);
	return indexedName;
}

function sanitizeNameSegment(value: string): string {
	return value
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

function scopedFieldName(scope: string, operationId: string, fieldName: string): string {
	return `${scope}__${sanitizeNameSegment(operationId)}__${sanitizeNameSegment(fieldName)}`;
}

function scopedOperationName(scope: string, operationId: string): string {
	return `${scope}__${sanitizeNameSegment(operationId)}`;
}

function toDisplayName(value: string): string {
	const normalized = value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/[:]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!normalized) {
		return value;
	}
	const uppercaseTokens = new Set([
		'api',
		'dj',
		'hls',
		'http',
		'https',
		'id',
		'ip',
		'json',
		'sftp',
		'url',
		'xml',
	]);
	return normalized
		.split(' ')
		.map((part) => {
			const lowercasePart = part.toLowerCase();
			if (uppercaseTokens.has(lowercasePart)) {
				return lowercasePart.toUpperCase();
			}
			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join(' ');
}

function getResourceDisplayName(tag: string): string {
	return resourceDisplayNameByTag[tag] ?? toDisplayName(tag.replace(/:/g, ' '));
}

function singularizeToken(token: string): string {
	if (token.endsWith('ies') && token.length > 3) {
		return `${token.slice(0, -3)}y`;
	}
	if (token.endsWith('s') && token.length > 1 && !token.endsWith('ss')) {
		return token.slice(0, -1);
	}
	return token;
}

function normalizeResourceToken(token: string): string {
	const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, '');
	if (!cleaned) {
		return '';
	}
	if (cleaned === 'admin') {
		return 'administration';
	}
	if (cleaned === 'debug') {
		return 'debugging';
	}
	return singularizeToken(cleaned);
}

function shortenOperationNameForResource(name: string, resourceDisplayName: string): string {
	const nameTokens = name.split(/\s+/).filter(Boolean);
	if (nameTokens.length <= 1) {
		return name;
	}

	const resourceTokenSet = new Set(
		resourceDisplayName
			.split(/\s+/)
			.map((token) => normalizeResourceToken(token))
			.filter(Boolean),
	);
	if (resourceTokenSet.size === 0) {
		return name;
	}

	const leadingVerbSet = new Set([
		'add',
		'clear',
		'create',
		'delete',
		'download',
		'edit',
		'generate',
		'get',
		'initialize',
		'list',
		'patch',
		'post',
		'put',
		'remove',
		'retrieve',
		'return',
		'run',
		'send',
		'set',
		'submit',
		'trigger',
		'update',
		'upload',
		'view',
	]);
	const keepLeadingVerb = leadingVerbSet.has(normalizeResourceToken(nameTokens[0]));
	const prefixLength = keepLeadingVerb ? 1 : 0;
	let index = prefixLength;
	while (nameTokens.length - index > 1) {
		const normalizedToken = normalizeResourceToken(nameTokens[index]);
		if (!normalizedToken || !resourceTokenSet.has(normalizedToken)) {
			break;
		}
		index += 1;
	}

	if (index === prefixLength) {
		return name;
	}

	const shortenedTokens = [...nameTokens.slice(0, prefixLength), ...nameTokens.slice(index)];
	if (shortenedTokens.length === 0) {
		return name;
	}
	return shortenedTokens.join(' ');
}

function polishOperationName(name: string, method: string): string {
	const normalized = name.replace(/\s+/g, ' ').trim();
	if (!normalized) {
		return name;
	}
	if (method.toLowerCase() === 'post' && /^post do /i.test(normalized)) {
		return normalized.replace(/^post do /i, 'Run ');
	}
	return normalized;
}

function defaultFieldDefinition(name: string, required: boolean): AzuraCastSnapshotFieldDefinition {
	return {
		name,
		type: 'string',
		format: '',
		description: '',
		required,
		enumValues: [],
		enumValueType: '',
	};
}

function normalizeFieldDefinition(
	fieldDefinition: Partial<AzuraCastSnapshotFieldDefinition>,
	fallbackName: string,
	fallbackRequired: boolean,
): AzuraCastSnapshotFieldDefinition {
	const type = (fieldDefinition.type ?? 'string') as SnapshotFieldType;
	const enumValues = Array.isArray(fieldDefinition.enumValues)
		? fieldDefinition.enumValues.filter(
				(value) =>
					typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
			)
		: [];
	const enumValueType =
		fieldDefinition.enumValueType && ['string', 'number', 'boolean'].includes(fieldDefinition.enumValueType)
			? fieldDefinition.enumValueType
			: '';
	return {
		name: String(fieldDefinition.name ?? fallbackName).trim() || fallbackName,
		type: enumValues.length > 0 ? 'options' : type,
		format: String(fieldDefinition.format ?? ''),
		description: String(fieldDefinition.description ?? ''),
		required: Boolean(fieldDefinition.required ?? fallbackRequired),
		enumValues,
		enumValueType: enumValues.length > 0 ? (enumValueType as SnapshotEnumValueType) : '',
	};
}

function getPathParameterDefinitions(
	operation: AzuraCastSnapshotOperation,
): AzuraCastSnapshotFieldDefinition[] {
	const explicit = Array.isArray(operation.pathParameterDefinitions)
		? operation.pathParameterDefinitions
		: [];
	if (explicit.length > 0) {
		return explicit.map((definition) => {
			const normalized = normalizeFieldDefinition(definition, definition.name ?? '', true);
			if (normalized.type === 'number' && normalized.enumValues.length === 0) {
				return { ...normalized, type: 'string', format: '' };
			}
			return normalized;
		});
	}
	return (operation.pathParameters ?? []).map((name) => defaultFieldDefinition(name, true));
}

function getQueryParameterDefinitions(
	operation: AzuraCastSnapshotOperation,
): AzuraCastSnapshotFieldDefinition[] {
	const explicit = Array.isArray(operation.queryParameterDefinitions)
		? operation.queryParameterDefinitions
		: [];
	if (explicit.length > 0) {
		return explicit.map((definition) =>
			normalizeFieldDefinition(definition, definition.name ?? '', false),
		);
	}
	return (operation.queryParameters ?? []).map((name) => defaultFieldDefinition(name, false));
}

function getRequestBodyFieldDefinitions(
	operation: AzuraCastSnapshotOperation,
): AzuraCastSnapshotFieldDefinition[] {
	const explicit = Array.isArray(operation.requestBodyFieldDefinitions)
		? operation.requestBodyFieldDefinitions
		: [];
	return explicit.map((definition) =>
		normalizeFieldDefinition(definition, definition.name ?? '', false),
	);
}

function isMultipartOperation(operation: AzuraCastSnapshotOperation): boolean {
	if (operation.recommendedBodyMode === 'multipart') {
		return true;
	}
	return operation.requestBodyContentTypes.some((contentType) =>
		contentType.includes('multipart/form-data'),
	);
}

function isBinaryFieldDefinition(fieldDefinition: AzuraCastSnapshotFieldDefinition): boolean {
	return fieldDefinition.format.toLowerCase() === 'binary';
}

function mapFieldToNodeType(fieldDefinition: AzuraCastSnapshotFieldDefinition): INodeProperties['type'] {
	if (fieldDefinition.type === 'number') {
		return 'number';
	}
	if (fieldDefinition.type === 'boolean') {
		return 'boolean';
	}
	if (fieldDefinition.type === 'json') {
		return 'json';
	}
	if (fieldDefinition.type === 'options' && fieldDefinition.enumValues.length > 0) {
		return 'options';
	}
	return 'string';
}

function defaultValueForField(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
): INodeProperties['default'] {
	if (fieldDefinition.type === 'number') {
		return 0;
	}
	if (fieldDefinition.type === 'boolean') {
		return false;
	}
	if (fieldDefinition.type === 'json') {
		return fieldDefinition.format === 'array' ? '[]' : '{}';
	}
	if (fieldDefinition.type === 'options' && fieldDefinition.enumValues.length > 0) {
		return fieldDefinition.enumValues[0];
	}
	return '';
}

function buildFieldDescription(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
	locationLabel: string,
): string {
	const parts: string[] = [];
	if (fieldDefinition.description.trim()) {
		parts.push(normalizeOperationLabel(fieldDefinition.description));
	}
	parts.push(locationLabel);
	if (fieldDefinition.format.trim()) {
		parts.push(`Format: ${fieldDefinition.format}`);
	}
	return parts.join(' | ');
}

function buildOptionsValues(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
): INodePropertyOptions[] {
	return fieldDefinition.enumValues.map((value) => ({
		name: String(value),
		value,
	}));
}

function pathIncludesSegment(pathTemplate: string, segment: string): boolean {
	const normalizedPath = pathTemplate.toLowerCase();
	return normalizedPath.includes(`/${segment.toLowerCase()}/`);
}

function resolveIdLocatorEntityFromPath(pathTemplate: string): LocatorEntityType | undefined {
	if (pathIncludesSegment(pathTemplate, 'custom_field')) {
		return 'customField';
	}
	if (pathIncludesSegment(pathTemplate, 'storage_location')) {
		return 'storageLocation';
	}
	if (pathIncludesSegment(pathTemplate, 'admin/station')) {
		return 'adminStation';
	}
	if (pathIncludesSegment(pathTemplate, 'admin/user')) {
		return 'user';
	}
	if (pathIncludesSegment(pathTemplate, 'role')) {
		return 'role';
	}
	if (pathIncludesSegment(pathTemplate, 'playlist')) {
		return 'playlist';
	}
	if (pathIncludesSegment(pathTemplate, 'podcast') && pathIncludesSegment(pathTemplate, 'episode')) {
		return 'episode';
	}
	if (pathIncludesSegment(pathTemplate, 'podcast')) {
		return 'podcast';
	}
	if (pathIncludesSegment(pathTemplate, 'webhook')) {
		return 'webhook';
	}
	if (pathIncludesSegment(pathTemplate, 'streamer') && pathIncludesSegment(pathTemplate, 'broadcast')) {
		return 'streamer';
	}
	if (pathIncludesSegment(pathTemplate, 'streamer')) {
		return 'streamer';
	}
	if (pathIncludesSegment(pathTemplate, 'sftp-user')) {
		return 'sftpUser';
	}
	if (pathIncludesSegment(pathTemplate, 'remote')) {
		return 'relay';
	}
	if (pathIncludesSegment(pathTemplate, 'mount')) {
		return 'mount';
	}
	if (pathIncludesSegment(pathTemplate, 'hls_stream')) {
		return 'hlsStream';
	}
	if (pathIncludesSegment(pathTemplate, 'queue')) {
		return 'queueItem';
	}
	if (pathIncludesSegment(pathTemplate, 'file')) {
		return 'media';
	}
	return undefined;
}

function getLocatorConfig(
	operation: AzuraCastSnapshotOperation,
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
): LocatorConfig | undefined {
	const fieldName = fieldDefinition.name.toLowerCase();

	if (fieldName === 'station_id') {
		return {
			entity: 'station',
			displayName: 'Station',
			searchMethod: 'searchStations',
			idPlaceholder: 'e.g. 1',
		};
	}
	if (fieldName === 'media_id' || fieldName === 'song_id') {
		return {
			entity: 'media',
			displayName: 'Media',
			searchMethod: 'searchMedia',
			idPlaceholder: 'e.g. 123',
		};
	}
	if (fieldName === 'podcast_id') {
		return {
			entity: 'podcast',
			displayName: 'Podcast',
			searchMethod: 'searchPodcasts',
			idPlaceholder: 'e.g. abc123',
		};
	}
	if (fieldName === 'episode_id') {
		return {
			entity: 'episode',
			displayName: 'Episode',
			searchMethod: 'searchEpisodes',
			idPlaceholder: 'e.g. 456',
		};
	}
	if (fieldName === 'request_id') {
		return {
			entity: 'request',
			displayName: 'Request',
			searchMethod: 'searchRequests',
			idPlaceholder: 'e.g. 42',
		};
	}
	if (fieldName === 'broadcast_id') {
		return {
			entity: 'streamerBroadcast',
			displayName: 'Broadcast',
			searchMethod: 'searchStreamerBroadcasts',
			idPlaceholder: 'e.g. 99',
		};
	}
	if (fieldName !== 'id') {
		return undefined;
	}

	const entity = resolveIdLocatorEntityFromPath(operation.path);
	if (!entity) {
		return undefined;
	}

	if (entity === 'playlist') {
		return {
			entity,
			displayName: 'Playlist',
			searchMethod: 'searchPlaylists',
			idPlaceholder: 'e.g. 5',
		};
	}
	if (entity === 'podcast') {
		return {
			entity,
			displayName: 'Podcast',
			searchMethod: 'searchPodcasts',
			idPlaceholder: 'e.g. abc123',
		};
	}
	if (entity === 'episode') {
		return {
			entity,
			displayName: 'Episode',
			searchMethod: 'searchEpisodes',
			idPlaceholder: 'e.g. 12',
		};
	}
	if (entity === 'webhook') {
		return {
			entity,
			displayName: 'Webhook',
			searchMethod: 'searchWebhooks',
			idPlaceholder: 'e.g. 8',
		};
	}
	if (entity === 'streamer') {
		return {
			entity,
			displayName: 'Streamer',
			searchMethod: 'searchStreamers',
			idPlaceholder: 'e.g. 7',
		};
	}
	if (entity === 'sftpUser') {
		return {
			entity,
			displayName: 'SFTP User',
			searchMethod: 'searchSftpUsers',
			idPlaceholder: 'e.g. 2',
		};
	}
	if (entity === 'relay') {
		return {
			entity,
			displayName: 'Relay',
			searchMethod: 'searchRelays',
			idPlaceholder: 'e.g. 3',
		};
	}
	if (entity === 'mount') {
		return {
			entity,
			displayName: 'Mount Point',
			searchMethod: 'searchMounts',
			idPlaceholder: 'e.g. 4',
		};
	}
	if (entity === 'hlsStream') {
		return {
			entity,
			displayName: 'HLS Stream',
			searchMethod: 'searchHlsStreams',
			idPlaceholder: 'e.g. 6',
		};
	}
	if (entity === 'queueItem') {
		return {
			entity,
			displayName: 'Queue Item',
			searchMethod: 'searchQueueItems',
			idPlaceholder: 'e.g. 10',
		};
	}
	if (entity === 'media') {
		return {
			entity,
			displayName: 'Media',
			searchMethod: 'searchMedia',
			idPlaceholder: 'e.g. 123',
		};
	}
	if (entity === 'customField') {
		return {
			entity,
			displayName: 'Custom Field',
			searchMethod: 'searchCustomFields',
			idPlaceholder: 'e.g. 1',
		};
	}
	if (entity === 'role') {
		return {
			entity,
			displayName: 'Role',
			searchMethod: 'searchRoles',
			idPlaceholder: 'e.g. 1',
		};
	}
	if (entity === 'user') {
		return {
			entity,
			displayName: 'User',
			searchMethod: 'searchUsers',
			idPlaceholder: 'e.g. 1',
		};
	}
	if (entity === 'storageLocation') {
		return {
			entity,
			displayName: 'Storage Location',
			searchMethod: 'searchStorageLocations',
			idPlaceholder: 'e.g. 1',
		};
	}
	if (entity === 'adminStation') {
		return {
			entity,
			displayName: 'Station',
			searchMethod: 'searchAdminStations',
			idPlaceholder: 'e.g. 1',
		};
	}

	return undefined;
}

function createResourceLocatorPathProperty(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
	propertyName: string,
	displayOptions: INodeProperties['displayOptions'],
	locationLabel: string,
	locatorConfig: LocatorConfig,
): INodeProperties {
	return {
		displayName: locatorConfig.displayName,
		name: propertyName,
		type: 'resourceLocator',
		default: {
			mode: 'list',
			value: '',
		},
		required: true,
		description: buildFieldDescription(fieldDefinition, locationLabel),
		displayOptions,
		modes: [
			{
				displayName: locatorConfig.displayName,
				name: 'list',
				type: 'list',
				placeholder: `Select a ${locatorConfig.displayName.toLowerCase()}...`,
				typeOptions: {
					searchListMethod: locatorConfig.searchMethod,
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: locatorConfig.idPlaceholder,
			},
		],
	};
}

function getFieldTypeOptions(fieldDefinition: AzuraCastSnapshotFieldDefinition): IDataObject | undefined {
	const explicitTypeOptions = isObject(fieldDefinition.typeOptions)
		? ({ ...fieldDefinition.typeOptions } as IDataObject)
		: undefined;
	if (mapFieldToNodeType(fieldDefinition) !== 'string') {
		return explicitTypeOptions;
	}
	const normalizedFieldName = String(fieldDefinition.name ?? '').toLowerCase();
	const sensitiveFieldNamePattern = /(secret|password|token|api[_-]?key|access[_-]?key|private[_-]?key)/;
	if (!sensitiveFieldNamePattern.test(normalizedFieldName)) {
		return explicitTypeOptions;
	}
	return {
		...(explicitTypeOptions ?? {}),
		password: true,
	};
}

function createRequiredFieldProperty(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
	propertyName: string,
	displayOptions: INodeProperties['displayOptions'],
	locationLabel: string,
): INodeProperties {
	const type = mapFieldToNodeType(fieldDefinition);
	const property: INodeProperties = {
		displayName: toDisplayName(fieldDefinition.name),
		name: propertyName,
		type,
		default: defaultValueForField(fieldDefinition),
		required: true,
		description: buildFieldDescription(fieldDefinition, locationLabel),
		displayOptions,
	};
	if (type === 'options') {
		property.options = buildOptionsValues(fieldDefinition);
		property.noDataExpression = true;
	}
	const typeOptions = getFieldTypeOptions(fieldDefinition);
	if (typeOptions) {
		property.typeOptions = typeOptions;
	}
	return property;
}

function createOptionalCollectionField(
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
	locationLabel: string,
): INodeProperties {
	const type = mapFieldToNodeType(fieldDefinition);
	const property: INodeProperties = {
		displayName: toDisplayName(fieldDefinition.name),
		name: fieldDefinition.name,
		type,
		default: defaultValueForField(fieldDefinition),
		description: buildFieldDescription(fieldDefinition, locationLabel),
	};
	if (type === 'options') {
		property.options = buildOptionsValues(fieldDefinition);
		property.noDataExpression = true;
	}
	const typeOptions = getFieldTypeOptions(fieldDefinition);
	if (typeOptions) {
		property.typeOptions = typeOptions;
	}
	return property;
}

function createOptionalCollectionProperty(
	displayName: string,
	name: string,
	fieldDefinitions: AzuraCastSnapshotFieldDefinition[],
	displayOptions: INodeProperties['displayOptions'],
	locationLabel: string,
): INodeProperties {
	const scopeLabel =
		displayName === 'Optional Query Parameters'
			? 'Add one or more optional query parameters for this action'
			: displayName === 'Optional Multipart Fields'
				? 'Add one or more optional multipart fields for this action'
				: 'Add one or more optional body fields for this action';
	return {
		displayName,
		name,
		type: 'collection',
		default: {},
		placeholder: `Add ${displayName}`,
		description: `${scopeLabel} (${locationLabel})`,
		displayOptions,
		options: fieldDefinitions.map((fieldDefinition) =>
			createOptionalCollectionField(fieldDefinition, locationLabel),
		),
	};
}

function appendOperationSpecificProperties(
	properties: INodeProperties[],
	operations: AzuraCastSnapshotOperation[],
	getDisplayOptions: (operation: AzuraCastSnapshotOperation) => INodeProperties['displayOptions'],
) {
	for (const operation of operations) {
		const displayOptions = getDisplayOptions(operation);

		const pathDefinitions = getPathParameterDefinitions(operation);
		for (const fieldDefinition of pathDefinitions) {
			const propertyName = scopedFieldName('path', operation.id, fieldDefinition.name);
			const locationLabel = `Path parameter: {${fieldDefinition.name}}`;
			const locatorConfig = getLocatorConfig(operation, fieldDefinition);
			if (locatorConfig) {
				properties.push(
					createResourceLocatorPathProperty(
						fieldDefinition,
						propertyName,
						displayOptions,
						locationLabel,
						locatorConfig,
					),
				);
				continue;
			}
			properties.push(
				createRequiredFieldProperty(fieldDefinition, propertyName, displayOptions, locationLabel),
			);
		}

		const queryDefinitions = getQueryParameterDefinitions(operation);
		const requiredQueryDefinitions = queryDefinitions.filter((fieldDefinition) => fieldDefinition.required);
		const optionalQueryDefinitions = queryDefinitions.filter((fieldDefinition) => !fieldDefinition.required);

		for (const fieldDefinition of requiredQueryDefinitions) {
			properties.push(
				createRequiredFieldProperty(
					fieldDefinition,
					scopedFieldName('query_required', operation.id, fieldDefinition.name),
					displayOptions,
					`Required query parameter: ${fieldDefinition.name}`,
				),
			);
		}

		if (optionalQueryDefinitions.length > 0) {
			properties.push(
				createOptionalCollectionProperty(
					'Optional Query Parameters',
					scopedOperationName('query_optional', operation.id),
					optionalQueryDefinitions,
					displayOptions,
					'Optional query parameter',
				),
			);
		}

		const bodyDefinitions = getRequestBodyFieldDefinitions(operation);
		const multipartOperation = isMultipartOperation(operation);
		const binaryFieldDefinition = multipartOperation
			? bodyDefinitions.find((fieldDefinition) => isBinaryFieldDefinition(fieldDefinition))
			: undefined;
		const bodyDefinitionsWithoutBinary = multipartOperation
			? bodyDefinitions.filter((fieldDefinition) => !isBinaryFieldDefinition(fieldDefinition))
			: bodyDefinitions;
		const requiredBodyDefinitions = bodyDefinitionsWithoutBinary.filter(
			(fieldDefinition) => fieldDefinition.required,
		);
		const optionalBodyDefinitions = bodyDefinitionsWithoutBinary.filter(
			(fieldDefinition) => !fieldDefinition.required,
		);

		if (multipartOperation) {
			if (binaryFieldDefinition) {
				properties.push({
					displayName: 'Input Data Field Name',
					name: scopedOperationName('multipart_binary_property', operation.id),
					type: 'string',
					default: 'data',
					required: binaryFieldDefinition.required,
					displayOptions,
					description: 'Name of the input data field that contains the upload file',
				});
				properties.push({
					displayName: 'File Field Name',
					name: scopedOperationName('multipart_file_field_name', operation.id),
					type: 'string',
					default: 'file',
					displayOptions,
					description: 'Multipart form-data field name for the uploaded file',
				});
			}

			for (const fieldDefinition of requiredBodyDefinitions) {
				properties.push(
					createRequiredFieldProperty(
						fieldDefinition,
						scopedFieldName('body_required', operation.id, fieldDefinition.name),
						displayOptions,
						`Required multipart field: ${fieldDefinition.name}`,
					),
				);
			}

			if (optionalBodyDefinitions.length > 0) {
				properties.push(
					createOptionalCollectionProperty(
						'Optional Multipart Fields',
						scopedOperationName('body_optional', operation.id),
						optionalBodyDefinitions,
						displayOptions,
						'Optional multipart field',
					),
				);
			}

			continue;
		}

		for (const fieldDefinition of requiredBodyDefinitions) {
			properties.push(
				createRequiredFieldProperty(
					fieldDefinition,
					scopedFieldName('body_required', operation.id, fieldDefinition.name),
					displayOptions,
					`Required body field: ${fieldDefinition.name}`,
				),
			);
		}

		if (optionalBodyDefinitions.length > 0) {
			properties.push(
				createOptionalCollectionProperty(
					'Optional Body Fields',
					scopedOperationName('body_optional', operation.id),
					optionalBodyDefinitions,
					displayOptions,
					'Optional body field',
				),
			);
		}

		if (operation.requestBodyContentTypes.length > 0 && bodyDefinitions.length === 0) {
			properties.push({
				displayName: 'Request Body (JSON)',
				name: scopedOperationName('body_json', operation.id),
				type: 'json',
				default: '{}',
				displayOptions,
				description: `Content types: ${operation.requestBodyContentTypes.join(', ')}`,
			});
		}
	}
}

function appendSharedAdvancedProperties(properties: INodeProperties[]) {
	properties.push(
		{
			displayName: 'Send Additional Headers',
			name: 'sendAdditionalHeaders',
			type: 'boolean',
			default: false,
			description: 'Whether to include extra HTTP headers in this request',
		},
		{
			displayName: 'Additional Headers (JSON)',
			name: 'additionalHeaders',
			type: 'json',
			default: '{}',
			description: 'Provide additional HTTP headers as a JSON object, for example {"X-Trace-ID":"abc123"}',
			displayOptions: {
				show: {
					sendAdditionalHeaders: [true],
				},
			},
		},
		{
			displayName: 'Body Mode Override',
			name: 'bodyModeOverride',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Auto', value: 'auto' },
				{ name: 'Binary', value: 'binary' },
				{ name: 'JSON', value: 'json' },
				{ name: 'Multipart Form-Data', value: 'multipart' },
				{ name: 'None', value: 'none' },
				{ name: 'Raw', value: 'raw' },
			],
			default: 'auto',
			description:
				'Use Auto for operation-based fields. Override only when the API endpoint requires manual body handling.',
		},
		{
			displayName: 'Manual JSON Body',
			name: 'manualJsonBody',
			type: 'json',
			default: '{}',
			description: 'Manual request body as JSON. Used only when Body Mode Override is set to JSON.',
			displayOptions: {
				show: {
					bodyModeOverride: ['json'],
				},
			},
		},
		{
			displayName: 'Manual Raw Body',
			name: 'manualRawBody',
			type: 'string',
			default: '',
			typeOptions: {
				rows: 6,
			},
			description: 'Manual request body as plain text. Used only when Body Mode Override is set to Raw.',
			displayOptions: {
				show: {
					bodyModeOverride: ['raw'],
				},
			},
		},
		{
			displayName: 'Manual Input Data Field Name',
			name: 'manualBinaryBodyProperty',
			type: 'string',
			default: 'data',
			description: 'Input binary property name to read when sending binary or multipart payloads manually',
			displayOptions: {
				show: {
					bodyModeOverride: ['binary', 'multipart'],
				},
			},
		},
		{
			displayName: 'Manual Multipart File Field Name',
			name: 'manualMultipartFileFieldName',
			type: 'string',
			default: 'file',
			description: 'Multipart file field name expected by the endpoint when using manual multipart mode',
			displayOptions: {
				show: {
					bodyModeOverride: ['multipart'],
				},
			},
		},
		{
			displayName: 'Manual Multipart Fields (JSON)',
			name: 'manualMultipartFields',
			type: 'json',
			default: '{}',
			description: 'Additional multipart form fields as JSON when using manual multipart mode',
			displayOptions: {
				show: {
					bodyModeOverride: ['multipart'],
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
			description: 'How to parse the response payload returned by AzuraCast',
		},
		{
			displayName: 'Output Data Field Name',
			name: 'binaryOutputProperty',
			type: 'string',
			default: 'data',
			description: 'Binary output property name used when Response Format is set to Binary',
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
			description: 'Whether to include status code and headers together with the response body',
		},
		{
			displayName: 'Wrap Response Data',
			name: 'wrapResponseData',
			type: 'boolean',
			default: true,
			description:
				'Whether to return a single item as {success, data}. Disable to split array responses into multiple items.',
			displayOptions: {
				hide: {
					returnFullResponse: [true],
				},
			},
		},
	);
}

function createProperties(
	operations: AzuraCastSnapshotOperation[],
	operationOptions: INodePropertyOptions[],
	defaultOperationId: string,
): INodeProperties[] {
	const properties: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operationId',
			type: 'options',
			noDataExpression: true,
			options: operationOptions,
			default: defaultOperationId,
		},
	];
	appendOperationSpecificProperties(properties, operations, (operation) => ({
		show: {
			operationId: [operation.id],
		},
	}));
	appendSharedAdvancedProperties(properties);
	return properties;
}

function createUnifiedProperties(resources: AzuraCastUnifiedResource[]): INodeProperties[] {
	const defaultResourceValue = resources[0]?.value ?? '';
	const properties: INodeProperties[] = [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			default: defaultResourceValue,
			noDataExpression: true,
			options: resources.map((resource) => ({
				name: resource.displayName,
				value: resource.value,
				description: resource.tag,
			})),
		},
	];

	for (const resource of resources) {
		properties.push({
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			default: '',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: [resource.value],
				},
			},
			options: resource.operationOptions,
		});
	}

	const operationToResourceValue = new Map<string, string>();
	for (const resource of resources) {
		for (const operation of resource.operations) {
			operationToResourceValue.set(operation.id, resource.value);
		}
	}

	appendOperationSpecificProperties(
		properties,
		resources.flatMap((resource) => resource.operations),
		(operation) => {
			return {
				show: {
					resource: [operationToResourceValue.get(operation.id) ?? ''],
					operation: [operation.id],
				},
			};
		},
	);
	appendSharedAdvancedProperties(properties);
	return properties;
}

function getResourceValueFromTag(tag: string): string {
	return `resource_${sanitizeNameSegment(tag)}`;
}

function getDomainOperations(tag: string) {
	const operations = snapshot.operations
		.filter((operation) => operation.tag === tag)
		.sort((a, b) => a.id.localeCompare(b.id));
	if (operations.length === 0) {
		throw new Error(`No operations found for tag "${tag}".`);
	}
	const operationMap = Object.fromEntries(operations.map((operation) => [operation.id, operation]));
	const { operationOptions, defaultOperationId } = buildOperationOptions(operations);
	return {
		operations,
		operationMap,
		operationOptions,
		defaultOperationId,
	};
}

function buildOperationOptions(operations: AzuraCastSnapshotOperation[]) {
	const resourceDisplayName = getResourceDisplayName(String(operations[0]?.tag ?? 'General'));
	const usedNames = new Set<string>();
	const operationOptions = operations.map((operation) => {
		const rawBaseName = toDisplayName(sanitizeUiLabel(getOperationBaseName(operation)));
		const baseName = polishOperationName(
			shortenOperationNameForResource(rawBaseName, resourceDisplayName),
			operation.method,
		);
		const name = buildUniqueOperationName(baseName, operation.method, usedNames);
		const summaryOrDescription = normalizeOperationLabel(operation.summary || operation.description);
		const normalizedDescription =
			summaryOrDescription && !isPathLikeLabel(summaryOrDescription)
				? sanitizeUiLabel(summaryOrDescription)
				: sanitizeUiLabel(normalizeOperationLabel(operation.description));
		const description =
			normalizedDescription ||
			`Runs ${toActionLabel(name)} for the ${toActionLabel(resourceDisplayName)} resource.`;
		return {
			name,
			action: toActionLabel(name),
			value: operation.id,
			description: description || operation.tag,
		};
	});
	const defaultOperationId = operationOptions[0].value;
	return {
		operationOptions: operationOptions as INodePropertyOptions[],
		defaultOperationId,
	};
}

function getUnifiedResources(): AzuraCastUnifiedResource[] {
	const grouped = new Map<string, AzuraCastSnapshotOperation[]>();
	for (const operation of snapshot.operations) {
		const tag = String(operation.tag ?? 'General');
		const operationsForTag = grouped.get(tag) ?? [];
		operationsForTag.push(operation);
		grouped.set(tag, operationsForTag);
	}

	const orderedTags = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
	return orderedTags.map((tag) => {
		const operations = (grouped.get(tag) ?? []).sort((a, b) => a.id.localeCompare(b.id));
		const { operationOptions } = buildOperationOptions(operations);
		return {
			tag,
			value: `resource_${sanitizeNameSegment(tag)}`,
			displayName: getResourceDisplayName(tag),
			operations,
			operationOptions,
		};
	});
}

export function createDomainOperationConfig(tag: string) {
	const operations = getDomainOperations(tag);
	return {
		operationMap: operations.operationMap,
		properties: createProperties(
			operations.operations,
			operations.operationOptions,
			operations.defaultOperationId,
		),
	};
}

export function createUnifiedOperationConfig() {
	const resources = getUnifiedResources();
	return {
		operationMap: snapshot.operationMap,
		properties: createUnifiedProperties(resources),
	};
}

export function createResourceProperty(): INodeProperties {
	const resources = getUnifiedResources();
	const defaultResourceValue = resources[0]?.value ?? '';
	const resourceOptions: INodePropertyOptions[] = resources.map((resource) => ({
		name: resource.displayName,
		value: resource.value,
		description: resource.tag,
	}));
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		default: defaultResourceValue,
		noDataExpression: true,
		options: resourceOptions,
	};
}

export function createResourceOperationProperty(tag: string, resourceValue?: string): INodeProperties {
	const operations = getDomainOperations(tag);
	const defaultOperationId = operations.defaultOperationId;
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: defaultOperationId,
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [resourceValue ?? getResourceValueFromTag(tag)],
			},
		},
		options: operations.operationOptions,
	};
}

export function createResourceFieldProperties(tag: string, resourceValue?: string): INodeProperties[] {
	const operations = getDomainOperations(tag);
	const resolvedResourceValue = resourceValue ?? getResourceValueFromTag(tag);
	const properties: INodeProperties[] = [];
	appendOperationSpecificProperties(properties, operations.operations, (operation) => ({
		show: {
			resource: [resolvedResourceValue],
			operation: [operation.id],
		},
	}));
	return properties;
}

export function createSharedAdvancedProperties(): INodeProperties[] {
	const properties: INodeProperties[] = [];
	appendSharedAdvancedProperties(properties);
	return properties;
}

export const azuraCastCredentialTypeName = credentialTypeName;

function extractResourceLocatorValue(value: unknown): unknown {
	if (!isObject(value)) {
		return value;
	}
	if (!Object.prototype.hasOwnProperty.call(value, 'value')) {
		return value;
	}
	return value.value;
}

function isValueMissing(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		(typeof value === 'string' && value.trim() === '')
	);
}

function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		return value !== 0;
	}
	const normalized = String(value).trim().toLowerCase();
	return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	if (isObject(error) && typeof error.message === 'string' && error.message.trim()) {
		return error.message;
	}
	return 'Unknown error';
}

function getErrorCode(error: unknown): string {
	if (isObject(error) && typeof error.code === 'string' && error.code.trim()) {
		return error.code;
	}
	return 'UNKNOWN_ERROR';
}

function getErrorDetails(error: unknown): string {
	if (isObject(error)) {
		const description = error.description;
		if (typeof description === 'string' && description.trim()) {
			return description;
		}
		const context = error.context;
		if (isObject(context) && typeof context.description === 'string' && context.description.trim()) {
			return context.description;
		}
	}
	return '';
}

function getErrorHttpStatusCode(error: unknown): number | undefined {
	if (!isObject(error)) {
		return undefined;
	}
	const directHttpCode = error.httpCode;
	if (typeof directHttpCode === 'number' && Number.isFinite(directHttpCode)) {
		return directHttpCode;
	}
	const statusCode = error.statusCode;
	if (typeof statusCode === 'number' && Number.isFinite(statusCode)) {
		return statusCode;
	}
	const context = error.context;
	if (isObject(context)) {
		const contextStatusCode = context.httpStatusCode;
		if (typeof contextStatusCode === 'number' && Number.isFinite(contextStatusCode)) {
			return contextStatusCode;
		}
	}
	return undefined;
}

function buildContinueOnFailOutput(
	error: unknown,
	itemIndex: number,
	operationId?: string,
	resource?: string,
): IDataObject {
	const message = getErrorMessage(error);
	const details = getErrorDetails(error);
	const statusCode = getErrorHttpStatusCode(error);
	return {
		success: false,
		operation: operationId ?? '',
		resource: resource ?? '',
		itemIndex,
		error: {
			message,
			details,
			code: getErrorCode(error),
			statusCode,
			timestamp: new Date().toISOString(),
		},
	};
}

function coerceFieldValue(
	node: ReturnType<IExecuteFunctions['getNode']>,
	itemIndex: number,
	parameterName: string,
	fieldDefinition: AzuraCastSnapshotFieldDefinition,
	rawValue: unknown,
): unknown {
	if (isValueMissing(rawValue)) {
		return undefined;
	}

	if (fieldDefinition.type === 'number') {
		if (parameterName.startsWith('path__') && fieldDefinition.enumValues.length === 0) {
			return String(rawValue);
		}
		const numericValue = Number(rawValue);
		if (!Number.isFinite(numericValue)) {
			throw new NodeOperationError(node, `Invalid numeric value for "${parameterName}".`, {
				itemIndex,
			});
		}
		return numericValue;
	}

	if (fieldDefinition.type === 'boolean') {
		return toBoolean(rawValue);
	}

	if (fieldDefinition.type === 'json') {
		return parseJsonValue(node, rawValue, parameterName, itemIndex);
	}

	if (fieldDefinition.type === 'options') {
		if (fieldDefinition.enumValueType === 'number') {
			const numericEnumValue = Number(rawValue);
			if (!Number.isFinite(numericEnumValue)) {
				throw new NodeOperationError(node, `Invalid enum value for "${parameterName}".`, {
					itemIndex,
				});
			}
			return numericEnumValue;
		}
		if (fieldDefinition.enumValueType === 'boolean') {
			return toBoolean(rawValue);
		}
		return String(rawValue);
	}

	return rawValue;
}

function splitRequiredOptional(
	fieldDefinitions: AzuraCastSnapshotFieldDefinition[],
): {
	required: AzuraCastSnapshotFieldDefinition[];
	optional: AzuraCastSnapshotFieldDefinition[];
} {
	return {
		required: fieldDefinitions.filter((fieldDefinition) => fieldDefinition.required),
		optional: fieldDefinitions.filter((fieldDefinition) => !fieldDefinition.required),
	};
}

function readLegacyPathParameters(
	this: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	return parseJsonObject(
		this.getNode(),
		this.getNodeParameter('pathParameters', itemIndex, '{}'),
		'pathParameters',
		itemIndex,
	);
}

function getPathTemplateTokens(pathTemplate: string): string[] {
	return [...pathTemplate.matchAll(/\{([^}]+)\}/g)].map((match) => String(match[1] ?? '').trim());
}

function alignPathParameterAliases(
	pathParameters: IDataObject,
	pathTemplate: string,
): IDataObject {
	const aligned: IDataObject = { ...pathParameters };
	const pathTokens = getPathTemplateTokens(pathTemplate);
	const idAliasKeys = ['media_id', 'song_id', 'podcast_id', 'episode_id', 'request_id', 'broadcast_id'];

	for (const token of pathTokens) {
		if (!token) {
			continue;
		}
		if (!isValueMissing(aligned[token])) {
			continue;
		}
		if (token === 'id') {
			for (const aliasKey of idAliasKeys) {
				if (!isValueMissing(aligned[aliasKey])) {
					aligned.id = aligned[aliasKey];
					break;
				}
			}
			continue;
		}
		if (token.endsWith('_id') && !isValueMissing(aligned.id)) {
			aligned[token] = aligned.id;
		}
	}

	if (!isValueMissing(aligned.media_id) && isValueMissing(aligned.id) && pathTokens.includes('id')) {
		aligned.id = aligned.media_id;
	}
	if (!isValueMissing(aligned.song_id) && isValueMissing(aligned.id) && pathTokens.includes('id')) {
		aligned.id = aligned.song_id;
	}

	return aligned;
}

function readLegacyQueryParameters(
	this: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const sendQueryParameters = this.getNodeParameter('sendQueryParameters', itemIndex, false) as boolean;
	if (!sendQueryParameters) {
		return {};
	}
	return parseJsonObject(
		this.getNode(),
		this.getNodeParameter('queryParameters', itemIndex, '{}'),
		'queryParameters',
		itemIndex,
	);
}

function readOptionalCollectionValues(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): IDataObject {
	const rawValue = this.getNodeParameter(collectionName, itemIndex, {});
	if (!isObject(rawValue)) {
		return {};
	}
	return rawValue;
}

function collectPathParameters(
	this: IExecuteFunctions,
	operation: AzuraCastSnapshotOperation,
	itemIndex: number,
): IDataObject {
	const fieldDefinitions = getPathParameterDefinitions(operation);
	const pathParameters: IDataObject = {};
	const legacyValues = readLegacyPathParameters.call(this, itemIndex);

	for (const fieldDefinition of fieldDefinitions) {
		const parameterName = scopedFieldName('path', operation.id, fieldDefinition.name);
		let rawValue = extractResourceLocatorValue(
			this.getNodeParameter(parameterName, itemIndex, undefined),
		);
		if (isValueMissing(rawValue)) {
			rawValue = extractResourceLocatorValue(legacyValues[fieldDefinition.name]);
		}
		if (
			isValueMissing(rawValue) &&
			fieldDefinition.name !== 'id' &&
			/(^|_)id$/i.test(fieldDefinition.name)
		) {
			rawValue = extractResourceLocatorValue(legacyValues.id);
		}
		if (isValueMissing(rawValue)) {
			throw new NodeOperationError(
				this.getNode(),
				`Missing required path parameter "${fieldDefinition.name}".`,
				{
					itemIndex,
				},
			);
		}
		const value = coerceFieldValue(
			this.getNode(),
			itemIndex,
			parameterName,
			fieldDefinition,
			rawValue,
		);
		pathParameters[fieldDefinition.name] = value as string | number | boolean | IDataObject;
	}

	for (const [legacyName, legacyValue] of Object.entries(legacyValues)) {
		if (pathParameters[legacyName] !== undefined) {
			continue;
		}
		pathParameters[legacyName] = extractResourceLocatorValue(legacyValue) as
			| string
			| number
			| boolean
			| IDataObject;
	}

	return alignPathParameterAliases(pathParameters, operation.path);
}

function collectQueryParameters(
	this: IExecuteFunctions,
	operation: AzuraCastSnapshotOperation,
	itemIndex: number,
): IDataObject | undefined {
	const fieldDefinitions = getQueryParameterDefinitions(operation);
	const { required, optional } = splitRequiredOptional(fieldDefinitions);
	const queryParameters: IDataObject = {};
	const legacyValues = readLegacyQueryParameters.call(this, itemIndex);

	for (const fieldDefinition of required) {
		const parameterName = scopedFieldName('query_required', operation.id, fieldDefinition.name);
		let rawValue = this.getNodeParameter(parameterName, itemIndex, undefined);
		if (isValueMissing(rawValue)) {
			rawValue = legacyValues[fieldDefinition.name];
		}
		if (isValueMissing(rawValue)) {
			throw new NodeOperationError(
				this.getNode(),
				`Missing required query parameter "${fieldDefinition.name}".`,
				{
					itemIndex,
				},
			);
		}
		const value = coerceFieldValue(
			this.getNode(),
			itemIndex,
			parameterName,
			fieldDefinition,
			rawValue,
		);
		queryParameters[fieldDefinition.name] = value as string | number | boolean | IDataObject;
	}

	if (optional.length > 0) {
		const optionalCollection = readOptionalCollectionValues.call(
			this,
			itemIndex,
			scopedOperationName('query_optional', operation.id),
		);
		const optionalMap = new Map(optional.map((fieldDefinition) => [fieldDefinition.name, fieldDefinition]));
		for (const [fieldName, rawValue] of Object.entries(optionalCollection)) {
			if (isValueMissing(rawValue)) {
				continue;
			}
			const fieldDefinition = optionalMap.get(fieldName) ?? defaultFieldDefinition(fieldName, false);
			const parameterName = scopedFieldName('query_optional', operation.id, fieldName);
			const value = coerceFieldValue(
				this.getNode(),
				itemIndex,
				parameterName,
				fieldDefinition,
				rawValue,
			);
			if (value !== undefined) {
				queryParameters[fieldName] = value as string | number | boolean | IDataObject;
			}
		}
	}

	for (const [legacyName, legacyValue] of Object.entries(legacyValues)) {
		if (queryParameters[legacyName] !== undefined) {
			continue;
		}
		queryParameters[legacyName] = legacyValue;
	}

	if (Object.keys(queryParameters).length === 0) {
		return undefined;
	}
	return queryParameters;
}

async function collectAutoRequestBody(
	this: IExecuteFunctions,
	operation: AzuraCastSnapshotOperation,
	itemIndex: number,
): Promise<unknown> {
	const fieldDefinitions = getRequestBodyFieldDefinitions(operation);
	const multipartOperation = isMultipartOperation(operation);
	const binaryFieldDefinition = multipartOperation
		? fieldDefinitions.find((fieldDefinition) => isBinaryFieldDefinition(fieldDefinition))
		: undefined;
	const bodyFieldDefinitions = multipartOperation
		? fieldDefinitions.filter((fieldDefinition) => !isBinaryFieldDefinition(fieldDefinition))
		: fieldDefinitions;
	const { required, optional } = splitRequiredOptional(bodyFieldDefinitions);

	if (bodyFieldDefinitions.length === 0 && !multipartOperation) {
		if (operation.requestBodyContentTypes.length === 0) {
			return undefined;
		}
		const jsonParameterName = scopedOperationName('body_json', operation.id);
		const rawJsonBody = this.getNodeParameter(jsonParameterName, itemIndex, '');
		if (isValueMissing(rawJsonBody)) {
			return undefined;
		}
		return parseJsonValue(this.getNode(), rawJsonBody, jsonParameterName, itemIndex);
	}

	const body: IDataObject = {};
	for (const fieldDefinition of required) {
		const parameterName = scopedFieldName('body_required', operation.id, fieldDefinition.name);
		const rawValue = this.getNodeParameter(parameterName, itemIndex, undefined);
		if (isValueMissing(rawValue)) {
			throw new NodeOperationError(
				this.getNode(),
				`Missing required body field "${fieldDefinition.name}".`,
				{
					itemIndex,
				},
			);
		}
		const value = coerceFieldValue(
			this.getNode(),
			itemIndex,
			parameterName,
			fieldDefinition,
			rawValue,
		);
		if (value !== undefined) {
			body[fieldDefinition.name] = value as string | number | boolean | IDataObject;
		}
	}

	if (optional.length > 0) {
		const optionalCollection = readOptionalCollectionValues.call(
			this,
			itemIndex,
			scopedOperationName('body_optional', operation.id),
		);
		const optionalMap = new Map(optional.map((fieldDefinition) => [fieldDefinition.name, fieldDefinition]));
		for (const [fieldName, rawValue] of Object.entries(optionalCollection)) {
			if (isValueMissing(rawValue)) {
				continue;
			}
			const fieldDefinition = optionalMap.get(fieldName) ?? defaultFieldDefinition(fieldName, false);
			const parameterName = scopedFieldName('body_optional', operation.id, fieldName);
			const value = coerceFieldValue(
				this.getNode(),
				itemIndex,
				parameterName,
				fieldDefinition,
				rawValue,
			);
			if (value !== undefined) {
				body[fieldName] = value as string | number | boolean | IDataObject;
			}
		}
	}

	if (multipartOperation) {
		const binaryPropertyParameterName = scopedOperationName(
			'multipart_binary_property',
			operation.id,
		);
		const rawBinaryProperty = this.getNodeParameter(binaryPropertyParameterName, itemIndex, '');
		const binaryBodyProperty = String(rawBinaryProperty ?? '').trim();

		if (binaryFieldDefinition && !binaryBodyProperty) {
			throw new NodeOperationError(
				this.getNode(),
				`Missing binary property for multipart field "${binaryFieldDefinition.name}".`,
				{
					itemIndex,
				},
			);
		}

		const multipartFieldNameParameterName = scopedOperationName(
			'multipart_file_field_name',
			operation.id,
		);
		const rawMultipartFieldName = this.getNodeParameter(
			multipartFieldNameParameterName,
			itemIndex,
			binaryFieldDefinition?.name ?? 'file',
		);
		const multipartFileFieldName =
			String(rawMultipartFieldName ?? '').trim() || binaryFieldDefinition?.name || 'file';

		if (Object.keys(body).length === 0 && !binaryFieldDefinition) {
			if (operation.requestBodyRequired) {
				return {};
			}
			return undefined;
		}

		return await buildBody.call(
			this,
			itemIndex,
			'multipart',
			'{}',
			'',
			binaryBodyProperty,
			multipartFileFieldName,
			body,
		);
	}

	if (Object.keys(body).length === 0) {
		if (operation.requestBodyRequired) {
			return {};
		}
		return undefined;
	}

	return body;
}

async function collectLegacyRequestBody(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<unknown> {
	const legacyBodyMode = this.getNodeParameter('bodyMode', itemIndex, 'none') as BodyMode;
	if (legacyBodyMode === 'none') {
		return undefined;
	}
	const legacyJsonBody = this.getNodeParameter('jsonBody', itemIndex, '{}');
	const legacyRawBody = this.getNodeParameter('rawBody', itemIndex, '') as string;
	const legacyBinaryBodyProperty = this.getNodeParameter('binaryBodyProperty', itemIndex, 'data') as string;
	const legacyMultipartFileFieldName = this.getNodeParameter(
		'multipartFileFieldName',
		itemIndex,
		'file',
	) as string;
	const legacyMultipartFields =
		legacyBodyMode === 'multipart'
			? parseJsonObject(
					this.getNode(),
					this.getNodeParameter('multipartFields', itemIndex, '{}'),
					'multipartFields',
					itemIndex,
				)
			: {};

	return buildBody.call(
		this,
		itemIndex,
		legacyBodyMode,
		legacyJsonBody,
		legacyRawBody,
		legacyBinaryBodyProperty,
		legacyMultipartFileFieldName,
		legacyMultipartFields,
	);
}

async function collectManualOverrideRequestBody(
	this: IExecuteFunctions,
	itemIndex: number,
	bodyModeOverride: BodyMode,
): Promise<unknown> {
	if (bodyModeOverride === 'none') {
		return undefined;
	}
	const manualJsonBody = this.getNodeParameter('manualJsonBody', itemIndex, '{}');
	const manualRawBody = this.getNodeParameter('manualRawBody', itemIndex, '') as string;
	const manualBinaryBodyProperty = this.getNodeParameter(
		'manualBinaryBodyProperty',
		itemIndex,
		'data',
	) as string;
	const manualMultipartFileFieldName = this.getNodeParameter(
		'manualMultipartFileFieldName',
		itemIndex,
		'file',
	) as string;
	const manualMultipartFields =
		bodyModeOverride === 'multipart'
			? parseJsonObject(
					this.getNode(),
					this.getNodeParameter('manualMultipartFields', itemIndex, '{}'),
					'manualMultipartFields',
					itemIndex,
				)
			: {};

	return buildBody.call(
		this,
		itemIndex,
		bodyModeOverride,
		manualJsonBody,
		manualRawBody,
		manualBinaryBodyProperty,
		manualMultipartFileFieldName,
		manualMultipartFields,
	);
}

function readObjectPath(source: IDataObject, path: string): unknown {
	const segments = path.split('.');
	let current: unknown = source;
	for (const segment of segments) {
		if (!isObject(current)) {
			return undefined;
		}
		current = current[segment];
	}
	return current;
}

function firstDefinedValue(source: IDataObject, paths: string[]): unknown {
	for (const path of paths) {
		const value = readObjectPath(source, path);
		if (!isValueMissing(value)) {
			return value;
		}
	}
	return undefined;
}

function ensureListSearchArray(value: unknown): IDataObject[] {
	if (Array.isArray(value)) {
		return value.filter((entry) => isObject(entry));
	}
	if (!isObject(value)) {
		return [];
	}
	const candidates = ['items', 'data', 'results', 'rows', 'stations'];
	for (const candidate of candidates) {
		const candidateValue = value[candidate];
		if (Array.isArray(candidateValue)) {
			return candidateValue.filter((entry) => isObject(entry));
		}
	}
	return [];
}

function normalizeIdValue(value: unknown): string | number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	return undefined;
}

function normalizeNameValue(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return undefined;
}

function matchesListSearchFilter(value: string, filter?: string): boolean {
	if (!filter || !filter.trim()) {
		return true;
	}
	return value.toLowerCase().includes(filter.trim().toLowerCase());
}

function buildListSearchResult(
	entries: IDataObject[],
	filter: string | undefined,
	idPaths: string[],
	namePaths: string[],
	urlBuilder?: (entry: IDataObject, value: string | number) => string | undefined,
): INodeListSearchResult {
	const results: INodeListSearchItems[] = [];
	for (const entry of entries) {
		const idValue = normalizeIdValue(firstDefinedValue(entry, idPaths));
		if (idValue === undefined) {
			continue;
		}
		const fallbackName = `${idValue}`;
		const nameValue = normalizeNameValue(firstDefinedValue(entry, namePaths)) ?? fallbackName;
		if (!matchesListSearchFilter(nameValue, filter)) {
			continue;
		}
		const result: INodeListSearchItems = {
			name: nameValue,
			value: idValue,
		};
		const url = urlBuilder?.(entry, idValue);
		if (url) {
			result.url = url;
		}
		results.push(result);
	}
	return { results };
}

async function azuraCastListSearchRequest(
	this: ILoadOptionsFunctions,
	endpoint: string,
	qs?: IDataObject,
): Promise<IDataObject[]> {
	const credentialData = await this.getCredentials(credentialTypeName);
	const credentialBaseUrl = String(credentialData?.baseUrl ?? '');
	const apiBaseUrl = normalizeApiBaseUrl(credentialBaseUrl);
	if (!apiBaseUrl) {
		return [];
	}
	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${apiBaseUrl}${endpoint}`,
		json: true,
	};
	if (qs && Object.keys(qs).length > 0) {
		requestOptions.qs = qs;
	}
	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		credentialTypeName,
		requestOptions,
	);
	return ensureListSearchArray(response);
}

function getCurrentOperationForListSearch(this: ILoadOptionsFunctions): string {
	try {
		const value = this.getCurrentNodeParameter('operation');
		return String(value ?? '').trim();
	} catch {
		return '';
	}
}

function getCurrentPathParameterForListSearch(
	this: ILoadOptionsFunctions,
	fieldName: string,
): string {
	const operationId = getCurrentOperationForListSearch.call(this);
	if (!operationId) {
		return '';
	}
	const parameterName = scopedFieldName('path', operationId, fieldName);
	try {
		const value = this.getCurrentNodeParameter(parameterName, {
			extractValue: true,
		});
		return String(extractResourceLocatorValue(value) ?? '').trim();
	} catch {
		return '';
	}
}

function getStationIdForListSearch(this: ILoadOptionsFunctions): string {
	return getCurrentPathParameterForListSearch.call(this, 'station_id');
}

function getPodcastIdForListSearch(this: ILoadOptionsFunctions): string {
	return getCurrentPathParameterForListSearch.call(this, 'podcast_id');
}

function getStreamerIdForListSearch(this: ILoadOptionsFunctions): string {
	return getCurrentPathParameterForListSearch.call(this, 'id');
}

export async function searchStations(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/stations');
		return buildListSearchResult(entries, filter, ['id', 'station.id'], ['name', 'short_name', 'station.name']);
	} catch {
		return { results: [] };
	}
}

export async function searchAdminStations(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/admin/stations');
		return buildListSearchResult(entries, filter, ['id'], ['name', 'short_name']);
	} catch {
		return { results: [] };
	}
}

export async function searchPlaylists(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/playlists`);
		return buildListSearchResult(entries, filter, ['id'], ['name']);
	} catch {
		return { results: [] };
	}
}

export async function searchMedia(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/files`);
		return buildListSearchResult(
			entries,
			filter,
			['id', 'media_id', 'song_id'],
			['path', 'title', 'text', 'song.title'],
		);
	} catch {
		return { results: [] };
	}
}

export async function searchPodcasts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/podcasts`);
		return buildListSearchResult(entries, filter, ['id'], ['title', 'name']);
	} catch {
		return { results: [] };
	}
}

export async function searchEpisodes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		const podcastId = getPodcastIdForListSearch.call(this);
		if (!stationId || !podcastId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(
			this,
			`/station/${encodeURIComponent(stationId)}/podcast/${encodeURIComponent(podcastId)}/episodes`,
		);
		return buildListSearchResult(entries, filter, ['id'], ['title', 'name']);
	} catch {
		return { results: [] };
	}
}

export async function searchWebhooks(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/webhooks`);
		return buildListSearchResult(entries, filter, ['id'], ['name', 'url']);
	} catch {
		return { results: [] };
	}
}

export async function searchStreamers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/streamers`);
		return buildListSearchResult(entries, filter, ['id'], ['streamer_username', 'display_name', 'name']);
	} catch {
		return { results: [] };
	}
}

export async function searchStreamerBroadcasts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		const streamerId = getStreamerIdForListSearch.call(this);
		if (!stationId || !streamerId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(
			this,
			`/station/${encodeURIComponent(stationId)}/streamer/${encodeURIComponent(streamerId)}/broadcasts`,
		);
		return buildListSearchResult(entries, filter, ['id', 'broadcast_id'], ['name', 'text', 'recorded_at']);
	} catch {
		return { results: [] };
	}
}

export async function searchSftpUsers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/sftp-users`);
		return buildListSearchResult(entries, filter, ['id'], ['username', 'name']);
	} catch {
		return { results: [] };
	}
}

export async function searchMounts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/mounts`);
		return buildListSearchResult(entries, filter, ['id'], ['name', 'path']);
	} catch {
		return { results: [] };
	}
}

export async function searchHlsStreams(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/hls_streams`);
		return buildListSearchResult(entries, filter, ['id'], ['name']);
	} catch {
		return { results: [] };
	}
}

export async function searchRelays(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/remotes`);
		return buildListSearchResult(entries, filter, ['id'], ['display_name', 'url', 'name']);
	} catch {
		return { results: [] };
	}
}

export async function searchQueueItems(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/queue`);
		return buildListSearchResult(entries, filter, ['id'], ['media.text', 'media.title', 'song.title']);
	} catch {
		return { results: [] };
	}
}

export async function searchRequests(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const stationId = getStationIdForListSearch.call(this);
		if (!stationId) {
			return { results: [] };
		}
		const entries = await azuraCastListSearchRequest.call(this, `/station/${encodeURIComponent(stationId)}/requests`);
		return buildListSearchResult(entries, filter, ['request_id', 'id'], ['song.text', 'song.title', 'text']);
	} catch {
		return { results: [] };
	}
}

export async function searchRoles(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/admin/roles');
		return buildListSearchResult(entries, filter, ['id'], ['name']);
	} catch {
		return { results: [] };
	}
}

export async function searchUsers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/admin/users');
		return buildListSearchResult(entries, filter, ['id'], ['name', 'email', 'username']);
	} catch {
		return { results: [] };
	}
}

export async function searchCustomFields(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/admin/custom_fields');
		return buildListSearchResult(entries, filter, ['id'], ['name']);
	} catch {
		return { results: [] };
	}
}

export async function searchStorageLocations(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const entries = await azuraCastListSearchRequest.call(this, '/admin/storage_locations');
		return buildListSearchResult(entries, filter, ['id'], ['path', 'name']);
	} catch {
		return { results: [] };
	}
}

export const azuraCastListSearchMethods = {
	searchAdminStations,
	searchCustomFields,
	searchEpisodes,
	searchHlsStreams,
	searchMedia,
	searchMounts,
	searchPlaylists,
	searchPodcasts,
	searchQueueItems,
	searchRelays,
	searchRequests,
	searchRoles,
	searchSftpUsers,
	searchStations,
	searchStorageLocations,
	searchStreamerBroadcasts,
	searchStreamers,
	searchUsers,
	searchWebhooks,
};

export async function executeDomainNode(
	this: IExecuteFunctions,
	operationMap: Record<string, AzuraCastSnapshotOperation>,
	fixedOperationId?: string,
): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		let resource = '';
		let operationId = '';
		try {
			resource = this.getNodeParameter('resource', i, '') as string;
			const selectedOperation = this.getNodeParameter('operation', i, '') as string;
			const legacyOperation = this.getNodeParameter('operationId', i, '') as string;
			operationId = fixedOperationId || selectedOperation || legacyOperation;
			const operation = operationMap[operationId];
			if (!operation) {
				throw new NodeOperationError(this.getNode(), `Unsupported operation "${operationId}".`, {
					itemIndex: i,
				});
			}

			const credentialData = await this.getCredentials(credentialTypeName);
			const credentialBaseUrl = String(credentialData?.baseUrl ?? '');
			const apiBaseUrl = getBaseUrlForItem(this.getNode(), credentialBaseUrl, i);

			const pathParameters = collectPathParameters.call(this, operation, i);
			const endpoint = applyPathParameters(this.getNode(), operation.path, pathParameters, i);
			const queryParameters = collectQueryParameters.call(this, operation, i);

			const sendAdditionalHeaders = this.getNodeParameter('sendAdditionalHeaders', i, false) as boolean;
			const additionalHeaders = sendAdditionalHeaders
				? parseJsonObject(
						this.getNode(),
						this.getNodeParameter('additionalHeaders', i, '{}'),
						'additionalHeaders',
						i,
					)
				: undefined;

			const bodyModeOverride = this.getNodeParameter('bodyModeOverride', i, 'auto') as BodyModeOverride;
			let requestBody: unknown;
			if (bodyModeOverride === 'auto') {
				const legacyBodyMode = this.getNodeParameter('bodyMode', i, 'none') as BodyMode;
				const legacyJsonBody = this.getNodeParameter('jsonBody', i, '');
				const legacyRawBody = this.getNodeParameter('rawBody', i, '');
				const hasLegacyPayload =
					legacyBodyMode !== 'none' ||
					(!isValueMissing(legacyJsonBody) && String(legacyJsonBody).trim() !== '') ||
					(!isValueMissing(legacyRawBody) && String(legacyRawBody).trim() !== '');
				if (hasLegacyPayload) {
					requestBody = await collectLegacyRequestBody.call(this, i);
				} else {
					requestBody = await collectAutoRequestBody.call(this, operation, i);
				}
			} else {
				requestBody = await collectManualOverrideRequestBody.call(this, i, bodyModeOverride);
			}

			const selectedResponseFormat = this.getNodeParameter('responseFormat', i) as ResponseFormat;
			const responseFormat = determineResponseFormat(selectedResponseFormat, operation);
			const returnFullResponse = this.getNodeParameter('returnFullResponse', i) as boolean;
			const wrapResponseData = this.getNodeParameter('wrapResponseData', i, true) as boolean;
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
				credentialTypeName,
				requestOptions,
			);
			const isDeleteOperation = operation.method.toUpperCase() === 'DELETE';

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

			if (isDeleteOperation) {
				returnData.push({
					json: {
						deleted: true,
					},
					pairedItem: { item: i },
				});
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
						success: true,
						bodyLength: responseBuffer.length,
						operation: operation.id,
					},
					binary: binaryOutput,
					pairedItem: { item: i },
				});
				continue;
			}

			if (responseFormat === 'text') {
				if (wrapResponseData) {
					returnData.push({
						json: {
							success: true,
							data: String(responseData ?? ''),
							operation: operation.id,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				for (const outputItem of toOutputJsonItems(String(responseData ?? ''))) {
					returnData.push({
						json: outputItem,
						pairedItem: { item: i },
					});
				}
				continue;
			}

			if (wrapResponseData) {
				returnData.push({
					json: {
						success: true,
						data: responseData as IDataObject,
						operation: operation.id,
					},
					pairedItem: { item: i },
				});
				continue;
			}

			for (const outputItem of toOutputJsonItems(responseData)) {
				returnData.push({
					json: outputItem,
					pairedItem: { item: i },
				});
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: buildContinueOnFailOutput(error, i, operationId, resource),
					pairedItem: { item: i },
				});
				continue;
			}
			if (error instanceof NodeApiError || error instanceof NodeOperationError) {
				throw error;
			}
			throw new NodeApiError(this.getNode(), toNodeApiErrorBody(error), {
				itemIndex: i,
			});
		}
	}

	return [returnData];
}

export async function executeOperationById(
	this: IExecuteFunctions,
	operationId: string,
): Promise<INodeExecutionData[][]> {
	return executeDomainNode.call(this, snapshot.operationMap, operationId);
}

export async function executeSelectedOperation(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	return executeDomainNode.call(this, snapshot.operationMap);
}
