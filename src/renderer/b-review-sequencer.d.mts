export const sequences: Record<string,[string,number][]>;
export function createBReview(show:(name:string)=>void):{start(name:string,options?:{repeat?:boolean;speed?:number}):void;pause(value:boolean):void;reduced(value:boolean):void;cancel():void;dispose():void;readonly running:boolean};
