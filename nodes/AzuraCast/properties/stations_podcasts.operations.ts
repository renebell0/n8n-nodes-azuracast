import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsPodcastsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Podcasts",
	"resource_stations_podcasts",
);
