import type {AddressInfo} from 'node:net';
export const BRAVE_PORT:number;
export function readOrCreateBraveToken(file:string):string;
export function createBraveDownloadServer(options:{
 token:string;onDownload:(event:'downloadComplete')=>void;host?:string;port?:number;
}):{start:()=>Promise<AddressInfo|string|null>;stop:()=>Promise<void>;server:import('node:http').Server};
