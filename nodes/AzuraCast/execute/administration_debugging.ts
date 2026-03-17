import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const administrationDebuggingResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"adminDebugClearCache": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugClearCache");
	},
	"adminDebugClearQueue": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugClearQueue");
	},
	"adminDebugClearStationQueue": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugClearStationQueue");
	},
	"adminDebugRunSyncTask": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugRunSyncTask");
	},
	"adminDebugStationNextSong": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugStationNextSong");
	},
	"adminDebugStationNowPlaying": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "adminDebugStationNowPlaying");
	},
	"getAdminDebugQueues": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAdminDebugQueues");
	},
	"getAdminDebugStations": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAdminDebugStations");
	},
	"getAdminDebugSyncTasks": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAdminDebugSyncTasks");
	},
	"putAdminDebugTelnetCommand": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putAdminDebugTelnetCommand");
	},
};
