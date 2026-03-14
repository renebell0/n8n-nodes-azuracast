import { NodeConnectionTypes, type IExecuteFunctions, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { azuraCastCredentialTypeName, createDomainOperationConfig, executeDomainNode } from './AzuraCast.shared';

const operationConfig = createDomainOperationConfig("Stations: HLS Streams");

export class AzuraCastStationsHlsStreams implements INodeType {
	description: INodeTypeDescription = {
		displayName: "AzuraCast Stations HLS Streams",
		name: "azuraCastStationsHlsStreams",
		icon: 'file:azuracast.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operationId"]}}',
		description: "Execute AzuraCast Web API operations for Stations: HLS Streams",
		defaults: {
			name: "AzuraCast Stations HLS Streams",
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: azuraCastCredentialTypeName,
				required: true,
			},
		],
		properties: operationConfig.properties,
	};

	async execute(this: IExecuteFunctions) {
		return executeDomainNode.call(this, operationConfig.operationMap);
	}
}
