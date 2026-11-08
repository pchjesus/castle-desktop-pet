export const defaults:{base:string;autonomy:boolean;autoFire:boolean};
export function normalizeSettings(value:unknown):{base:'idle'|'smoking';autonomy:boolean;autoFire:boolean};
export function createBehavior(options:{render:(pose:any)=>void;speak:(text:string,record?:any)=>void;settings?:unknown;random?:()=>number;now?:()=>number;setTimer?:any;clearTimer?:any;reduced?:()=>boolean}):{manual:(pose:any)=>void;click:()=>void;drag:()=>void;dragEnd:()=>void;configure:(value:unknown)=>void;visibility:(hidden:boolean)=>void;event:(name:string)=>boolean;dispose:()=>void;snapshot:()=>any};
