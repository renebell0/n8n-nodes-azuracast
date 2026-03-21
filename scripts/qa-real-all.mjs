import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const snapshotPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.openapi.snapshot.json');
const domainsPath = path.join(projectRoot, 'nodes', 'AzuraCast', 'azuracast.domains.json');
const reportDir = path.join(projectRoot, 'tmp-job-log');

function normalizeApiBaseUrl(baseUrl) {
	const normalized = String(baseUrl ?? '').trim().replace(/\/+$/, '');
	if (!normalized) {
		return '';
	}
	if (normalized.endsWith('/api')) {
		return normalized;
	}
	return `${normalized}/api`;
}

function sanitizeNameSegment(value) {
	return String(value ?? '')
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

function scopedFieldName(scope, operationId, fieldName) {
	return `${scope}__${sanitizeNameSegment(operationId)}__${sanitizeNameSegment(fieldName)}`;
}

function scopedOperationName(scope, operationId) {
	return `${scope}__${sanitizeNameSegment(operationId)}`;
}

function toNumberOrUndefined(value) {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) {
		return undefined;
	}
	return numeric;
}

function parseStatusCode(error) {
	if (!error) {
		return undefined;
	}
	if (typeof error.statusCode === 'number') {
		return error.statusCode;
	}
	const message = String(error.message ?? '');
	const match = message.match(/HTTP\s+(\d{3})/i);
	if (!match) {
		return undefined;
	}
	return toNumberOrUndefined(match[1]);
}

function serializeErrorBody(error) {
	if (!error || error.responseBody === undefined) {
		return '';
	}
	try {
		if (typeof error.responseBody === 'string') {
			return error.responseBody.slice(0, 500);
		}
		return JSON.stringify(error.responseBody).slice(0, 500);
	} catch {
		return '';
	}
}

function isObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIdLikeFieldName(fieldName) {
	const normalized = String(fieldName ?? '').toLowerCase();
	return (
		normalized === 'id' ||
		normalized.endsWith('_id') ||
		normalized.includes('id_') ||
		normalized.includes('_id_')
	);
}

function safeString(value) {
	return String(value ?? '').trim();
}

function toArray(value) {
	return Array.isArray(value) ? value : [];
}

function pickFirstId(entries) {
	for (const entry of toArray(entries)) {
		if (!isObject(entry)) {
			continue;
		}
		if (entry.id !== undefined && entry.id !== null && entry.id !== '') {
			return entry.id;
		}
	}
	return undefined;
}

function pickFirstStation(stations) {
	for (const station of toArray(stations)) {
		if (!isObject(station)) {
			continue;
		}
		const id = station.id ?? station.station_id;
		const shortcode = station.shortcode ?? station.short_name;
		if (id !== undefined && id !== null && id !== '') {
			return {
				id,
				shortcode: shortcode ?? '',
				name: station.name ?? '',
			};
		}
	}
	return undefined;
}

function inferEntityTokenFromPath(operationPath, fieldName) {
	const normalizedFieldName = String(fieldName ?? '').trim().toLowerCase();
	const pathTokens = String(operationPath ?? '')
		.split('/')
		.filter((token) => token.length > 0);
	const fieldToken = `{${normalizedFieldName}}`;
	for (let index = 0; index < pathTokens.length; index += 1) {
		if (pathTokens[index].toLowerCase() !== fieldToken) {
			continue;
		}
		if (index === 0) {
			return '';
		}
		return pathTokens[index - 1].replace(/[{}]/g, '').toLowerCase();
	}
	return '';
}

