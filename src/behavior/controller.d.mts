export interface BehaviorSettings {base:'idle'|'smoking'|'sitting';autonomy:boolean;autoFire:boolean;movementFrequency:'quiet'|'default'|'active';dialogueEnabled:boolean;dialogueFrequency:'quiet'|'default'|'active'}
export const defaults:BehaviorSettings;
export function normalizeSettings(value:unknown):BehaviorSettings;
export function createBehavior(options:{render:(pose:any,context?:{source:string})=>void;speak:(text:string,record?:any)=>void;settings?:unknown;random?:()=>number;now?:()=>number;setTimer?:any;clearTimer?:any;reduced?:()=>boolean}):{manual:(pose:any)=>boolean;click:()=>void;drag:()=>void;dragEnd:()=>void;configure:(value:unknown)=>void;visibility:(hidden:boolean)=>void;event:(name:string)=>boolean;dispose:()=>void;snapshot:()=>any};
