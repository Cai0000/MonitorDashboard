#!/usr/bin/env python3
"""
Monitor Dashboard 全局启动脚本
同时启动前端和后端服务器
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def start_backend():
    """启动后端服务器"""
    print("🚀 启动后端服务器...")
    backend_dir = Path(__file__).parent / "backend"

    try:
        # 检查requirements.txt是否存在
        if not (backend_dir / "requirements.txt").exists():
            print("❌ 后端requirements.txt文件不存在")
            return False

        # 启动后端服务器
        process = subprocess.Popen([
            sys.executable, "start_server.py"
        ], cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # 等待服务器启动
        time.sleep(5)

        # 检查进程是否还在运行
        if process.poll() is None:
            print("✅ 后端服务器启动成功")
            print("📍 后端地址: http://localhost:8000")
            print("📚 API文档: http://localhost:8000/docs")
            return process
        else:
            print("❌ 后端服务器启动失败")
            return None

    except Exception as e:
        print(f"❌ 启动后端服务器时出错: {e}")
        return None

def start_frontend():
    """启动前端开发服务器"""
    print("🚀 启动前端开发服务器...")
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # 检查是否在正确的目录
        if not (frontend_dir / "package.json").exists():
            print("❌ 前端package.json文件不存在")
            return False

        # 启动前端开发服务器
        process = subprocess.Popen([
            "npm", "run", "dev"
        ], cwd=frontend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # 等待服务器启动
        time.sleep(5)

        # 检查进程是否还在运行
        if process.poll() is None:
            print("✅ 前端开发服务器启动成功")
            print("📍 前端地址: http://localhost:5173")
            return process
        else:
            print("❌ 前端开发服务器启动失败")
            return None

    except Exception as e:
        print(f"❌ 启动前端开发服务器时出错: {e}")
        return None

def check_dependencies():
    """检查依赖"""
    print("🔍 检查依赖...")

    # 检查Python
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        print(f"✅ Python版本: {result.stdout.strip()}")
    except:
        print("❌ Python未安装或不在PATH中")
        return False

    # 检查Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"✅ Node.js版本: {result.stdout.strip()}")
    except:
        print("❌ Node.js未安装或不在PATH中")
        return False

    # 检查npm
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        print(f"✅ npm版本: {result.stdout.strip()}")
    except:
        print("❌ npm未安装或不在PATH中")
        return False

    return True

def install_frontend_dependencies():
    """安装前端依赖"""
    print("📦 安装前端依赖...")
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        result = subprocess.run(["npm", "install"], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ 前端依赖安装成功")
            return True
        else:
            print(f"❌ 前端依赖安装失败: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ 安装前端依赖时出错: {e}")
        return False

def wait_for_user_input():
    """等待用户输入来停止服务器"""
    print("\n" + "="*60)
    print("🎉 Monitor Dashboard 已成功启动！")
    print("="*60)
    print("📍 前端地址: http://localhost:5173")
    print("📍 后端地址: http://localhost:8000")
    print("📚 API文档: http://localhost:8000/docs")
    print("="*60)
    print("💡 按 Ctrl+C 停止所有服务器")
    print("="*60)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 正在停止服务器...")

def main():
    """主函数"""
    print("🚀 Monitor Dashboard 启动器")
    print("="*50)

    # 检查依赖
    if not check_dependencies():
        print("❌ 依赖检查失败，请安装必要的依赖")
        sys.exit(1)

    # 安装前端依赖
    if not install_frontend_dependencies():
        print("❌ 前端依赖安装失败")
        sys.exit(1)

    # 启动服务器
    backend_process = start_backend()
    if not backend_process:
        print("❌ 后端服务器启动失败")
        sys.exit(1)

    frontend_process = start_frontend()
    if not frontend_process:
        print("❌ 前端服务器启动失败")
        backend_process.terminate()
        sys.exit(1)

    # 等待用户输入
    try:
        wait_for_user_input()
    except KeyboardInterrupt:
        pass
    finally:
        print("🛑 正在停止服务器...")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("✅ 所有服务器已停止")

if __name__ == "__main__":
    main()