function defaultFieldValue(fieldDefinition, operation) {
	const type = safeString(fieldDefinition?.type).toLowerCase();
	const fieldName = safeString(fieldDefinition?.name).toLowerCase();
	const enumValues = Array.isArray(fieldDefinition?.enumValues) ? fieldDefinition.enumValues : [];
	if (enumValues.length > 0) {
		return enumValues[0];
	}
	if (type === 'number' || type === 'integer') {
		if (isIdLikeFieldName(fieldName)) {
			return operation.method === 'GET' ? 1 : -999999;
		}
		return 1;
	}
	if (type === 'boolean') {
		return false;
	}
	if (type === 'json' || type === 'object') {
		return {};
	}
	if (fieldName.includes('email')) {
		return 'qa@example.com';
	}
	if (fieldName.includes('password')) {
		return 'qa-password';
	}
	if (fieldName.includes('url')) {
		return 'https://example.com';
	}
	if (fieldName.includes('date') || fieldName.includes('time')) {
		return '2026-03-21T00:00:00Z';
	}
	if (fieldName.includes('name')) {
		return 'QA';
	}
	if (fieldName.includes('description')) {
		return 'QA';
	}
	if (isIdLikeFieldName(fieldName)) {
		return operation.method === 'GET' ? '1' : '-999999';
	}
	return 'qa';
}

function createBinaryInputItem() {
	return {
		json: {},
		binary: {
			data: {
				data: Buffer.from('qa-binary').toString('base64'),
				fileName: 'qa.bin',
				mimeType: 'application/octet-stream',
			},
		},
	};
}

async function runHttpRequest(options, injectedHeaders = {}) {
	const url = new URL(options.url);
	if (options.qs && isObject(options.qs)) {
		for (const [key, value] of Object.entries(options.qs)) {
			if (value === undefined || value === null) {
				continue;
			}
			url.searchParams.set(key, String(value));
		}
	}

	const headers = { ...(options.headers ?? {}), ...injectedHeaders };
	let body = options.body;
	const shouldSerializeJson =
		options.json &&
		body !== undefined &&
		body !== null &&
		typeof body !== 'string' &&
		!(body instanceof Buffer) &&
		!(body instanceof URLSearchParams) &&
		!(body instanceof FormData);

	if (shouldSerializeJson) {
		body = JSON.stringify(body);
		if (!headers['content-type'] && !headers['Content-Type']) {
			headers['content-type'] = 'application/json';
		}
	}

	const response = await fetch(url, {
		method: options.method ?? 'GET',
		headers,
		body,
	});

	const responseBuffer = Buffer.from(await response.arrayBuffer());
	let parsedBody;
	if (options.encoding === 'arraybuffer') {
		parsedBody = responseBuffer;
	} else if (options.json !== false) {
		try {
			parsedBody = JSON.parse(responseBuffer.toString('utf8'));
		} catch {
			parsedBody = responseBuffer.toString('utf8');
		}
	} else {
		parsedBody = responseBuffer.toString('utf8');
	}

	if (!response.ok && !options.ignoreHttpStatusErrors) {
		const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
		error.statusCode = response.status;
		error.responseBody = parsedBody;
		throw error;
	}

	if (options.returnFullResponse) {
		return {
			body: parsedBody,
			headers: Object.fromEntries(response.headers.entries()),
			statusCode: response.status,
			statusMessage: response.statusText,
		};
	}

	return parsedBody;
}

function createExecutionContext(params, credentials, authHeaders, inputItem) {
	const item = inputItem ?? { json: {} };
	return {
		getInputData: () => [item],
		getNodeParameter: (name, _itemIndex, fallbackValue) =>
			Object.prototype.hasOwnProperty.call(params, name) ? params[name] : fallbackValue,
		getCredentials: async () => credentials,
		getNode: () => ({ name: 'AzuraCast' }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (_credentialType, options) =>
				runHttpRequest(options, authHeaders),
			returnJsonArray: (data) => data.map((entry) => ({ json: entry })),
			getBinaryDataBuffer: async (_itemIndex, propertyName) => {
				const binaryValue = item.binary?.[propertyName];
				if (!binaryValue?.data) {
					throw new Error(`Missing binary property: ${propertyName}`);
				}
				return Buffer.from(binaryValue.data, 'base64');
			},
			assertBinaryData: (_itemIndex, propertyName) => {
				const binaryValue = item.binary?.[propertyName];
				if (!binaryValue) {
					throw new Error(`Missing binary property: ${propertyName}`);
				}
				return binaryValue;
			},
			prepareBinaryData: async (binaryData, filePath, mimeType) => ({
				data: Buffer.isBuffer(binaryData)
					? binaryData.toString('base64')
					: Buffer.from(binaryData).toString('base64'),
				fileName: filePath ? path.basename(filePath) : 'file.bin',
				mimeType: mimeType ?? 'application/octet-stream',
			}),
		},
	};
}

