export {};
declare global {
 interface Window {
  pet?: {
   showMenu:()=>void;
   showSpeech?:(text:string)=>void;
   onAction:(callback:(state:string)=>void)=>()=>void;
   setPassthrough:(ignore:boolean)=>void;
   dragStart:()=>void;
   dragMove:()=>void;
   dragEnd:()=>void;
  };
 }
}
