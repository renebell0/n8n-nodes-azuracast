import {
	NodeApiError,
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { azuraCastCredentialTypeName } from './AzuraCast.shared';
import { resourceOperationsFunctions } from './execute';
import { azuraCastNodeProperties } from './properties';

export class AzuraCast implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AzuraCast',
		name: 'azuraCast',
		icon: { light: 'file:azuracast.svg', dark: 'file:azuracast.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const operationGroup = resourceOperationsFunctions[resource];
		const operationExecutor = operationGroup?.[operation];

		if (!operationExecutor) {
			throw new NodeApiError(this.getNode(), {
				message: 'Unsupported operation.',
				description: `Operation "${operation}" for resource "${resource}" is not supported.`,
			});
		}

		return operationExecutor.call(this);
	}
}