function createLoadOptionsContext(currentParameters, credentials, authHeaders) {
	return {
		getCredentials: async () => credentials,
		getCurrentNodeParameter: (name, options = {}) => {
			const value = currentParameters[name];
			if (
				options.extractValue &&
				value &&
				typeof value === 'object' &&
				Object.prototype.hasOwnProperty.call(value, 'value')
			) {
				return value.value;
			}
			return value;
		},
		helpers: {
			httpRequestWithAuthentication: async (_credentialType, options) =>
				runHttpRequest(options, authHeaders),
		},
	};
}

async function directRequest(url, headers = {}) {
	try {
		const response = await fetch(url, { method: 'GET', headers });
		const text = await response.text();
		let body = text;
		try {
			body = JSON.parse(text);
		} catch {}
		return {
			ok: response.ok,
			status: response.status,
			body,
		};
	} catch (error) {
		return {
			ok: false,
			status: 0,
			error: String(error?.message ?? error),
		};
	}
}

function pickFromMapping(mapping, key) {
	if (!Object.prototype.hasOwnProperty.call(mapping, key)) {
		return undefined;
	}
	const value = mapping[key];
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	return value;
}

function resolvePathParameterValue(operation, fieldDefinition, samples) {
	const fieldName = safeString(fieldDefinition.name).toLowerCase();
	const method = safeString(operation.method).toUpperCase();
	const mutating = method !== 'GET';

	const invalidNumber = -999999;
	const invalidString = 'qa-missing';

	const forMutating = (fallbackValidValue) => {
		if (!mutating) {
			return fallbackValidValue;
		}
		if (typeof fallbackValidValue === 'number') {
			return invalidNumber;
		}
		if (fallbackValidValue !== undefined && fallbackValidValue !== null && fallbackValidValue !== '') {
			return invalidString;
		}
		if (safeString(fieldDefinition.type).toLowerCase() === 'number') {
			return invalidNumber;
		}
		return invalidString;
	};

	const directMapping = {
		station_id: samples.stationId,
		station_shortcode: samples.stationShortcode,
		media_id: samples.mediaId,
		song_id: samples.mediaId,
		playlist_id: samples.playlistId,
		podcast_id: samples.podcastId,
		episode_id: samples.episodeId,
		request_id: samples.requestId,
		webhook_id: samples.webhookId,
		streamer_id: samples.streamerId,
		sftp_user_id: samples.sftpUserId,
		mount_id: samples.mountId,
		hls_stream_id: samples.hlsStreamId,
		remote_id: samples.remoteId,
		backup_id: samples.backupId,
		role_id: samples.roleId,
		user_id: samples.userId,
		custom_field_id: samples.customFieldId,
		storage_location_id: samples.storageLocationId,
		broadcast_id: samples.broadcastId,
	};

	if (Object.prototype.hasOwnProperty.call(directMapping, fieldName)) {
		const direct = pickFromMapping(directMapping, fieldName);
		if (direct !== undefined) {
			return forMutating(direct);
		}
		if (!mutating) {
			return undefined;
		}
	}

	if (fieldName === 'id') {
		const token = inferEntityTokenFromPath(operation.path, fieldDefinition.name);
		const tokenMap = {
			playlist: samples.playlistId,
			playlists: samples.playlistId,
			file: samples.mediaId,
			files: samples.mediaId,
			media: samples.mediaId,
			podcast: samples.podcastId,
			episode: samples.episodeId,
			request: samples.requestId,
			requests: samples.requestId,
			webhook: samples.webhookId,
			webhooks: samples.webhookId,
			streamer: samples.streamerId,
			'streamers': samples.streamerId,
			'sftp-user': samples.sftpUserId,
			'sftp-users': samples.sftpUserId,
			mount: samples.mountId,
			mounts: samples.mountId,
			hls_stream: samples.hlsStreamId,
			hls_streams: samples.hlsStreamId,
			remote: samples.remoteId,
			remotes: samples.remoteId,
			backup: samples.backupId,
			backups: samples.backupId,
			role: samples.roleId,
			roles: samples.roleId,
			user: samples.userId,
			users: samples.userId,
			custom_field: samples.customFieldId,
			custom_fields: samples.customFieldId,
			storage_location: samples.storageLocationId,
			storage_locations: samples.storageLocationId,
			broadcast: samples.broadcastId,
			queue: samples.queueItemId,
		};
		const inferred = pickFromMapping(tokenMap, token);
		if (inferred !== undefined) {
			return forMutating(inferred);
		}
		if (!mutating) {
			return undefined;
		}
	}

	if (fieldName.includes('station')) {
		if (fieldName.includes('shortcode')) {
			return forMutating(samples.stationShortcode);
		}
		return forMutating(samples.stationId);
	}

	if (fieldName.includes('shortcode')) {
		return forMutating(samples.stationShortcode);
	}

	if (fieldName.includes('slug') || fieldName.includes('code') || fieldName.includes('name')) {
		return forMutating('qa');
	}

	if (!mutating && ['path', 'key', 'type', 'format', 'token'].includes(fieldName)) {
		return undefined;
	}

	if (safeString(fieldDefinition.type).toLowerCase() === 'number' || isIdLikeFieldName(fieldName)) {
		if (!mutating) {
			return undefined;
		}
		return forMutating(1);
	}

	return forMutating('qa');
}

