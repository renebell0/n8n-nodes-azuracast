import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationRolesOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Roles",
	"resource_administration_roles",
);
