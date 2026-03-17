import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const publicStationsResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"getMediaArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getMediaArt");
	},
	"getPodcastArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPodcastArt");
	},
	"getPodcastEpisodeArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPodcastEpisodeArt");
	},
	"getPodcastEpisodeMedia": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getPodcastEpisodeMedia");
	},
	"getRequestableSongs": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getRequestableSongs");
	},
	"getSchedule": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getSchedule");
	},
	"getStation": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStation");
	},
	"getStationOnDemand": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationOnDemand");
	},
	"getStationOnDemandDownload": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationOnDemandDownload");
	},
	"getStationPublicPodcast": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPublicPodcast");
	},
	"getStationPublicPodcastEpisode": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPublicPodcastEpisode");
	},
	"getStationPublicPodcastEpisodes": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPublicPodcastEpisodes");
	},
	"getStationPublicPodcasts": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStationPublicPodcasts");
	},
	"getStations": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStations");
	},
	"getStreamerArt": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getStreamerArt");
	},
	"submitSongRequest": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "submitSongRequest");
	},
};
