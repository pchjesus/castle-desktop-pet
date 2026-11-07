export {};
declare global {
 interface Window {
  pet?: {
   showMenu:()=>void;
   onAction:(callback:(state:string)=>void)=>()=>void;
   setPassthrough:(ignore:boolean)=>void;
   dragStart:()=>void;
   dragMove:()=>void;
   dragEnd:()=>void;
  };
 }
}
