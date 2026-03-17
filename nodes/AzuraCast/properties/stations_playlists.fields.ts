import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsPlaylistsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Playlists",
	"resource_stations_playlists",
);
