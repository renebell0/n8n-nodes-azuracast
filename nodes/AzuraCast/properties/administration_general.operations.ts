import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationGeneralOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: General",
	"resource_administration_general",
);
