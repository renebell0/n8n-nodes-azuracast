import type { INodeProperties } from 'n8n-workflow';
import { createSharedAdvancedProperties } from '../AzuraCast.shared';
import { azuraCastResourceProperty } from './resources';
import { administrationBackupsOperationProperty } from './administration_backups.operations';
import { administrationCustomFieldsOperationProperty } from './administration_custom_fields.operations';
import { administrationDebuggingOperationProperty } from './administration_debugging.operations';
import { administrationGeneralOperationProperty } from './administration_general.operations';
import { administrationRolesOperationProperty } from './administration_roles.operations';
import { administrationSettingsOperationProperty } from './administration_settings.operations';
import { administrationStationsOperationProperty } from './administration_stations.operations';
import { administrationStorageLocationsOperationProperty } from './administration_storage_locations.operations';
import { administrationUsersOperationProperty } from './administration_users.operations';
import { miscellaneousOperationProperty } from './miscellaneous.operations';
import { myAccountOperationProperty } from './my_account.operations';
import { publicMiscellaneousOperationProperty } from './public_miscellaneous.operations';
import { publicNowPlayingOperationProperty } from './public_now_playing.operations';
import { publicStationsOperationProperty } from './public_stations.operations';
import { stationsBroadcastingOperationProperty } from './stations_broadcasting.operations';
import { stationsGeneralOperationProperty } from './stations_general.operations';
import { stationsHlsStreamsOperationProperty } from './stations_hls_streams.operations';
import { stationsMediaOperationProperty } from './stations_media.operations';
import { stationsMountPointsOperationProperty } from './stations_mount_points.operations';
import { stationsPlaylistsOperationProperty } from './stations_playlists.operations';
import { stationsPodcastsOperationProperty } from './stations_podcasts.operations';
import { stationsQueueOperationProperty } from './stations_queue.operations';
import { stationsRemoteRelaysOperationProperty } from './stations_remote_relays.operations';
import { stationsReportsOperationProperty } from './stations_reports.operations';
import { stationsSftpUsersOperationProperty } from './stations_sftp_users.operations';
import { stationsStreamersDjsOperationProperty } from './stations_streamers_djs.operations';
import { stationsWebHooksOperationProperty } from './stations_web_hooks.operations';
import { administrationBackupsFieldProperties } from './administration_backups.fields';
import { administrationCustomFieldsFieldProperties } from './administration_custom_fields.fields';
import { administrationDebuggingFieldProperties } from './administration_debugging.fields';
import { administrationGeneralFieldProperties } from './administration_general.fields';
import { administrationRolesFieldProperties } from './administration_roles.fields';
import { administrationSettingsFieldProperties } from './administration_settings.fields';
import { administrationStationsFieldProperties } from './administration_stations.fields';
import { administrationStorageLocationsFieldProperties } from './administration_storage_locations.fields';
import { administrationUsersFieldProperties } from './administration_users.fields';
import { miscellaneousFieldProperties } from './miscellaneous.fields';
import { myAccountFieldProperties } from './my_account.fields';
import { publicMiscellaneousFieldProperties } from './public_miscellaneous.fields';
import { publicNowPlayingFieldProperties } from './public_now_playing.fields';
import { publicStationsFieldProperties } from './public_stations.fields';
import { stationsBroadcastingFieldProperties } from './stations_broadcasting.fields';
import { stationsGeneralFieldProperties } from './stations_general.fields';
import { stationsHlsStreamsFieldProperties } from './stations_hls_streams.fields';
import { stationsMediaFieldProperties } from './stations_media.fields';
import { stationsMountPointsFieldProperties } from './stations_mount_points.fields';
import { stationsPlaylistsFieldProperties } from './stations_playlists.fields';
import { stationsPodcastsFieldProperties } from './stations_podcasts.fields';
import { stationsQueueFieldProperties } from './stations_queue.fields';
import { stationsRemoteRelaysFieldProperties } from './stations_remote_relays.fields';
import { stationsReportsFieldProperties } from './stations_reports.fields';
import { stationsSftpUsersFieldProperties } from './stations_sftp_users.fields';
import { stationsStreamersDjsFieldProperties } from './stations_streamers_djs.fields';
import { stationsWebHooksFieldProperties } from './stations_web_hooks.fields';

export const azuraCastNodeProperties: INodeProperties[] = [
	azuraCastResourceProperty,
	administrationBackupsOperationProperty,
	administrationCustomFieldsOperationProperty,
	administrationDebuggingOperationProperty,
	administrationGeneralOperationProperty,
	administrationRolesOperationProperty,
	administrationSettingsOperationProperty,
	administrationStationsOperationProperty,
	administrationStorageLocationsOperationProperty,
	administrationUsersOperationProperty,
	miscellaneousOperationProperty,
	myAccountOperationProperty,
	publicMiscellaneousOperationProperty,
	publicNowPlayingOperationProperty,
	publicStationsOperationProperty,
	stationsBroadcastingOperationProperty,
	stationsGeneralOperationProperty,
	stationsHlsStreamsOperationProperty,
	stationsMediaOperationProperty,
	stationsMountPointsOperationProperty,
	stationsPlaylistsOperationProperty,
	stationsPodcastsOperationProperty,
	stationsQueueOperationProperty,
	stationsRemoteRelaysOperationProperty,
	stationsReportsOperationProperty,
	stationsSftpUsersOperationProperty,
	stationsStreamersDjsOperationProperty,
	stationsWebHooksOperationProperty,
	...administrationBackupsFieldProperties,
	...administrationCustomFieldsFieldProperties,
	...administrationDebuggingFieldProperties,
	...administrationGeneralFieldProperties,
	...administrationRolesFieldProperties,
	...administrationSettingsFieldProperties,
	...administrationStationsFieldProperties,
	...administrationStorageLocationsFieldProperties,
	...administrationUsersFieldProperties,
	...miscellaneousFieldProperties,
	...myAccountFieldProperties,
	...publicMiscellaneousFieldProperties,
	...publicNowPlayingFieldProperties,
	...publicStationsFieldProperties,
	...stationsBroadcastingFieldProperties,
	...stationsGeneralFieldProperties,
	...stationsHlsStreamsFieldProperties,
	...stationsMediaFieldProperties,
	...stationsMountPointsFieldProperties,
	...stationsPlaylistsFieldProperties,
	...stationsPodcastsFieldProperties,
	...stationsQueueFieldProperties,
	...stationsRemoteRelaysFieldProperties,
	...stationsReportsFieldProperties,
	...stationsSftpUsersFieldProperties,
	...stationsStreamersDjsFieldProperties,
	...stationsWebHooksFieldProperties,
	...createSharedAdvancedProperties(),
];
