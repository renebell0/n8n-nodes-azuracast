import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationGeneralFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: General",
	"resource_administration_general",
);
