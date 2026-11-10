import type {ExternalSettingKey} from './external-events.mjs';
export function loadExternalSettings(file:string):Record<ExternalSettingKey,boolean>;
export function saveExternalSettings(file:string,settings:unknown):Record<ExternalSettingKey,boolean>;
