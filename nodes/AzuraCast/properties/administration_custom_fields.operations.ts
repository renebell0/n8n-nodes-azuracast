import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationCustomFieldsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Custom Fields",
	"resource_administration_custom_fields",
);
