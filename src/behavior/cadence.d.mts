import type {BehaviorSettings,ActionWeightPose} from './controller.mjs';
export type FrequencyKind='movement'|'dialogue';
export type FrequencyPreset='quiet'|'default'|'active';
export const frequencies:Record<FrequencyKind,Readonly<Record<FrequencyPreset,readonly [number,number]>>>;
export const defaults:BehaviorSettings;
export const DEFAULT_ACTION_WEIGHTS:Readonly<Record<ActionWeightPose,number>>;
export const ACTION_WEIGHT_LIMIT:number;
export function normalizeSettings(value:unknown):BehaviorSettings;
export function cadence(kind:FrequencyKind,preset:FrequencyPreset,random:()=>number):number;
