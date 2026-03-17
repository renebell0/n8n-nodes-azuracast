import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const stationsPlaylistsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addPlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addPlaylist");
	},
	"deleteEmptyPlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteEmptyPlaylist");
	},
	"deletePlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePlaylist");
	},
	"deletePlaylistQueue": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePlaylistQueue");
	},
	"editPlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editPlaylist");
	},
	"getExportPlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getExportPlaylist");
	},
	"getPlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPlaylist");
	},
	"getPlaylists": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPlaylists");
	},
	"getStationPlaylistApplyTo": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPlaylistApplyTo");
	},
	"getStationPlaylistOrder": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPlaylistOrder");
	},
	"getStationPlaylistQueue": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPlaylistQueue");
	},
	"postStationPlaylistClone": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationPlaylistClone");
	},
	"postStationPlaylistImport": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationPlaylistImport");
	},
	"postStationPodcastBatch": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationPodcastBatch");
	},
	"putReshufflePlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putReshufflePlaylist");
	},
	"putStationPlaylistApplyTo": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putStationPlaylistApplyTo");
	},
	"putStationPlaylistOrder": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putStationPlaylistOrder");
	},
	"putTogglePlaylist": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putTogglePlaylist");
	},
};
