import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsPodcastsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Podcasts",
	"resource_stations_podcasts",
);
