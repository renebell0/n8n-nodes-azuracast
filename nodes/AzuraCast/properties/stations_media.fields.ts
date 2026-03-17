import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsMediaFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Media",
	"resource_stations_media",
);
