import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { executeOperationById } from '../AzuraCast.shared';

type AzuraCastOperationExecutor = (this: IExecuteFunctions) => Promise<INodeExecutionData[][]>;

export const myAccountResourceOperations: Record<string, AzuraCastOperationExecutor> = {
	"addMyApiKey": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "addMyApiKey");
	},
	"changeMyPassword": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "changeMyPassword");
	},
	"deleteAccountPasskey": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteAccountPasskey");
	},
	"deleteMyApiKey": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteMyApiKey");
	},
	"deleteMyTwoFactor": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "deleteMyTwoFactor");
	},
	"getAccountGetPasskey": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAccountGetPasskey");
	},
	"getAccountListPasskeys": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAccountListPasskeys");
	},
	"getAccountWebAuthnRegister": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getAccountWebAuthnRegister");
	},
	"getMe": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getMe");
	},
	"getMyApiKey": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getMyApiKey");
	},
	"getMyApiKeys": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getMyApiKeys");
	},
	"getMyTwoFactor": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "getMyTwoFactor");
	},
	"putAccountTwoFactor": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putAccountTwoFactor");
	},
	"putAccountWebAuthnRegister": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putAccountWebAuthnRegister");
	},
	"putMe": async function (this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executeOperationById.call(this, "putMe");
	},
};
