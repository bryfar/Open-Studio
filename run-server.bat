@echo off
setlocal enableextensions
cd /d "%~dp0"

:start
echo Starting server...
start /b cmd /c "node server.js > server.log 2>&1"
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo Server not responding, retrying...
    goto start
)
echo Server is running at http://localhost:3000
echo Press any key to stop...
pause >nul
taskkill /F /IM node.exe >nul 2>&1
endlocal