import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsStreamersDjsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Streamers/DJs",
	"resource_stations_streamers_djs",
);
