import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationDebuggingOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Debugging",
	"resource_administration_debugging",
);
