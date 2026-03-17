import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const administrationStationsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"adminAddStation": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminAddStation");
	},
	"adminDeleteStation": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDeleteStation");
	},
	"adminEditStation": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminEditStation");
	},
	"adminGetStation": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminGetStation");
	},
	"adminGetStations": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminGetStations");
	},
	"getAdminStationStorageLocations": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAdminStationStorageLocations");
	},
	"postAdminStationsClone": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postAdminStationsClone");
	},
};
