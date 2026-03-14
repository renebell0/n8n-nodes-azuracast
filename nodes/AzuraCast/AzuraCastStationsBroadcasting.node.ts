import { NodeConnectionTypes, type IExecuteFunctions, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { azuraCastCredentialTypeName, createDomainOperationConfig, executeDomainNode } from './AzuraCast.shared';

const operationConfig = createDomainOperationConfig("Stations: Broadcasting");

export class AzuraCastStationsBroadcasting implements INodeType {
	description: INodeTypeDescription = {
		displayName: "AzuraCast Stations Broadcasting",
		name: "azuraCastStationsBroadcasting",
		icon: 'file:azuracast.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operationId"]}}',
		description: "Execute AzuraCast Web API operations for Stations: Broadcasting",
		defaults: {
			name: "AzuraCast Stations Broadcasting",
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
