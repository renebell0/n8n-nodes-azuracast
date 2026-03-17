import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsMountPointsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: Mount Points",
	"resource_stations_mount_points",
);
