import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const myAccountOperationProperty: INodeProperties = createResourceOperationProperty(
	"My Account",
	"resource_my_account",
);