function getRequiredOperationFields(operation, key) {
	const definitions = Array.isArray(operation[key]) ? operation[key] : [];
	return definitions.filter((fieldDefinition) => fieldDefinition?.required);
}

function summarizeOutput(output) {
	if (!Array.isArray(output) || output.length === 0 || !Array.isArray(output[0])) {
		return {
			itemCount: 0,
			firstKeys: [],
		};
	}
	const firstItem = output[0][0];
	const firstJson = isObject(firstItem?.json) ? firstItem.json : {};
	return {
		itemCount: output[0].length,
		firstKeys: Object.keys(firstJson).slice(0, 8),
		hasBinary: Boolean(firstItem?.binary),
	};
}

function pickListSearchOperation(operationList, requiredFields) {
	const requiredSet = new Set(requiredFields);
	for (const operation of operationList) {
		const names = new Set(
			toArray(operation.pathParameterDefinitions).map((field) => safeString(field?.name)),
		);
		let valid = true;
		for (const fieldName of requiredSet) {
			if (!names.has(fieldName)) {
				valid = false;
				break;
			}
		}
		if (valid) {
			return operation.id;
		}
	}
	return operationList[0]?.id ?? '';
}

async function main() {
	const baseUrlRaw = process.env.AZURACAST_BASE_URL ?? '';
	const apiKey = process.env.AZURACAST_API_KEY ?? '';
	const apiBaseUrl = normalizeApiBaseUrl(baseUrlRaw);
	const siteBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;

	if (!apiBaseUrl) {
		throw new Error('Missing AZURACAST_BASE_URL environment variable.');
	}
	if (!apiKey) {
		throw new Error('Missing AZURACAST_API_KEY environment variable.');
	}

	await fs.mkdir(reportDir, { recursive: true });

	const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
	const domainsManifest = JSON.parse(await fs.readFile(domainsPath, 'utf8'));
	const operations = toArray(snapshot.operations);

	const operationToResource = new Map();
	for (const domain of toArray(domainsManifest.domains)) {
		const resourceValue = safeString(domain.resourceValue);
		for (const operationId of toArray(domain.operationIds)) {
			operationToResource.set(String(operationId), resourceValue);
		}
	}

	const authHeaders = {
		Authorization: `Bearer ${apiKey}`,
		'X-API-Key': apiKey,
	};
	const credentials = {
		baseUrl: siteBaseUrl,
		apiKey,
	};

	const { AzuraCast } = await import(
		pathToFileURL(path.join(projectRoot, 'dist', 'nodes', 'AzuraCast', 'index.js')).href
	);
	const azuraCastNode = new AzuraCast();

	const discoveryRequests = [];

	async function readList(name, endpoint, useAuth = true) {
		const requestUrl = `${apiBaseUrl}${endpoint}`;
		const response = await directRequest(requestUrl, useAuth ? authHeaders : {});
		discoveryRequests.push({
			name,
			endpoint,
			ok: response.ok,
			status: response.status,
			size: Array.isArray(response.body)
				? response.body.length
				: isObject(response.body)
					? Object.keys(response.body).length
					: 0,
		});
		if (!response.ok) {
			return [];
		}
		return Array.isArray(response.body) ? response.body : [];
	}

	const stations = await readList('stations', '/stations', false);
	const adminStations = await readList('adminStations', '/admin/stations', true);
	const users = await readList('users', '/admin/users', true);
	const roles = await readList('roles', '/admin/roles', true);
	const customFields = await readList('customFields', '/admin/custom_fields', true);
	const storageLocations = await readList('storageLocations', '/admin/storage_locations', true);
	const backups = await readList('backups', '/admin/backups', true);

	const station = pickFirstStation(adminStations) ?? pickFirstStation(stations) ?? { id: '', shortcode: '' };
	const stationId = station.id !== undefined && station.id !== null ? station.id : '';
	const stationShortcode = safeString(station.shortcode) || safeString(stationId);

	const stationScopedPath = stationId !== '' ? `/station/${encodeURIComponent(String(stationId))}` : '';
	const playlists = stationScopedPath ? await readList('playlists', `${stationScopedPath}/playlists`, true) : [];
	const media = stationScopedPath ? await readList('media', `${stationScopedPath}/files`, true) : [];
	const podcasts = stationScopedPath ? await readList('podcasts', `${stationScopedPath}/podcasts`, true) : [];
	const webhooks = stationScopedPath ? await readList('webhooks', `${stationScopedPath}/webhooks`, true) : [];
	const streamers = stationScopedPath ? await readList('streamers', `${stationScopedPath}/streamers`, true) : [];
	const sftpUsers = stationScopedPath ? await readList('sftpUsers', `${stationScopedPath}/sftp-users`, true) : [];
	const mounts = stationScopedPath ? await readList('mounts', `${stationScopedPath}/mounts`, true) : [];
	const hlsStreams = stationScopedPath ? await readList('hlsStreams', `${stationScopedPath}/hls_streams`, true) : [];
	const remotes = stationScopedPath ? await readList('remotes', `${stationScopedPath}/remotes`, true) : [];
	const queueItems = stationScopedPath ? await readList('queue', `${stationScopedPath}/queue`, true) : [];
	const requests = stationScopedPath ? await readList('requests', `${stationScopedPath}/requests`, false) : [];

	const podcastId = pickFirstId(podcasts);
	const episodes =
		stationScopedPath && podcastId !== undefined
			? await readList(
					'episodes',
					`${stationScopedPath}/podcast/${encodeURIComponent(String(podcastId))}/episodes`,
					true,
				)
			: [];

	const streamerId = pickFirstId(streamers);
	const broadcasts =
		stationScopedPath && streamerId !== undefined
			? await readList(
					'streamerBroadcasts',
					`${stationScopedPath}/streamer/${encodeURIComponent(String(streamerId))}/broadcasts`,
					true,
				)
			: [];

	const samples = {
		stationId,
		stationShortcode,
		playlistId: pickFirstId(playlists),
		mediaId: pickFirstId(media),
		podcastId,
		episodeId: pickFirstId(episodes),
		requestId: pickFirstId(requests),
		webhookId: pickFirstId(webhooks),
		streamerId,
		sftpUserId: pickFirstId(sftpUsers),
		mountId: pickFirstId(mounts),
		hlsStreamId: pickFirstId(hlsStreams),
		remoteId: pickFirstId(remotes),
		queueItemId: pickFirstId(queueItems),
		backupId: pickFirstId(backups),
		roleId: pickFirstId(roles),
		userId: pickFirstId(users),
		customFieldId: pickFirstId(customFields),
		storageLocationId: pickFirstId(storageLocations),
		broadcastId: pickFirstId(broadcasts),
	};

	const listSearchRequirements = {
		searchStations: [],
		searchAdminStations: [],
		searchPlaylists: ['station_id'],
		searchMedia: ['station_id'],
		searchPodcasts: ['station_id'],
		searchEpisodes: ['station_id', 'podcast_id'],
		searchWebhooks: ['station_id'],
		searchStreamers: ['station_id'],
		searchStreamerBroadcasts: ['station_id', 'id'],
		searchSftpUsers: ['station_id'],
		searchMounts: ['station_id'],
		searchHlsStreams: ['station_id'],
		searchRelays: ['station_id'],
		searchQueueItems: ['station_id'],
		searchRequests: ['station_id'],
		searchRoles: [],
		searchUsers: [],
		searchCustomFields: [],
		searchStorageLocations: [],
	};

	const listSearchResults = [];
	const listSearchMethods = azuraCastNode.methods?.listSearch ?? {};
	for (const [methodName, methodFn] of Object.entries(listSearchMethods)) {
		if (typeof methodFn !== 'function') {
			continue;
		}
		const requiredFields = listSearchRequirements[methodName] ?? [];
		const operationId = pickListSearchOperation(operations, requiredFields);
		const currentParameters = {
			operation: operationId,
		};
		for (const fieldName of requiredFields) {
			const sampleValue = resolvePathParameterValue(
				{ id: operationId, path: '', method: 'GET' },
				{ name: fieldName, type: 'string' },
				samples,
			);
			currentParameters[scopedFieldName('path', operationId, fieldName)] = {
				mode: 'id',
				value: sampleValue,
			};
		}
		try {
			const context = createLoadOptionsContext(currentParameters, credentials, authHeaders);
			const result = await methodFn.call(context, 'qa');
			listSearchResults.push({
				method: methodName,
				status: 'pass',
				resultCount: Array.isArray(result?.results) ? result.results.length : 0,
			});
		} catch (error) {
			listSearchResults.push({
				method: methodName,
				status: 'fail',
				error: String(error?.message ?? error),
			});
		}
	}

	const operationResults = [];
	const sortedOperations = [...operations].sort((a, b) => String(a.id).localeCompare(String(b.id)));

	for (const operation of sortedOperations) {
		const operationId = safeString(operation.id);
		const resourceValue = operationToResource.get(operationId) ?? '';
		if (!resourceValue) {
			operationResults.push({
				operationId,
				tag: operation.tag,
				method: operation.method,
				path: operation.path,
				status: 'skip',
				reason: 'missing_resource_mapping',
			});
			continue;
		}

		const method = safeString(operation.method).toUpperCase();
		const mutating = method !== 'GET';
		const hasPathParameters = toArray(operation.pathParameterDefinitions).length > 0;
		if (mutating && !hasPathParameters) {
			operationResults.push({
				operationId,
				tag: operation.tag,
				method,
				path: operation.path,
				status: 'skip',
				reason: 'mutating_operation_without_path_parameters',
			});
			continue;
		}

		const params = {
			resource: resourceValue,
			operation: operationId,
			sendAdditionalHeaders: false,
			responseFormat: 'auto',
			returnFullResponse: false,
			bodyModeOverride: 'auto',
		};

		let unresolvedPathField = '';
		for (const fieldDefinition of toArray(operation.pathParameterDefinitions)) {
			const value = resolvePathParameterValue(operation, fieldDefinition, samples);
			if ((value === undefined || value === null || value === '') && method === 'GET') {
				unresolvedPathField = safeString(fieldDefinition.name);
				break;
			}
			params[scopedFieldName('path', operationId, fieldDefinition.name)] = {
				mode: 'id',
				value,
			};
		}

		if (unresolvedPathField) {
			operationResults.push({
				operationId,
				tag: operation.tag,
				method,
				path: operation.path,
				status: 'skip',
				reason: `missing_sample_for_path_${unresolvedPathField}`,
			});
			continue;
		}

		for (const fieldDefinition of getRequiredOperationFields(operation, 'queryParameterDefinitions')) {
			const parameterName = scopedFieldName('query_required', operationId, fieldDefinition.name);
			params[parameterName] = defaultFieldValue(fieldDefinition, operation);
		}

		for (const fieldDefinition of getRequiredOperationFields(operation, 'requestBodyFieldDefinitions')) {
			const parameterName = scopedFieldName('body_required', operationId, fieldDefinition.name);
			params[parameterName] = defaultFieldValue(fieldDefinition, operation);
		}

		const contentTypes = toArray(operation.requestBodyContentTypes).map((value) => String(value).toLowerCase());
		const multipart = contentTypes.some((contentType) => contentType.includes('multipart/form-data'));
		const requiresBodyWithoutDefinitions =
			Boolean(operation.requestBodyRequired) &&
			toArray(operation.requestBodyFieldDefinitions).length === 0 &&
			!multipart;
		if (requiresBodyWithoutDefinitions) {
			params[scopedOperationName('body_json', operationId)] = '{}';
		}

		let inputItem = { json: {} };
		if (multipart) {
			params[scopedOperationName('multipart_binary_property', operationId)] = 'data';
			params[scopedOperationName('multipart_file_field_name', operationId)] = 'file';
			inputItem = createBinaryInputItem();
		}

		try {
			const context = createExecutionContext(params, credentials, authHeaders, inputItem);
			const output = await azuraCastNode.execute.call(context);
			operationResults.push({
				operationId,
				tag: operation.tag,
				method,
				path: operation.path,
				status: 'pass',
				summary: summarizeOutput(output),
			});
		} catch (error) {
			const statusCode = parseStatusCode(error);
			if (mutating && statusCode !== undefined && [400, 401, 403, 404, 405, 409, 422, 500].includes(statusCode)) {
				operationResults.push({
					operationId,
					tag: operation.tag,
					method,
					path: operation.path,
					status: 'pass_expected_error',
					statusCode,
					error: String(error?.message ?? error),
					errorBody: serializeErrorBody(error),
				});
			} else {
				operationResults.push({
					operationId,
					tag: operation.tag,
					method,
					path: operation.path,
					status: 'fail',
					statusCode,
					error: String(error?.message ?? error),
					errorBody: serializeErrorBody(error),
				});
			}
		}
	}

	const totals = {
		operations: operationResults.length,
		pass: operationResults.filter((result) => result.status === 'pass').length,
		passExpectedError: operationResults.filter((result) => result.status === 'pass_expected_error').length,
		fail: operationResults.filter((result) => result.status === 'fail').length,
		skip: operationResults.filter((result) => result.status === 'skip').length,
		listSearchTotal: listSearchResults.length,
		listSearchPass: listSearchResults.filter((result) => result.status === 'pass').length,
		listSearchFail: listSearchResults.filter((result) => result.status === 'fail').length,
	};

	const report = {
		timestamp: new Date().toISOString(),
		baseUrl: siteBaseUrl,
		totals,
		discovery: {
			stationId: samples.stationId,
			stationShortcode: samples.stationShortcode,
			samples,
			requests: discoveryRequests,
		},
		listSearchResults,
		operationResults,
	};

	const reportPath = path.join(reportDir, 'qa-real-all-report.json');
	await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

	process.stdout.write(`Real QA completed.\n`);
	process.stdout.write(`Report: ${reportPath}\n`);
	process.stdout.write(
		`Operations: pass=${totals.pass} pass_expected_error=${totals.passExpectedError} fail=${totals.fail} skip=${totals.skip} total=${totals.operations}\n`,
	);
	process.stdout.write(
		`List Search: pass=${totals.listSearchPass} fail=${totals.listSearchFail} total=${totals.listSearchTotal}\n`,
	);
}

await main();
