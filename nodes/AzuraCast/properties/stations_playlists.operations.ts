import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsPlaylistsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Playlists",
	"resource_stations_playlists",
);
