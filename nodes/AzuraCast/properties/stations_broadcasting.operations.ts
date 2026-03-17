import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsBroadcastingOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Broadcasting",
	"resource_stations_broadcasting",
);
