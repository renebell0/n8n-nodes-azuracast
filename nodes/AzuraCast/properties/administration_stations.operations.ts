import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationStationsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Stations",
	"resource_administration_stations",
);
