$ErrorActionPreference = "Stop"
$workingDir = "C:\Users\bfarfan\Downloads\Repo Bryan\OpenCut\motion-editor"

$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = "cmd.exe"
$pinfo.Arguments = "/c cd /d $workingDir && node server.js"
$pinfo.UseShellExecute = $false
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true
$pinfo.CreateNoWindow = $false

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $pinfo
$p.Start() | Out-Null

Start-Sleep -Seconds 3

if (!$p.HasExited) {
    Write-Host "Server started! Go to http://localhost:3000"
    Write-Host "Press Enter to stop..."
    Read-Host
    $p.Kill()
} else {
    Write-Host "Server failed to start"
    Write-Host $p.StandardOutput.ReadToEnd()
    Write-Host $p.StandardError.ReadToEnd()
}