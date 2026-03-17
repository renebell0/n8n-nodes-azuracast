import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { administrationBackupsResourceOperations } from './administration_backups';
import { administrationCustomFieldsResourceOperations } from './administration_custom_fields';
import { administrationDebuggingResourceOperations } from './administration_debugging';
import { administrationGeneralResourceOperations } from './administration_general';
import { administrationRolesResourceOperations } from './administration_roles';
import { administrationSettingsResourceOperations } from './administration_settings';
import { administrationStationsResourceOperations } from './administration_stations';
import { administrationStorageLocationsResourceOperations } from './administration_storage_locations';
import { administrationUsersResourceOperations } from './administration_users';
import { miscellaneousResourceOperations } from './miscellaneous';
import { myAccountResourceOperations } from './my_account';
import { publicMiscellaneousResourceOperations } from './public_miscellaneous';
import { publicNowPlayingResourceOperations } from './public_now_playing';
import { publicStationsResourceOperations } from './public_stations';
import { stationsBroadcastingResourceOperations } from './stations_broadcasting';
import { stationsGeneralResourceOperations } from './stations_general';
import { stationsHlsStreamsResourceOperations } from './stations_hls_streams';
import { stationsMediaResourceOperations } from './stations_media';
import { stationsMountPointsResourceOperations } from './stations_mount_points';
import { stationsPlaylistsResourceOperations } from './stations_playlists';
import { stationsPodcastsResourceOperations } from './stations_podcasts';
import { stationsQueueResourceOperations } from './stations_queue';
import { stationsRemoteRelaysResourceOperations } from './stations_remote_relays';
import { stationsReportsResourceOperations } from './stations_reports';
import { stationsSftpUsersResourceOperations } from './stations_sftp_users';
import { stationsStreamersDjsResourceOperations } from './stations_streamers_djs';
import { stationsWebHooksResourceOperations } from './stations_web_hooks';

export type AzuraCastOperationExecutor = (
	this: IExecuteFunctions,
) => Promise<INodeExecutionData[][]>;

export const resourceOperationsFunctions: Record<
	string,
	Record<string, AzuraCastOperationExecutor>
> = {
	"resource_administration_backups": administrationBackupsResourceOperations,
	"resource_administration_custom_fields": administrationCustomFieldsResourceOperations,
	"resource_administration_debugging": administrationDebuggingResourceOperations,
	"resource_administration_general": administrationGeneralResourceOperations,
	"resource_administration_roles": administrationRolesResourceOperations,
	"resource_administration_settings": administrationSettingsResourceOperations,
	"resource_administration_stations": administrationStationsResourceOperations,
	"resource_administration_storage_locations": administrationStorageLocationsResourceOperations,
	"resource_administration_users": administrationUsersResourceOperations,
	"resource_miscellaneous": miscellaneousResourceOperations,
	"resource_my_account": myAccountResourceOperations,
	"resource_public_miscellaneous": publicMiscellaneousResourceOperations,
	"resource_public_now_playing": publicNowPlayingResourceOperations,
	"resource_public_stations": publicStationsResourceOperations,
	"resource_stations_broadcasting": stationsBroadcastingResourceOperations,
	"resource_stations_general": stationsGeneralResourceOperations,
	"resource_stations_hls_streams": stationsHlsStreamsResourceOperations,
	"resource_stations_media": stationsMediaResourceOperations,
	"resource_stations_mount_points": stationsMountPointsResourceOperations,
	"resource_stations_playlists": stationsPlaylistsResourceOperations,
	"resource_stations_podcasts": stationsPodcastsResourceOperations,
	"resource_stations_queue": stationsQueueResourceOperations,
	"resource_stations_remote_relays": stationsRemoteRelaysResourceOperations,
	"resource_stations_reports": stationsReportsResourceOperations,
	"resource_stations_sftp_users": stationsSftpUsersResourceOperations,
	"resource_stations_streamers_djs": stationsStreamersDjsResourceOperations,
	"resource_stations_web_hooks": stationsWebHooksResourceOperations,
};
