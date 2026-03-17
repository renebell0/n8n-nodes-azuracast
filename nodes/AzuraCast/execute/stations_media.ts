import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const stationsMediaResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addFile");
	},
	"deleteFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteFile");
	},
	"deleteMediaArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteMediaArt");
	},
	"editFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editFile");
	},
	"getFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getFile");
	},
	"getFiles": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getFiles");
	},
	"getPlayFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPlayFile");
	},
	"getPlayFileSongId": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPlayFileSongId");
	},
	"getStationBulkMediaDownload": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationBulkMediaDownload");
	},
	"getStationFileDirectories": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationFileDirectories");
	},
	"getStationFileDownload": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationFileDownload");
	},
	"getStationFileList": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationFileList");
	},
	"getStationMediaWaveform": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationMediaWaveform");
	},
	"postMediaArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postMediaArt");
	},
	"postStationBulkMediaPreview": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationBulkMediaPreview");
	},
	"postStationBulkMediaUpload": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationBulkMediaUpload");
	},
	"postStationFilesMkdir": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationFilesMkdir");
	},
	"postStationFilesRename": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationFilesRename");
	},
	"postStationMediaWaveform": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postStationMediaWaveform");
	},
	"postUploadFile": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postUploadFile");
	},
	"putStationFileBatchAction": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putStationFileBatchAction");
	},
};
