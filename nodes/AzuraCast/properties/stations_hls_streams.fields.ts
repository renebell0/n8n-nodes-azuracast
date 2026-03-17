import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsHlsStreamsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: HLS Streams",
	"resource_stations_hls_streams",
);
