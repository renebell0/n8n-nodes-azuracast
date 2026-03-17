import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const publicNowPlayingOperationProperty: INodeProperties = createResourceOperationProperty(
	"Public: Now Playing",
	"resource_public_now_playing",
);
