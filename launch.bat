@echo off
start /b cmd /c "cd /d C:\Users\bfarfan\Downloads\Repo Bryan\OpenCut\motion-editor && node server.js"
timeout /t 5 /nobreak
echo Done - check if server is running at http://localhost:3000
pause