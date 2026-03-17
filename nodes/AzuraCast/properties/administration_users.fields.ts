import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationUsersFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Users",
	"resource_administration_users",
);
