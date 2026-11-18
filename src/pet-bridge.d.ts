export {};
declare global {
 interface Window {
  pet?: {
   nativeWindow?:boolean;
   reportAction?:(value:Record<string,unknown>)=>void;
   reportCodexResult?:(value:{id:number;name:string;accepted:boolean})=>void;
   showMenu:()=>void;
   showSpeech?:(text:string)=>void;
   musicFile?:(index:number)=>Promise<{bytes:Uint8Array|number[]}>;
   musicStatus?:(value:{index:number;playing:boolean;time:number;duration:number;volume:number;rhythmFire:boolean;repeat:boolean;error:string})=>void;
   onMusic?:(callback:(value:import('./music/player').MusicCommand)=>void)=>()=>void;
   onAction:(callback:(state:string|{kind:'manual';id:number;pose:string}|{kind:'windows-event';name:string}|{kind:'favorite-dialogue';id:string})=>void)=>()=>void;
   setPassthrough:(ignore:boolean)=>void;
   setPointerHeld?:(held:boolean)=>void;
   dragStart:()=>void;
   dragMove:()=>void;
   dragEnd:()=>void;
  };
 }
}
