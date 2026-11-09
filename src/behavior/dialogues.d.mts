
export type DialogueRecord={id:string;text:string;origin:string;approval:string;poses:string[];triggers:string[];rarity:string;cooldownMs:number;random:boolean;source?:string};
export const dialogues:DialogueRecord[];
export const codexEvents:Record<string,{dialogue:string;sequence:string[]}>;
