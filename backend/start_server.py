#!/usr/bin/env python3
"""
Monitor Dashboard Backend Server
启动脚本
"""

import subprocess
import sys
import os

def install_dependencies():
    """安装依赖"""
    print("正在安装依赖...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("依赖安装完成")
    except subprocess.CalledProcessError as e:
        print(f"依赖安装失败: {e}")
        sys.exit(1)

def start_server():
    """启动服务器"""
    print("正在启动后端服务器...")
    print("服务器将在 http://localhost:8000 运行")
    print("API文档: http://localhost:8000/docs")
    print("按 Ctrl+C 停止服务器")

    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except subprocess.CalledProcessError as e:
        print(f"服务器启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 检查是否需要安装依赖
    if not os.path.exists("requirements.txt"):
        print("错误: requirements.txt 文件不存在")
        sys.exit(1)

    install_dependencies()
    start_server()