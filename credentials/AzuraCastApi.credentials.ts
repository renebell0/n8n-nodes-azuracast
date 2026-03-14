import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class AzuraCastApi implements ICredentialType {
	name = 'renebelloAzuraCastApi';

	displayName = 'AzuraCast API';

	icon: Icon = {
		light: 'file:../nodes/AzuraCast/azuracast.svg',
		dark: 'file:../nodes/AzuraCast/azuracast.dark.svg',
	};

	documentationUrl = 'https://www.azuracast.com/docs/developers/apis/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://radio.example.com',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			description: 'Optional for public endpoints; required for protected endpoints',
			default: '',
			required: false,
		},
	];

	authenticate = async (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> => {
		const apiKey = String(credentials.apiKey ?? '').trim();
		if (!apiKey) {
			return requestOptions;
		}

		return {
			...requestOptions,
			headers: {
				...(requestOptions.headers ?? {}),
				'X-API-Key': apiKey,
				Authorization: `Bearer ${apiKey}`,
			},
		};
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.baseUrl.replace(/\\/+$/, "").endsWith("/api") ? $credentials.baseUrl.replace(/\\/+$/, "") : $credentials.baseUrl.replace(/\\/+$/, "") + "/api"}}',
			url: '={{$credentials.apiKey ? "/frontend/account/me" : "/nowplaying"}}',
			method: 'GET',
		},
	};
}
