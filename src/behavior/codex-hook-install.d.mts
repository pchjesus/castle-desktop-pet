export interface CodexIntegrationOptions {
 home?:string;
 codexHome?:string;
 appData?:string;
 platform?:string;
}
export interface CodexIntegrationPaths {config:string;script:string}
export interface CodexIntegrationStatus {
 configured:boolean;configPath:string;scriptPath:string;scriptPresent:boolean;error:string|null;
}
export const HOOK_LABEL:string;
export function codexIntegrationPaths(options?:CodexIntegrationOptions):CodexIntegrationPaths;
export function inspectCodexIntegration(options?:CodexIntegrationOptions):CodexIntegrationStatus;
export function configureCodexIntegration(
 command:'install'|'uninstall'|'status',
 options?:CodexIntegrationOptions&{hookSource?:string|null}
):CodexIntegrationStatus&{command:string;changed:boolean};
