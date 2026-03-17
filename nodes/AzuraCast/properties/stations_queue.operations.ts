import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsQueueOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Queue",
	"resource_stations_queue",
);
