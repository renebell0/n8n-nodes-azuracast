import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const myAccountFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"My Account",
	"resource_my_account",
);
