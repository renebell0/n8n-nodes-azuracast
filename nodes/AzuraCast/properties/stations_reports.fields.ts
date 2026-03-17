import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsReportsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Reports",
	"resource_stations_reports",
);
