import type { INodeProperties } from 'n8n-workflow';
import { createResourceFieldProperties } from '../AzuraCast.shared';

export const administrationStorageLocationsFieldProperties: INodeProperties[] = createResourceFieldProperties(
	"Administration: Storage Locations",
	"resource_administration_storage_locations",
);
