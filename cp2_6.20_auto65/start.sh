#!/bin/bash
echo "========================================"
echo "智能码头调度模拟器 - 启动脚本"
echo "========================================"
echo ""

echo "[1/2] 启动后端 FastAPI 服务..."
cd backend
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!
cd ..

echo "等待后端启动..."
sleep 5

echo ""
echo "[2/2] 启动前端开发服务器..."
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "服务启动中..."
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:8000"
echo "========================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
