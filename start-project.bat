@echo off
title Start Finance Tracker Project (PHP + React)
echo =======================================================
echo Starting Finance Tracker (PHP Backend + React Frontend)
echo =======================================================

echo 1. Launching PHP Server on http://localhost:5000...
start "Finance Tracker - PHP Server" cmd /k "cd /d "%~dp0server" && run.bat"

echo 2. Launching React Vite Frontend on http://localhost:5173...
start "Finance Tracker - React Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo =======================================================
echo Both servers have been launched in separate windows!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo =======================================================
timeout /t 5 >nul
start http://localhost:5173
