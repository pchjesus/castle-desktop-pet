export const MAX_TRACKS:number;
export const MAX_MP3_BYTES:number;
export function validMp3Path(file:unknown):file is string;
export function trackTitle(file:string):string;
export function normalizeLibrary(source:unknown):string[];
export function normalizeMusicSettings(source:unknown):{volume:number;rhythmFire:boolean;repeat:boolean};
