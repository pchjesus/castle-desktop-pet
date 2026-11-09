import {BrowserWindow} from 'electron';
import {execFileSync} from 'node:child_process';
// QA-only, read-only Win32 evidence. Electron content bounds alone cannot prove
// that a native caption is absent. Restrict every HWND to this main process.
export function nativeWindowAudit(windows:{role:string;window:BrowserWindow}[]){
 if(process.platform!=='win32')return {platform:process.platform,windows:[]};
 const rows=windows.filter(row=>!row.window.isDestroyed()).map(({role,window})=>({role,handle:window.getNativeWindowHandle().readBigUInt64LE().toString(),title:window.getTitle(),visible:window.isVisible(),file:new URL(window.webContents.getURL()).pathname.split('/').at(-1),bounds:window.getBounds(),content:window.getContentBounds()}));
 const script=`$ErrorActionPreference='Stop'
 Add-Type -TypeDefinition @'
 using System; using System.Runtime.InteropServices;
 public class CastleWindowRead {
 [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] public static extern IntPtr GetWindowLongPtr(IntPtr h,int n);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 }
'@
 $rows=ConvertFrom-Json '${JSON.stringify(rows.map(r=>({role:r.role,handle:r.handle}))).replaceAll("'","''")}'
 $result=@(foreach($r in $rows){$h=[IntPtr]::new([long]$r.handle);[uint32]$owner=0;[void][CastleWindowRead]::GetWindowThreadProcessId($h,[ref]$owner);if($owner -ne ${process.pid}){throw 'HWND owner mismatch'};$s=[CastleWindowRead]::GetWindowLongPtr($h,-16).ToInt64();$e=[CastleWindowRead]::GetWindowLongPtr($h,-20).ToInt64();@{role=$r.role;style=('{0:X}' -f $s);exStyle=('{0:X}' -f $e);caption=(($s -band 0xC00000) -ne 0);layered=(($e -band 0x80000) -ne 0)}})
 ConvertTo-Json -Compress -InputObject $result`;
 const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true,timeout:15000});
 return {platform:process.platform,windows:rows,native:JSON.parse(output.trim())};
}
