import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const stationsBroadcastingResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"deleteStereoToolConfiguration": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteStereoToolConfiguration");
	},
	"doBackendServiceAction": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "doBackendServiceAction");
	},
	"doFrontendServiceAction": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "doFrontendServiceAction");
	},
	"exportStationLiquidsoapConfig": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "exportStationLiquidsoapConfig");
	},
	"getServiceStatus": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getServiceStatus");
	},
	"getStationLiquidsoapConfig": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationLiquidsoapConfig");
	},
	"getStereoToolConfiguration": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStereoToolConfiguration");
	},
	"importStationLiquidsoapConfig": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "importStationLiquidsoapConfig");
	},
	"postStereoToolConfiguration": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStereoToolConfiguration");
	},
	"putStationLiquidsoapConfig": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putStationLiquidsoapConfig");
	},
	"restartServices": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "restartServices");
	},
};
