import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const administrationCustomFieldsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addCustomField": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addCustomField");
	},
	"deleteCustomField": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteCustomField");
	},
	"editCustomField": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editCustomField");
	},
	"getCustomField": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getCustomField");
	},
	"getCustomFields": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getCustomFields");
	},
};
