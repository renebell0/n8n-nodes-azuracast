import type { INodeProperties } from 'n8n-workflow';
import { createResourceOperationProperty } from '../AzuraCast.shared';

export const administrationStorageLocationsOperationProperty: INodeProperties = createResourceOperationProperty(
	"Administration: Storage Locations",
	"resource_administration_storage_locations",
);
