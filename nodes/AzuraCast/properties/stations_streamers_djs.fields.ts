import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsStreamersDjsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Streamers/DJs",
	"resource_stations_streamers_djs",
);
