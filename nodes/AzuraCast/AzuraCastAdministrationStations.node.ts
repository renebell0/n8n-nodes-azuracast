import { NodeConnectionTypes, type IExecuteFunctions, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { azuraCastCredentialTypeName, createDomainOperationConfig, executeDomainNode } from './AzuraCast.shared';

const operationConfig = createDomainOperationConfig("Administration: Stations");

export class AzuraCastAdministrationStations implements INodeType {
	description: INodeTypeDescription = {
		displayName: "AzuraCast Administration Stations",
		name: "azuraCastAdministrationStations",
		icon: 'file:azuracast.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operationId"]}}',
		description: "Execute AzuraCast Web API operations for Administration: Stations",
		defaults: {
			name: "AzuraCast Administration Stations",
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
