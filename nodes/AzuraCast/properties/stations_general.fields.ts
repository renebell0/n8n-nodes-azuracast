import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsGeneralFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: General",
	"resource_stations_general",
);
