# MonitorDashboard
系统监控 Web 面板，具备基础监控展示、交互与可视化，模拟数据驱动功能

> TODO ：抽空优化前后端数据传输方式：1. 使用websocket推送新数据，而不是前端轮询 2.折线图部分仅发送最新的数据，而不是整个数据

## 设计说明
**技术选型**：
- 前端：React 19 + Vite + 原生SVG图表
- 后端：FastAPI + Python + Pydantic
- 状态管理：React Hooks + Context API
- 样式：CSS变量

**AI 使用方式与关键收获**：

开发该项目时，我使用了claude code（GLM4.5）、roo code（GLM4.5）、ChatGPT、doubao、lingma辅助开发，使用方式与体会如下：
**Claude**
- 使用方式：核心开发、主动测试
- 优点：
	- 内置丰富的 tools，会做完整任务规划，自动完成代码生成、修改、测试阶段
	- 适合在完成项目架构设计的基础上使用
	- 可以通过用户prompt生成Agent
	- 在上下文容量耗尽时会自动打包再清空上下文
- 缺点：
	- 即使是改一行代码，也会动用工具大范围分析（除非加提示词），容易耗尽上下文
	- Claude Code 9 月后不支持中国用户，需通过其他 LLM 替代
	- 在文件写入时，中文会编程乱码
	- 内容较多时，端口会剧烈抖动
	- 一次授权，多次使用，如果这次改动的范围比较大，难免理不清修改逻辑，加上窗口抖动，体验很不好
	- 缺乏git历史，需要手动维护
	- 不太适合解释性和debug任务
	
**Roo Code和ChatGPT**
- 使用方式：架构设计和优化、代码解释
- 优点：
	- ChatGPT是通用大模型，数据丰富，在架构设计和项目优化方面可以给出比较好的建议
	- Roo Code支持Code、Architect、Ask模式，Architect可以完成系统设计与架构分析（Claude分析架构是否合理时仅仅扫描了文件是否有错）
	- 我主要使用ChatGPT完成架构设计，Roo Code在这方面还是有些不如chatgpt
	- Roo Code支持提示词优化，实现更高效的交互
	- Roo Code还可以实时显示上下文容量及已使用token量
- 缺点：
	- ChatGPT仅能支持小型项目设计
	- Roo Code比较耗费token
	- Roo Code每次访问文件都需要用户确认，安全但繁琐

**Lingma和豆包**
- 使用方式：Debug和代码解释
- 优点：
	- Lingma支持vscode插件，修改后结果能直接预览
	- lingma自带 Git 功能，能直观展示差异，支持切换分支
- 缺点：
	- 对于单个代码文件的解释与优化，豆包强于lingma，lingma可以分析2-3个代码文件之间的联系，但不支持大规模项目生成

## 项目结构设计
```
monitor-dashboard/
├─ backend/                          # 用于模拟 API
│  ├─ data_generator_new.py          # 模拟数据生成
│  └─ main.py                        # FastAPI 或 Express 服务
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx                      # 根组件
│  │  ├─ components/                  # UI组件
│  │  │  ├─ Header.jsx                # 顶部控制台
│  │  │  ├─ TaskManager.jsx           # 左侧任务列表
│  │  │  ├─ SystemStatus.jsx          # 中间系统状态# 右上系统状态
│  │  │  ├─ DataVisualCenter.jsx      # 可视化中心
│  │  ├─ hooks/                       
│  │  │  ├─ useApiData.jsx            # 
│  │  │  ├─ useMockData.jsx           # 任务管理
│  │  └─ services/            
│  │     └─ api.js                    # API调用封装
├─ logs/                              # AI调用日志
├─ README.md
├─ start_all.py                       # 启动所有服务
└─ .gitignore
```

## 运行说明
**快速启动** 

`MonitorDashboard/`
```bash
python start_all.py
```

**分别启动**

- 后端 

`MonitorDashboard/backend`
```bash
python start_server.py

# 或手动启动
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- 前端 

`MonitorDashboard/frontend`
```bash
npm install
npm run build
npm run dev
```

### 后端测试 
`MonitorDashboard/backend`
```bash
python test_api.py
```

### 访问地址

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **交互式API**: http://localhost:8000/redoc