import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const miscellaneousOperationProperty: INodeProperties = createResourceOperationProperty(
	"Miscellaneous",
	"resource_miscellaneous",
);
