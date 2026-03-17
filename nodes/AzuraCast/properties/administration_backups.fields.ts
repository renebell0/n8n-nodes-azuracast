import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationBackupsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Backups",
	"resource_administration_backups",
);
