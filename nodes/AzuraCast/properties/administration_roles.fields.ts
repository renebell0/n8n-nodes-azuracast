import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationRolesFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Roles",
	"resource_administration_roles",
);
