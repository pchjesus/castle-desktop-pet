export type ExternalEventName='downloadComplete'|'powerAC'|'powerBattery'|'unlock';
export type ExternalSettingKey='braveDownload'|'powerAC'|'powerBattery'|'unlock';
export const EXTERNAL_EVENTS:Readonly<Record<ExternalEventName,Readonly<{text:string;source:string}>>>;
export const DEFAULT_EXTERNAL_SETTINGS:Readonly<Record<ExternalSettingKey,boolean>>;
export function normalizeExternalSettings(input:unknown):Record<ExternalSettingKey,boolean>;
export function enabledForEvent(settings:unknown,name:string):boolean;
