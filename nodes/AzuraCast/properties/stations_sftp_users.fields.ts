import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const stationsSftpUsersFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Stations: SFTP Users",
	"resource_stations_sftp_users",
);
