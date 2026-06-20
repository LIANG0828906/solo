@echo off
start cmd /k "cd /d %~dp0src\server && uvicorn backend:app --reload --port 8000"
timeout /t 3 /nobreak >nul
cd /d %~dp0 && npm run dev
