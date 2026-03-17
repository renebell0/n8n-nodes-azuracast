import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const publicNowPlayingResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"getAllNowPlaying": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAllNowPlaying");
	},
	"getStationNowPlaying": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationNowPlaying");
	},
	"getStationNowPlayingArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationNowPlayingArt");
	},
};
