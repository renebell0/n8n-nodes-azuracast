import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const { NodeApiError } = require('n8n-workflow');

function parseBody(buffer, contentType) {
	const bodyText = buffer.toString('utf8');
	if (contentType?.includes('application/json')) {
		try {
			return JSON.parse(bodyText);
		} catch {
			return bodyText;
		}
	}
	return bodyText;
}

async function startMockServer() {
	const requests = [];

	const server = http.createServer((req, res) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => {
			const bodyBuffer = Buffer.concat(chunks);
			const requestUrl = new URL(req.url ?? '/', 'http://localhost');
			const contentType = req.headers['content-type'] ?? '';
			const parsedBody = parseBody(bodyBuffer, String(contentType));
			const apiKeyHeader = String(req.headers['x-api-key'] ?? '').trim();
			const authorizationHeader = String(req.headers.authorization ?? '').trim();
			const hasValidAuth =
				apiKeyHeader === 'test-key' || authorizationHeader === 'Bearer test-key';

			requests.push({
				method: req.method,
				pathname: requestUrl.pathname,
				headers: req.headers,
				body: parsedBody,
				rawBody: bodyBuffer,
			});

			if (req.method === 'GET' && requestUrl.pathname === '/api/status') {
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ online: true }));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/nowplaying') {
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify([{ station: { id: 1, shortcode: 'demo' } }]));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/stations') {
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify([{ id: 'demo', name: 'Demo Station' }]));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/station/demo/requests') {
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify([]));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/station/demo/playlists') {
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify([{ id: 11, name: 'Morning Playlist' }]));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/nowplaying/demo/art') {
				res.writeHead(302, { location: '/artwork/demo.jpg' });
				res.end();
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/artwork/demo.jpg') {
				res.writeHead(200, { 'content-type': 'image/jpeg' });
				res.end(Buffer.from('JPEGDATA'));
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/station/demo/webhooks') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ created: true, body: parsedBody }));
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/admin/send-test-message') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const emailAddress =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.email ?? '').trim()
						: '';
				if (!emailAddress) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(
						JSON.stringify({
							error: 'Email "" does not comply with addr-spec of RFC 2822.',
						}),
					);
					return;
				}
				if (!/.+@.+\..+/.test(emailAddress)) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(
						JSON.stringify({
							error: 'Email address is invalid.',
						}),
					);
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, message: 'Test message sent successfully.' }));
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/station/demo/files/mkdir') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const directoryName =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.name ?? '').trim()
						: '';
				if (!directoryName) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'No directory specified' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/station/demo/files/rename') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const fromPath =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.file ?? '').trim()
						: '';
				const toPath =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.newPath ?? '').trim()
						: '';
				if (!fromPath || !toPath) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'File not specified.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/admin/debug/station/demo/telnet') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const commandValue =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.command ?? '').trim()
						: '';
				if (!commandValue) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Command is required.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, command: commandValue }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/station/demo/playlist/11/order') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const orderValue =
					parsedBody && typeof parsedBody === 'object' && Array.isArray(parsedBody.order)
						? parsedBody.order
						: null;
				if (!orderValue) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Order is required.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify(orderValue));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/station/demo/files/batch') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const batchAction =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.do ?? '').trim()
						: '';
				if (!batchAction) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid batch action specified.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, action: batchAction }));
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/admin/backups/run') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(
					JSON.stringify({
						success: true,
						storage_location:
							parsedBody && typeof parsedBody === 'object'
								? parsedBody.storage_location ?? null
								: null,
					}),
				);
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/station/demo/waveform/1') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const hasWaveformData =
					parsedBody &&
					typeof parsedBody === 'object' &&
					parsedBody.data !== undefined &&
					parsedBody.data !== null;
				if (!hasWaveformData) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'No waveform data provided.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, cached: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/frontend/account/two-factor') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const otpValue =
					parsedBody && typeof parsedBody === 'object'
						? String(parsedBody.otp ?? '').trim()
						: '';
				res.writeHead(200, { 'content-type': 'application/json' });
				if (!otpValue) {
					res.end(
						JSON.stringify({
							secret: 'GENERATEDSECRET',
							totp_uri: 'otpauth://totp/AzuraCast:test?secret=GENERATEDSECRET',
						}),
					);
					return;
				}
				res.end(JSON.stringify({ success: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/frontend/account/webauthn/register') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				const createResponse =
					parsedBody && typeof parsedBody === 'object' && parsedBody.createResponse
						? parsedBody.createResponse
						: null;
				const hasRequiredFields =
					createResponse &&
					typeof createResponse === 'object' &&
					String(createResponse.clientDataJSON ?? '').trim() !== '' &&
					String(createResponse.attestationObject ?? '').trim() !== '';
				if (!hasRequiredFields) {
					res.writeHead(400, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid WebAuthn payload.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/frontend/account/me') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, updated: true, body: parsedBody }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/station/demo/liquidsoap-config') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ success: true, updated: true }));
				return;
			}

			if (req.method === 'PUT' && requestUrl.pathname === '/api/station/demo/playlist/11/apply-to') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(
					JSON.stringify({
						success: true,
						directories:
							parsedBody && typeof parsedBody === 'object' && Array.isArray(parsedBody.directories)
								? parsedBody.directories
								: [],
					}),
				);
				return;
			}

			if (req.method === 'DELETE' && requestUrl.pathname === '/api/station/demo/webhook/1') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(204);
				res.end();
				return;
			}

			if (req.method === 'POST' && requestUrl.pathname === '/api/station/demo/files/upload') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ uploaded: true }));
				return;
			}

			if (req.method === 'GET' && requestUrl.pathname === '/api/station/demo/file/1/play') {
				if (!hasValidAuth) {
					res.writeHead(401, { 'content-type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'audio/mpeg' });
				res.end(Buffer.from('FAKEAUDIO'));
				return;
			}

			res.writeHead(404, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ error: 'Not found' }));
		});
	});

	await new Promise((resolve) => server.listen(0, resolve));
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : 0;

	return {
		server,
		requests,
		baseUrl: `http://127.0.0.1:${port}`,
		close: async () => {
			await new Promise((resolve) => server.close(resolve));
		},
	};
}

