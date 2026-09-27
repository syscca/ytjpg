@echo off
setlocal
title ThumbForge Server - close this window to stop

rem Always serve from the folder where this script lives
cd /d "%~dp0"

set "PORT=8765"
set "URL=http://localhost:%PORT%/"

echo ============================================
echo   ThumbForge local server  (port %PORT%)
echo ============================================
echo.

rem ---------- 1. Server already running? Just open the browser ----------
netstat -ano | findstr "LISTENING" | findstr ":%PORT% " >nul 2>nul
if not errorlevel 1 (
  echo Server already running. Opening browser...
  start "" "%URL%"
  goto :eof
)

rem ---------- 2. Find a usable Python (py launcher first, then python) ----------
set "PYCMD="
py -3 --version >nul 2>nul && set "PYCMD=py -3"
if not defined PYCMD (
  python --version >nul 2>nul && set "PYCMD=python"
)
if not defined PYCMD (
  echo [ERROR] Python was not found.
  echo Please install Python 3 from https://www.python.org/downloads/
  echo and tick "Add Python to PATH" during setup.
  echo.
  pause
  exit /b 1
)
echo Using Python: %PYCMD%
echo.
echo Serving: %URL%
echo Close THIS window or press Ctrl+C to stop the website.
echo.

rem ---------- 3. Open the browser after a short delay (server needs a moment) ----------
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process '%URL%'"

rem ---------- 4. Run the server in the FOREGROUND of this window ----------
rem This blocks until you close the window or press Ctrl+C, then the site stops.
%PYCMD% -m http.server %PORT% --bind 127.0.0.1

endlocal
goto :eof
