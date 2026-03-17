import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const publicStationsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Public: Stations",
	"resource_public_stations",
);
