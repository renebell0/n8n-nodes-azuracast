import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsGeneralOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: General",
	"resource_stations_general",
);
