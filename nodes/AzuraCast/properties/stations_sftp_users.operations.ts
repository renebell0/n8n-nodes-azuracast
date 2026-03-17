import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const stationsSftpUsersOperationProperty: INodeProperties = createResourceOperationProperty(
	"Stations: SFTP Users",
	"resource_stations_sftp_users",
);
