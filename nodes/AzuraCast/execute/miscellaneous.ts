import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const miscellaneousResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"getDashboardCharts": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getDashboardCharts");
	},
	"getDashboardStations": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getDashboardStations");
	},
	"getNotifications": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getNotifications");
	},
	"getPrometheus": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPrometheus");
	},
};
