import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsWebHooksOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Web Hooks",
	"resource_stations_web_hooks",
);
