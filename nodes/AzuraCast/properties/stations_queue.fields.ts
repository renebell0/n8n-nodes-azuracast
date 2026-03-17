import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsQueueFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Queue",
	"resource_stations_queue",
);
