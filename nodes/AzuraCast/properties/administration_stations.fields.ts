import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationStationsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Stations",
	"resource_administration_stations",
);
