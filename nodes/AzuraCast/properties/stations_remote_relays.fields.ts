import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsRemoteRelaysFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Remote Relays",
	"resource_stations_remote_relays",
);