async function runHttpRequest(options, injectedHeaders = {}) {
	const url = new URL(options.url);
	if (options.qs && typeof options.qs === 'object') {
		for (const [key, value] of Object.entries(options.qs)) {
			if (value === undefined || value === null) {
				continue;
			}
			url.searchParams.set(key, String(value));
		}
	}

	const headers = { ...(options.headers ?? {}), ...injectedHeaders };
	let body = options.body;
	const hasJsonBody =
		options.json &&
		body !== undefined &&
		body !== null &&
		typeof body !== 'string' &&
		!(body instanceof Buffer) &&
		!(body instanceof URLSearchParams) &&
		!(body instanceof FormData);

	if (hasJsonBody) {
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

	const buffer = Buffer.from(await response.arrayBuffer());
	let parsedBody;
	if (options.encoding === 'arraybuffer') {
		parsedBody = buffer;
	} else if (options.json !== false) {
		try {
			parsedBody = JSON.parse(buffer.toString('utf8'));
		} catch {
			parsedBody = buffer.toString('utf8');
		}
	} else {
		parsedBody = buffer.toString('utf8');
	}

	if (!response.ok && !options.ignoreHttpStatusErrors) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

function createExecutionContext(params, credentials, inputItems, executionOptions = {}) {
	const resolvedInputItems = Array.isArray(inputItems) ? inputItems : [inputItems ?? { json: {} }];
	const parametersByItem = Array.isArray(params) ? params : [params];
	const apiKey = String(credentials.apiKey ?? '').trim();
	const authHeaders = apiKey
		? {
				'X-API-Key': apiKey,
				Authorization: `Bearer ${apiKey}`,
			}
		: {};
	return {
		getInputData: () => resolvedInputItems,
		getNodeParameter: (name, itemIndex, fallbackValue) => {
			const scopedParameters = parametersByItem[itemIndex] ?? parametersByItem[0] ?? {};
			return Object.prototype.hasOwnProperty.call(scopedParameters, name)
				? scopedParameters[name]
				: fallbackValue;
		},
		getCredentials: async () => credentials,
		getNode: () => ({ name: 'AzuraCast' }),
		continueOnFail: () => Boolean(executionOptions.continueOnFail),
		helpers: {
			httpRequest: async (options) => runHttpRequest(options),
			httpRequestWithAuthentication: async (_credentialType, options) =>
				runHttpRequest(options, authHeaders),
			returnJsonArray: (data) => data.map((entry) => ({ json: entry })),
			getBinaryDataBuffer: async (itemIndex, propertyName) => {
				const binary = resolvedInputItems[itemIndex]?.binary?.[propertyName];
				if (!binary?.data) {
					throw new Error(`Missing binary property: ${propertyName}`);
				}
				return Buffer.from(binary.data, 'base64');
			},
			assertBinaryData: (itemIndex, propertyName) => {
				const binary = resolvedInputItems[itemIndex]?.binary?.[propertyName];
				if (!binary) {
					throw new Error(`Missing binary property: ${propertyName}`);
				}
				return binary;
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

function createLoadOptionsContext(currentParameters, credentials) {
	const apiKey = String(credentials.apiKey ?? '').trim();
	const authHeaders = apiKey
		? {
				'X-API-Key': apiKey,
				Authorization: `Bearer ${apiKey}`,
			}
		: {};

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

function sanitizeNameSegment(value) {
	return value
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

function buildOperationResourceMap() {
	const snapshotPath = path.join(
		projectRoot,
		'nodes',
		'AzuraCast',
		'azuracast.openapi.snapshot.json',
	);
	const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
	const map = new Map();
	for (const operation of snapshot.operations ?? []) {
		const operationId = String(operation.id ?? '').trim();
		const tag = String(operation.tag ?? 'General').trim();
		if (!operationId) {
			continue;
		}
		map.set(operationId, `resource_${sanitizeNameSegment(tag)}`);
	}
	return map;
}

async function main() {
	const { AzuraCast } = await import(
		pathToFileURL(path.join(projectRoot, 'dist', 'nodes', 'AzuraCast', 'index.js')).href
	);
	const operationResourceMap = buildOperationResourceMap();
	const getResource = (operationId) => operationResourceMap.get(operationId) ?? 'resource_general';

	const mock = await startMockServer();
	const credentials = {
		baseUrl: mock.baseUrl,
		apiKey: 'test-key',
	};
	const publicCredentials = {
		baseUrl: mock.baseUrl,
		apiKey: '',
	};

	try {
		const azuraCastNode = new AzuraCast();

		const stationListSearchContext = createLoadOptionsContext(
			{ operation: 'getStations' },
			credentials,
		);
		const stationListSearchResult = await azuraCastNode.methods.listSearch.searchStations.call(
			stationListSearchContext,
			'demo',
		);
		assert.equal(stationListSearchResult.results.length, 1);
		assert.equal(stationListSearchResult.results[0].value, 'demo');

		const playlistListSearchContext = createLoadOptionsContext(
			{
				operation: 'getPlaylist',
				path__getplaylist__station_id: { mode: 'list', value: 'demo' },
			},
			credentials,
		);
		const playlistListSearchResult =
			await azuraCastNode.methods.listSearch.searchPlaylists.call(
				playlistListSearchContext,
				'morning',
			);
		assert.equal(playlistListSearchResult.results.length, 1);
		assert.equal(playlistListSearchResult.results[0].value, 11);

		const statusContext = createExecutionContext(
			{
				resource: getResource('getStatus'),
				operation: 'getStatus',
				pathParameters: '{}',
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			credentials,
		);
		const statusResult = await azuraCastNode.execute.call(statusContext);
		assert.equal(statusResult[0][0].json.success, true);
		assert.equal(statusResult[0][0].json.data.online, true);

		const perItemOperationContext = createExecutionContext(
			[
				{
					resource: getResource('getStatus'),
					operation: 'getStatus',
					pathParameters: '{}',
					sendQueryParameters: false,
					bodyMode: 'none',
					sendAdditionalHeaders: false,
					responseFormat: 'json',
					returnFullResponse: false,
				},
				{
					resource: getResource('getStations'),
					operation: 'getStations',
					pathParameters: '{}',
					sendQueryParameters: false,
					bodyMode: 'none',
					sendAdditionalHeaders: false,
					responseFormat: 'json',
					returnFullResponse: false,
				},
			],
			credentials,
			[{ json: { row: 1 } }, { json: { row: 2 } }],
		);
		const perItemOperationResult = await azuraCastNode.execute.call(perItemOperationContext);
		assert.equal(perItemOperationResult[0].length, 2);
		assert.equal(perItemOperationResult[0][0].json.operation, 'getStatus');
		assert.equal(perItemOperationResult[0][1].json.operation, 'getStations');

		const publicNowPlayingWithoutApiKeyContext = createExecutionContext(
			{
				resource: getResource('getAllNowPlaying'),
				operation: 'getAllNowPlaying',
				pathParameters: '{}',
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			publicCredentials,
		);
		const nowPlayingResult = await azuraCastNode.execute.call(publicNowPlayingWithoutApiKeyContext);
		assert.equal(Array.isArray(nowPlayingResult[0]), true);
		assert.equal(nowPlayingResult[0][0].json.success, true);
		assert.equal(nowPlayingResult[0][0].json.data[0].station.shortcode, 'demo');
		const publicNowPlayingRequest = mock.requests.find(
			(request) => request.method === 'GET' && request.pathname === '/api/nowplaying',
		);
		assert.ok(publicNowPlayingRequest);
		assert.equal(publicNowPlayingRequest.headers['x-api-key'], undefined);
		assert.equal(publicNowPlayingRequest.headers.authorization, undefined);

		const requestableSongsContext = createExecutionContext(
			{
				resource: getResource('getRequestableSongs'),
				operation: 'getRequestableSongs',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			publicCredentials,
		);
		const requestableSongsResult = await azuraCastNode.execute.call(requestableSongsContext);
		assert.equal(requestableSongsResult[0].length, 1);
		assert.equal(requestableSongsResult[0][0].json.success, true);
		assert.equal(Array.isArray(requestableSongsResult[0][0].json.data), true);
		assert.equal(requestableSongsResult[0][0].json.data.length, 0);

		const nowPlayingArtContext = createExecutionContext(
			{
				resource: getResource('getStationNowPlayingArt'),
				operation: 'getStationNowPlayingArt',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			publicCredentials,
		);
		const nowPlayingArtResult = await azuraCastNode.execute.call(nowPlayingArtContext);
		assert.equal(nowPlayingArtResult[0][0].json.success, true);
		assert.equal(nowPlayingArtResult[0][0].json.data, 'JPEGDATA');

		const privateWithoutApiKeyContext = createExecutionContext(
			{
				resource: getResource('addWebhook'),
				operation: 'addWebhook',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyMode: 'json',
				jsonBody: '{"name":"Node Test Hook","is_enabled":true}',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			publicCredentials,
		);
		await assert.rejects(
			async () => azuraCastNode.execute.call(privateWithoutApiKeyContext),
			/HTTP 401: Unauthorized/,
		);

		const privateWithoutApiKeyContinueContext = createExecutionContext(
			{
				resource: getResource('addWebhook'),
				operation: 'addWebhook',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyMode: 'json',
				jsonBody: '{"name":"Node Test Hook","is_enabled":true}',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			publicCredentials,
			{ json: {} },
			{ continueOnFail: true },
		);
		const privateWithoutApiKeyContinueResult = await azuraCastNode.execute.call(
			privateWithoutApiKeyContinueContext,
		);
		assert.equal(privateWithoutApiKeyContinueResult[0][0].json.success, false);
		assert.equal(privateWithoutApiKeyContinueResult[0][0].json.operation, 'addWebhook');
		assert.equal(
			privateWithoutApiKeyContinueResult[0][0].json.resource,
			getResource('addWebhook'),
		);
		assert.equal(
			privateWithoutApiKeyContinueResult[0][0].json.error.code,
			'UNKNOWN_ERROR',
		);

		const createWebhookContext = createExecutionContext(
			{
				resource: getResource('addWebhook'),
				operation: 'addWebhook',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyMode: 'json',
				jsonBody: '{"name":"Node Test Hook","is_enabled":true}',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			credentials,
		);
		const webhookResult = await azuraCastNode.execute.call(createWebhookContext);
		assert.equal(webhookResult[0][0].json.success, true);
		assert.equal(webhookResult[0][0].json.data.created, true);

		const sendTestEmailContext = createExecutionContext(
			{
				resource: getResource('adminSendTestEmail'),
				operation: 'adminSendTestEmail',
				body_required__adminsendtestemail__email: 'ops@example.com',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const sendTestEmailResult = await azuraCastNode.execute.call(sendTestEmailContext);
		assert.equal(sendTestEmailResult[0][0].json.success, true);
		assert.equal(sendTestEmailResult[0][0].json.data.success, true);

		const invalidSendTestEmailContext = createExecutionContext(
			{
				resource: getResource('adminSendTestEmail'),
				operation: 'adminSendTestEmail',
				body_required__adminsendtestemail__email: 'invalid-email',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		await assert.rejects(
			async () => azuraCastNode.execute.call(invalidSendTestEmailContext),
			(error) => {
				assert.equal(error instanceof NodeApiError, true);
				assert.match(String(error.message ?? ''), /request|email|invalid|400/i);
				return true;
			},
		);

		const makeDirectoryContext = createExecutionContext(
			{
				resource: getResource('postStationFilesMkdir'),
				operation: 'postStationFilesMkdir',
				path__poststationfilesmkdir__station_id: { mode: 'list', value: 'demo' },
				body_required__poststationfilesmkdir__name: 'new-folder',
				body_optional__poststationfilesmkdir: {
					currentDirectory: 'music',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const makeDirectoryResult = await azuraCastNode.execute.call(makeDirectoryContext);
		assert.equal(makeDirectoryResult[0][0].json.success, true);
		assert.equal(makeDirectoryResult[0][0].json.data.success, true);

		const renameFileContext = createExecutionContext(
			{
				resource: getResource('postStationFilesRename'),
				operation: 'postStationFilesRename',
				path__poststationfilesrename__station_id: { mode: 'list', value: 'demo' },
				body_required__poststationfilesrename__file: 'music/old.mp3',
				body_required__poststationfilesrename__newpath: 'music/new.mp3',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const renameFileResult = await azuraCastNode.execute.call(renameFileContext);
		assert.equal(renameFileResult[0][0].json.success, true);
		assert.equal(renameFileResult[0][0].json.data.success, true);

		const telnetCommandContext = createExecutionContext(
			{
				resource: getResource('putAdminDebugTelnetCommand'),
				operation: 'putAdminDebugTelnetCommand',
				path__putadmindebugtelnetcommand__station_id: { mode: 'list', value: 'demo' },
				body_required__putadmindebugtelnetcommand__command: 'status',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const telnetCommandResult = await azuraCastNode.execute.call(telnetCommandContext);
		assert.equal(telnetCommandResult[0][0].json.success, true);
		assert.equal(telnetCommandResult[0][0].json.data.command, 'status');

		const playlistOrderContext = createExecutionContext(
			{
				resource: getResource('putStationPlaylistOrder'),
				operation: 'putStationPlaylistOrder',
				path__putstationplaylistorder__station_id: { mode: 'list', value: 'demo' },
				path__putstationplaylistorder__id: { mode: 'list', value: 11 },
				body_required__putstationplaylistorder__order: [22, 11, 33],
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const playlistOrderResult = await azuraCastNode.execute.call(playlistOrderContext);
		assert.equal(playlistOrderResult[0][0].json.success, true);
		assert.equal(Array.isArray(playlistOrderResult[0][0].json.data), true);
		assert.equal(playlistOrderResult[0][0].json.data.length, 3);

		const batchActionContext = createExecutionContext(
			{
				resource: getResource('putStationFileBatchAction'),
				operation: 'putStationFileBatchAction',
				path__putstationfilebatchaction__station_id: { mode: 'list', value: 'demo' },
				body_required__putstationfilebatchaction__do: 'move',
				body_optional__putstationfilebatchaction: {
					files: ['music/a.mp3'],
					currentDirectory: 'music',
					directory: 'archive',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const batchActionResult = await azuraCastNode.execute.call(batchActionContext);
		assert.equal(batchActionResult[0][0].json.success, true);
		assert.equal(batchActionResult[0][0].json.data.action, 'move');

		const runBackupContext = createExecutionContext(
			{
				resource: getResource('postAdminDoBackup'),
				operation: 'postAdminDoBackup',
				body_optional__postadmindobackup: {
					storage_location: 3,
					path: 'backups/manual.zip',
					exclude_media: true,
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const runBackupResult = await azuraCastNode.execute.call(runBackupContext);
		assert.equal(runBackupResult[0][0].json.success, true);
		assert.equal(runBackupResult[0][0].json.data.storage_location, 3);

		const saveWaveformContext = createExecutionContext(
			{
				resource: getResource('postStationMediaWaveform'),
				operation: 'postStationMediaWaveform',
				path__poststationmediawaveform__station_id: { mode: 'list', value: 'demo' },
				path__poststationmediawaveform__id: { mode: 'list', value: 1 },
				body_required__poststationmediawaveform__data: {
					points: [0, 1, 0.5],
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const saveWaveformResult = await azuraCastNode.execute.call(saveWaveformContext);
		assert.equal(saveWaveformResult[0][0].json.success, true);
		assert.equal(saveWaveformResult[0][0].json.data.cached, true);

		const putAccountTwoFactorContext = createExecutionContext(
			{
				resource: getResource('putAccountTwoFactor'),
				operation: 'putAccountTwoFactor',
				body_optional__putaccounttwofactor: {
					secret: 'A'.repeat(64),
					otp: '123456',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const putAccountTwoFactorResult = await azuraCastNode.execute.call(putAccountTwoFactorContext);
		assert.equal(putAccountTwoFactorResult[0][0].json.success, true);
		assert.equal(putAccountTwoFactorResult[0][0].json.data.success, true);

		const putAccountWebAuthnRegisterContext = createExecutionContext(
			{
				resource: getResource('putAccountWebAuthnRegister'),
				operation: 'putAccountWebAuthnRegister',
				body_required__putaccountwebauthnregister__createresponse: {
					clientDataJSON: 'YWJj',
					attestationObject: 'ZGVm',
				},
				body_optional__putaccountwebauthnregister: {
					name: 'Main Passkey',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const putAccountWebAuthnRegisterResult = await azuraCastNode.execute.call(
			putAccountWebAuthnRegisterContext,
		);
		assert.equal(putAccountWebAuthnRegisterResult[0][0].json.success, true);
		assert.equal(putAccountWebAuthnRegisterResult[0][0].json.data.success, true);

		const putMeContext = createExecutionContext(
			{
				resource: getResource('putMe'),
				operation: 'putMe',
				body_json__putme: {
					name: 'Node QA User',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const putMeResult = await azuraCastNode.execute.call(putMeContext);
		assert.equal(putMeResult[0][0].json.success, true);
		assert.equal(putMeResult[0][0].json.data.updated, true);

		const putStationLiquidsoapConfigContext = createExecutionContext(
			{
				resource: getResource('putStationLiquidsoapConfig'),
				operation: 'putStationLiquidsoapConfig',
				path__putstationliquidsoapconfig__station_id: { mode: 'list', value: 'demo' },
				body_json__putstationliquidsoapconfig: {
					custom_config: 'set("log.level",4)',
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const putStationLiquidsoapConfigResult = await azuraCastNode.execute.call(
			putStationLiquidsoapConfigContext,
		);
		assert.equal(putStationLiquidsoapConfigResult[0][0].json.success, true);
		assert.equal(putStationLiquidsoapConfigResult[0][0].json.data.updated, true);

		const putStationPlaylistApplyToContext = createExecutionContext(
			{
				resource: getResource('putStationPlaylistApplyTo'),
				operation: 'putStationPlaylistApplyTo',
				path__putstationplaylistapplyto__station_id: { mode: 'list', value: 'demo' },
				path__putstationplaylistapplyto__id: { mode: 'list', value: 11 },
				body_optional__putstationplaylistapplyto: {
					copyPlaylist: true,
					directories: ['rock', 'pop'],
				},
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const putStationPlaylistApplyToResult = await azuraCastNode.execute.call(
			putStationPlaylistApplyToContext,
		);
		assert.equal(putStationPlaylistApplyToResult[0][0].json.success, true);
		assert.equal(Array.isArray(putStationPlaylistApplyToResult[0][0].json.data.directories), true);
		assert.equal(putStationPlaylistApplyToResult[0][0].json.data.directories.length, 2);

		const deleteWebhookContext = createExecutionContext(
			{
				resource: getResource('deleteWebhook'),
				operation: 'deleteWebhook',
				path__deletewebhook__station_id: { mode: 'list', value: 'demo' },
				path__deletewebhook__id: { mode: 'list', value: 1 },
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'auto',
				returnFullResponse: false,
			},
			credentials,
		);
		const deleteWebhookResult = await azuraCastNode.execute.call(deleteWebhookContext);
		assert.equal(deleteWebhookResult[0].length, 1);
		assert.equal(deleteWebhookResult[0][0].json.deleted, true);

		const multipartContext = createExecutionContext(
			{
				resource: getResource('postUploadFile'),
				operation: 'postUploadFile',
				pathParameters: '{"station_id":"demo"}',
				sendQueryParameters: false,
				bodyModeOverride: 'auto',
				multipart_binary_property__postuploadfile: 'data',
				multipart_file_field_name__postuploadfile: 'file',
				sendAdditionalHeaders: false,
				responseFormat: 'json',
				returnFullResponse: false,
			},
			credentials,
			{
				json: {},
				binary: {
					data: {
						data: Buffer.from('FAKEMP3DATA').toString('base64'),
						fileName: 'test.mp3',
						mimeType: 'audio/mpeg',
					},
				},
			},
		);
		const multipartResult = await azuraCastNode.execute.call(multipartContext);
		assert.equal(multipartResult[0][0].json.success, true);
		assert.equal(multipartResult[0][0].json.data.uploaded, true);

		const binaryContext = createExecutionContext(
			{
				resource: getResource('getPlayFile'),
				operation: 'getPlayFile',
				pathParameters: '{"station_id":"demo","media_id":1,"id":1}',
				sendQueryParameters: false,
				bodyMode: 'none',
				sendAdditionalHeaders: false,
				responseFormat: 'binary',
				binaryOutputProperty: 'audio',
				returnFullResponse: false,
			},
			credentials,
		);
		const binaryResult = await azuraCastNode.execute.call(binaryContext);
		assert.equal(binaryResult[0][0].json.success, true);
		assert.ok(binaryResult[0][0].binary.audio.data);

		const webhookRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'POST' && request.pathname === '/api/station/demo/webhooks',
		);
		assert.ok(webhookRequest);
		assert.equal(webhookRequest.headers['x-api-key'], 'test-key');

		const sendTestEmailRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'POST' &&
				request.pathname === '/api/admin/send-test-message' &&
				request.body?.email === 'ops@example.com',
		);
		assert.ok(sendTestEmailRequest);
		assert.equal(sendTestEmailRequest.body.email, 'ops@example.com');

		const invalidSendTestEmailRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'POST' &&
				request.pathname === '/api/admin/send-test-message' &&
				request.body?.email === 'invalid-email',
		);
		assert.ok(invalidSendTestEmailRequest);
		assert.equal(invalidSendTestEmailRequest.body.email, 'invalid-email');

		const makeDirectoryRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'POST' && request.pathname === '/api/station/demo/files/mkdir',
		);
		assert.ok(makeDirectoryRequest);
		assert.equal(makeDirectoryRequest.body.name, 'new-folder');

		const renameFileRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'PUT' && request.pathname === '/api/station/demo/files/rename',
		);
		assert.ok(renameFileRequest);
		assert.equal(renameFileRequest.body.file, 'music/old.mp3');
		assert.equal(renameFileRequest.body.newPath, 'music/new.mp3');

		const telnetCommandRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'PUT' &&
				request.pathname === '/api/admin/debug/station/demo/telnet',
		);
		assert.ok(telnetCommandRequest);
		assert.equal(telnetCommandRequest.body.command, 'status');

		const playlistOrderRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'PUT' && request.pathname === '/api/station/demo/playlist/11/order',
		);
		assert.ok(playlistOrderRequest);
		assert.equal(Array.isArray(playlistOrderRequest.body.order), true);
		assert.equal(playlistOrderRequest.body.order[0], 22);

		const batchActionRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'PUT' && request.pathname === '/api/station/demo/files/batch',
		);
		assert.ok(batchActionRequest);
		assert.equal(batchActionRequest.body.do, 'move');

		const runBackupRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'POST' && request.pathname === '/api/admin/backups/run',
		);
		assert.ok(runBackupRequest);
		assert.equal(runBackupRequest.body.storage_location, 3);
		assert.equal(runBackupRequest.body.exclude_media, true);

		const saveWaveformRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'POST' && request.pathname === '/api/station/demo/waveform/1',
		);
		assert.ok(saveWaveformRequest);
		assert.equal(Array.isArray(saveWaveformRequest.body.data.points), true);
		assert.equal(saveWaveformRequest.body.data.points.length, 3);

		const putAccountTwoFactorRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'PUT' && request.pathname === '/api/frontend/account/two-factor',
		);
		assert.ok(putAccountTwoFactorRequest);
		assert.equal(String(putAccountTwoFactorRequest.body.secret).length, 64);
		assert.equal(putAccountTwoFactorRequest.body.otp, '123456');

		const putAccountWebAuthnRegisterRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'PUT' &&
				request.pathname === '/api/frontend/account/webauthn/register',
		);
		assert.ok(putAccountWebAuthnRegisterRequest);
		assert.equal(
			putAccountWebAuthnRegisterRequest.body.createResponse.clientDataJSON,
			'YWJj',
		);
		assert.equal(
			putAccountWebAuthnRegisterRequest.body.createResponse.attestationObject,
			'ZGVm',
		);

		const putMeRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'PUT' && request.pathname === '/api/frontend/account/me',
		);
		assert.ok(putMeRequest);
		assert.equal(putMeRequest.body.name, 'Node QA User');

		const putStationLiquidsoapConfigRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'PUT' &&
				request.pathname === '/api/station/demo/liquidsoap-config',
		);
		assert.ok(putStationLiquidsoapConfigRequest);
		assert.equal(
			putStationLiquidsoapConfigRequest.body.custom_config,
			'set("log.level",4)',
		);

		const putStationPlaylistApplyToRequest = [...mock.requests].reverse().find(
			(request) =>
				request.method === 'PUT' &&
				request.pathname === '/api/station/demo/playlist/11/apply-to',
		);
		assert.ok(putStationPlaylistApplyToRequest);
		assert.equal(putStationPlaylistApplyToRequest.body.copyPlaylist, true);
		assert.equal(Array.isArray(putStationPlaylistApplyToRequest.body.directories), true);
		assert.equal(putStationPlaylistApplyToRequest.body.directories[0], 'rock');

		const multipartRequest = mock.requests.find(
			(request) =>
				request.method === 'POST' && request.pathname === '/api/station/demo/files/upload',
		);
		assert.ok(multipartRequest);
		assert.match(String(multipartRequest.headers['content-type']), /multipart\/form-data/i);

		process.stdout.write('Local simulation completed successfully.\n');
	} finally {
		await mock.close();
	}
}

await main();
