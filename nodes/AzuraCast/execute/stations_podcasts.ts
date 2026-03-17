import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const stationsPodcastsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addEpisode": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addEpisode");
	},
	"addPodcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addPodcast");
	},
	"deleteEpisode": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteEpisode");
	},
	"deletePodcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePodcast");
	},
	"deletePodcastArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePodcastArt");
	},
	"deletePodcastEpisodeArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePodcastEpisodeArt");
	},
	"deletePodcastEpisodeMedia": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deletePodcastEpisodeMedia");
	},
	"editEpisode": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editEpisode");
	},
	"editPodcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "editPodcast");
	},
	"getEpisode": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getEpisode");
	},
	"getEpisodes": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getEpisodes");
	},
	"getPodcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPodcast");
	},
	"getPodcasts": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPodcasts");
	},
	"getStationPodcastPlaylists": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPodcastPlaylists");
	},
	"postPodcastArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postPodcastArt");
	},
	"postPodcastEpisodeArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postPodcastEpisodeArt");
	},
	"postPodcastEpisodeMedia": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "postPodcastEpisodeMedia");
	},
};
