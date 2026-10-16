@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it, then run this file again.
  pause
  exit /b 1
)
set PORT=4175
start "" "http://127.0.0.1:4175"
node "%~dp0scripts\serve.mjs"
pause
