import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const publicNowPlayingFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Public: Now Playing",
	"resource_public_now_playing",
);
