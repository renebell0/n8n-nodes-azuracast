import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationSettingsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Settings",
	"resource_administration_settings",
);
