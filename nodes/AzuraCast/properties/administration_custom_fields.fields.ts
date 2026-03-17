import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationCustomFieldsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Custom Fields",
	"resource_administration_custom_fields",
);
