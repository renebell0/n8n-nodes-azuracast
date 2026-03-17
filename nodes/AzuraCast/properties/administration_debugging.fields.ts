import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationDebuggingFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Debugging",
	"resource_administration_debugging",
);
