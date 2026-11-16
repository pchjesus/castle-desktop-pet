import type {Rectangle} from 'electron';
export interface FocusChromeWindow {
 isDestroyed():boolean;isVisible():boolean;isMinimized():boolean;
 getBounds():Rectangle;isResizable():boolean;
 setResizable(value:boolean):void;setBounds(bounds:Rectangle):void;
}
export interface FocusChromeStats {
 attempts:number;successes:number;lastReason:string|null;lastError:string|null;allowed:boolean;
}
export function createFocusChromeRepair(
 window:FocusChromeWindow,
 options?:{
  platform?:string;workArea?:(bounds:Rectangle)=>Rectangle|null;delayMs?:number;
  setTimer?:(handler:()=>void,ms:number)=>ReturnType<typeof setTimeout>;
  clearTimer?:(timer:ReturnType<typeof setTimeout>)=>void;
  onRepair?:(event:{reason:string;bounds:Rectangle;direction:number})=>void;
  onError?:(error:unknown)=>void;isDragging?:()=>boolean;
 }
):{
 schedule:(reason:string)=>boolean;perform:(reason:string)=>boolean;cancelPending:()=>boolean;dispose:()=>void;
 isRepairing:()=>boolean;stats:()=>FocusChromeStats;
};
