import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationSettingsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Settings",
	"resource_administration_settings",
);
