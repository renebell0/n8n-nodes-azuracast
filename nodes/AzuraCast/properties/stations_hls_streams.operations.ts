import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsHlsStreamsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: HLS Streams",
	"resource_stations_hls_streams",
);
