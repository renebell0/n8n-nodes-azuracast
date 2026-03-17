import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsRemoteRelaysOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Remote Relays",
	"resource_stations_remote_relays",
);
