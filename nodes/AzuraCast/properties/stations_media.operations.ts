import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsMediaOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Media",
	"resource_stations_media",
);
