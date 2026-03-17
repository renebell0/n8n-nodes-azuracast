import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const publicStationsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Public: Stations",
	"resource_public_stations",
);
