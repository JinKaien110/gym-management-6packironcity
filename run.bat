@echo off

echo Starting Backend...
start "Backend" /D "%~dp0backend" cmd /k "set NODE_OPTIONS=--require=./dns-fix.cjs && npm run dev"

echo Starting Frontend...
start "Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

pause