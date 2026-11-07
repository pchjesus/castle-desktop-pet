export {};
declare global {
 interface Window {
  pet?: {
   showMenu:()=>void;
   onAction: (callback: (state: string) => void) => () => void;
  };
 }
}
