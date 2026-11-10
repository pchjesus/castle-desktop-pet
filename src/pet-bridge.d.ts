export {};
declare global {
 interface Window {
  pet?: {
   nativeWindow?:boolean;
   reportAction?:(value:Record<string,unknown>)=>void;
   reportCodexResult?:(value:{id:number;name:string;accepted:boolean})=>void;
   showMenu:()=>void;
   showSpeech?:(text:string)=>void;
   onAction:(callback:(state:string|{kind:'manual';id:number;pose:string}|{kind:'windows-event';name:string})=>void)=>()=>void;
   setPassthrough:(ignore:boolean)=>void;
   dragStart:()=>void;
   dragMove:()=>void;
   dragEnd:()=>void;
  };
 }
}
