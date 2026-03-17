import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const publicMiscellaneousOperationProperty: INodeProperties = createResourceOperationProperty(
	"Public: Miscellaneous",
	"resource_public_miscellaneous",
);
