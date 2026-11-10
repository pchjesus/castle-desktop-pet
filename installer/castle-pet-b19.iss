; B-19 user-approved standalone Windows installer.
; Uses the exact portable launcher and Electron runtime that pass native QA.
#define PetVersion "0.19.0"

[Setup]
AppName=Castle Desktop Pet
AppVersion={#PetVersion}
AppVerName=Castle Desktop Pet B-19
DefaultDirName={localappdata}\Programs\Castle Desktop Pet
DefaultGroupName=Castle Desktop Pet
OutputDir=..\dist-release
OutputBaseFilename=CastlePet-B19-Setup-x64
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
DisableProgramGroupPage=yes
CloseApplications=yes
UninstallDisplayIcon={app}\CastlePet.exe
ChangesEnvironment=no
ChangesAssociations=no
; This installer requires no elevation and makes no network requests.

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[Files]
Source: "..\dist-qa\CastlePetQA\CastlePet.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist-qa\CastlePetQA\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Castle Desktop Pet"; Filename: "{app}\CastlePet.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\Castle Desktop Pet"; Filename: "{app}\CastlePet.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\CastlePet.exe"; Description: "Launch Castle Desktop Pet"; Flags: nowait postinstall skipifsilent
