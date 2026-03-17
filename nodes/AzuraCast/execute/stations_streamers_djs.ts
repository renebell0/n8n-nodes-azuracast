import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const stationsStreamersDjsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addStreamer": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addStreamer");
	},
	"deleteStreamer": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteStreamer");
	},
	"deleteStreamerArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteStreamerArt");
	},
	"editStreamer": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editStreamer");
	},
	"getStationAllBroadcasts": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationAllBroadcasts");
	},
	"getStationStreamerBroadcasts": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationStreamerBroadcasts");
	},
	"getStationStreamerDeleteBroadcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationStreamerDeleteBroadcast");
	},
	"getStationStreamerDownloadBroadcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationStreamerDownloadBroadcast");
	},
	"getStreamer": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStreamer");
	},
	"getStreamers": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStreamers");
	},
	"postStationStreamerBroadcastsBatch": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationStreamerBroadcastsBatch");
	},
	"postStreamerArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStreamerArt");
	},
};
