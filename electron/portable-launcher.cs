using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Windows.Forms;

// Windows portable entry. No shell, download, registry change or elevation.
class CastlePetLauncher {
 static string Quote(string value) {
  var b=new StringBuilder("\"");int slashes=0;
  foreach(char c in value){if(c=='\\'){slashes++;continue;}if(c=='"'){b.Append('\\',slashes*2+1);b.Append(c);}else{b.Append('\\',slashes);b.Append(c);}slashes=0;}
  b.Append('\\',slashes*2);b.Append('"');return b.ToString();
 }
 static string Hash(string path){using(var sha=SHA256.Create())using(var file=File.OpenRead(path))return BitConverter.ToString(sha.ComputeHash(file)).Replace("-","").ToLowerInvariant();}
 static string Field(string json,string key){var m=Regex.Match(json,"\""+key+"\"\\s*:\\s*\"([a-f0-9]{64})\"");if(!m.Success)throw new Exception("Invalid runtime manifest: "+key);return m.Groups[1].Value;}
 [STAThread] static int Main(string[] args){
  string root=AppDomain.CurrentDomain.BaseDirectory, runtime=Path.Combine(root,"runtime"),app=Path.Combine(runtime,"resources","app");
  try{
   foreach(string relative in new[]{"electron.exe","ffmpeg.dll","icudtl.dat","resources/app/package.json","resources/app/dist-electron/main.cjs","resources/app/dist/index.html","resources/app/castle-runtime.json"})
    if(!File.Exists(Path.Combine(runtime,relative)))throw new Exception("Missing: "+relative);
   string manifest=File.ReadAllText(Path.Combine(app,"castle-runtime.json"));
   if(Hash(Path.Combine(app,"dist-electron/main.cjs"))!=Field(manifest,"mainSha256")||Hash(Path.Combine(app,"dist/index.html"))!=Field(manifest,"htmlSha256"))throw new Exception("Mixed or incomplete application files.");
   var arguments=new StringBuilder(Quote(app)+" --castle-pet-launcher");foreach(var arg in args)arguments.Append(" "+Quote(arg));
   using(var child=Process.Start(new ProcessStartInfo(Path.Combine(runtime,"electron.exe"),arguments.ToString()){WorkingDirectory=root,UseShellExecute=false,CreateNoWindow=true})){
    child.WaitForExit();return child.ExitCode;
   }
  }catch(Exception error){
   int report=Array.IndexOf(args,"--qa-report");
   if(report>=0&&report+1<args.Length)File.WriteAllText(args[report+1],"{\"passed\":false,\"launcherRejected\":true,\"error\":\"Extract the complete portable folder\"}");
   else MessageBox.Show("ZIP 파일 전체를 먼저 압축 풀기 한 뒤, 같은 폴더의 CastlePet.exe를 실행하세요.\n\n기존 펫은 우클릭 메뉴에서 종료해 주세요.\n\n"+error.Message,"캐슬 펫 · 실행 파일 확인",MessageBoxButtons.OK,MessageBoxIcon.Information);
   return 2;
  }
 }
}
