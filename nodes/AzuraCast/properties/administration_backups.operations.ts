import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationBackupsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Backups",
	"resource_administration_backups",
);
