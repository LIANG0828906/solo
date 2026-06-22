@echo off
cd /d %~dp0
echo ========================================
echo  NarrativeForge Backend Server
echo ========================================
echo.
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

if not exist api\venv (
    echo [INFO] Creating virtual environment...
    cd api
    python -m venv venv
    cd ..
)

call api\venv\Scripts\activate.bat

echo [INFO] Checking dependencies...
pip show fastapi >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing dependencies...
    pip install -r api\requirements.txt
)

echo.
echo [INFO] Starting FastAPI server on http://localhost:8000
echo [INFO] API docs: http://localhost:8000/docs
echo.
cd api
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
cd ..
pause
