import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsWebHooksFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Web Hooks",
	"resource_stations_web_hooks",
);
