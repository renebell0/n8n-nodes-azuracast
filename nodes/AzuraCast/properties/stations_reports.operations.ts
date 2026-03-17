import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsReportsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Reports",
	"resource_stations_reports",
);
