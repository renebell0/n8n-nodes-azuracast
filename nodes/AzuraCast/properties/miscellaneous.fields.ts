import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const miscellaneousFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Miscellaneous",
	"resource_miscellaneous",
);
