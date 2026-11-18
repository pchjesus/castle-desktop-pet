export function parseMp3Range(value:string|null|undefined,size:number):{start:number;end:number;status:number};
export function streamSelectedMp3(filename:string,range?:string|null,signal?:AbortSignal,method?:string):Promise<Response>;
