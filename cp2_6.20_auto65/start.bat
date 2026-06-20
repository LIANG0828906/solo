@echo off
echo ========================================
echo 智能码头调度模拟器 - 启动脚本
echo ========================================
echo.

echo [1/2] 启动后端 FastAPI 服务...
start "Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt && python main.py"

echo 等待后端启动...
timeout /t 5 /nobreak > nul

echo.
echo [2/2] 启动前端开发服务器...
start "Frontend" cmd /k "cd /d %~dp0 && npm install && npm run dev"

echo.
echo ========================================
echo 服务启动中...
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8000
echo ========================================
echo.
pause
