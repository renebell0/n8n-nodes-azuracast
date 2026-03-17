import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsBroadcastingFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Broadcasting",
	"resource_stations_broadcasting",
);
