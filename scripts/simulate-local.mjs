import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

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

function createExecutionContext(params, credentials, inputItem) {
	const item = inputItem ?? { json: {} };
	const apiKey = String(credentials.apiKey ?? '').trim();
	const authHeaders = apiKey
		? {
				'X-API-Key': apiKey,
				Authorization: `Bearer ${apiKey}`,
			}
		: {};
	return {
		getInputData: () => [item],
		getNodeParameter: (name, _itemIndex, fallbackValue) =>
			Object.prototype.hasOwnProperty.call(params, name) ? params[name] : fallbackValue,
		getCredentials: async () => credentials,
		getNode: () => ({ name: 'AzuraCast' }),
		continueOnFail: () => false,
		helpers: {
			httpRequest: async (options) => runHttpRequest(options),
			httpRequestWithAuthentication: async (_credentialType, options) =>
				runHttpRequest(options, authHeaders),
			returnJsonArray: (data) => data.map((entry) => ({ json: entry })),
			getBinaryDataBuffer: async (_itemIndex, propertyName) => {
				const binary = item.binary?.[propertyName];
				if (!binary?.data) {
					throw new Error(`Missing binary property: ${propertyName}`);
				}
				return Buffer.from(binary.data, 'base64');
			},
			assertBinaryData: (_itemIndex, propertyName) => {
				const binary = item.binary?.[propertyName];
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
		assert.equal(statusResult[0][0].json.online, true);

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
		assert.equal(nowPlayingResult[0][0].json.station.shortcode, 'demo');
		const publicNowPlayingRequest = mock.requests.find(
			(request) => request.method === 'GET' && request.pathname === '/api/nowplaying',
		);
		assert.ok(publicNowPlayingRequest);
		assert.equal(publicNowPlayingRequest.headers['x-api-key'], undefined);
		assert.equal(publicNowPlayingRequest.headers.authorization, undefined);

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
		assert.equal(webhookResult[0][0].json.created, true);

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
		assert.equal(multipartResult[0][0].json.uploaded, true);

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
		assert.ok(binaryResult[0][0].binary.audio.data);

		const webhookRequest = [...mock.requests].reverse().find(
			(request) => request.method === 'POST' && request.pathname === '/api/station/demo/webhooks',
		);
		assert.ok(webhookRequest);
		assert.equal(webhookRequest.headers['x-api-key'], 'test-key');

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
