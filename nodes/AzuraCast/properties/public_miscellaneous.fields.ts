import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const publicMiscellaneousFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Public: Miscellaneous",
	"resource_public_miscellaneous",
);
