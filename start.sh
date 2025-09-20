@echo off
echo 启动后端服务...
start cmd /k "cd backend && python main.py"

echo 等待后端启动...
timeout /t 3 /nobreak >nul

echo 启动前端服务...
start cmd /k "cd frontend && npm run dev"

echo 前后端服务已启动