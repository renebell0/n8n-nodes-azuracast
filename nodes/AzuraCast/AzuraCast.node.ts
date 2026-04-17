import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import {
	azuraCastCredentialTypeName,
	azuraCastListSearchMethods,
	executeSelectedOperation,
} from './AzuraCast.shared';
import { azuraCastNodeProperties } from './properties';

export class AzuraCast implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AzuraCast',
		name: 'azuraCast',
		icon: { light: 'file:azuracast.svg', dark: 'file:azuracast.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with AzuraCast Web API',
		defaults: {
			name: 'AzuraCast',
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
		properties: azuraCastNodeProperties,
	};

	methods = {
		listSearch: azuraCastListSearchMethods,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeSelectedOperation.call(this);
	}
}
