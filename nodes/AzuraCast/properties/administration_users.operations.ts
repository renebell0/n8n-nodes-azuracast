import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationUsersOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Users",
	"resource_administration_users",
);
