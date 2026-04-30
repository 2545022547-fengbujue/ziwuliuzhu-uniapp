Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d D:\WorkBuddyWorkspaces\ziwuliuzhu-uniapp && npx uni --host 0.0.0.0", 0, False
Set WshShell = Nothing
