import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsMountPointsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: Mount Points",
	"resource_stations_mount_points",
);
