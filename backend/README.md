# Monitor Dashboard Backend

后端服务器，提供模拟监控数据和API接口。

## 功能特性

- 🔄 实时数据生成和更新
- 📊 多维度数据（服务器、区域、服务类型）
- 🔍 强大的搜索和筛选功能
- 📈 时间序列数据支持
- 🚦 负载均衡和健康状态监控
- 🛡️ 错误处理和重试机制

## 数据模型

### 服务器信息
- 18台虚拟服务器，分布在北京、上海、广州、深圳等8个区域
- 6种服务类型：web、database、cache、message_queue、file_storage、api_gateway
- 包含CPU、内存、磁盘配置信息
- 实时状态监控

### 监控指标
- CPU使用率、内存使用率、磁盘使用率
- 网络I/O（入站/出站）
- 系统负载（1分钟、5分钟、15分钟）
- 健康状态评估

### 任务管理
- 8种不同类型的监控任务
- 实时进度更新
- 多服务器目标分配
- 状态跟踪（排队、运行中、完成、失败）

### 告警系统
- 多级严重程度（低、中、高）
- 实时告警生成
- 时间排序显示
- 服务器关联

## API接口

### 基础接口
- `GET /` - 服务器状态检查
- `GET /api/dashboard` - 获取完整仪表板数据
- `GET /api/stats` - 获取统计信息

### 服务器相关
- `GET /api/servers` - 获取服务器列表（支持按区域、标签、状态筛选）
- `GET /api/servers/{server_id}/metrics` - 获取特定服务器指标
- `GET /api/metrics` - 获取所有服务器最新指标

### 任务管理
- `GET /api/tasks` - 获取任务列表（支持按状态、集群筛选）
- `GET /api/tasks/{task_id}` - 获取任务详情

### 监控相关
- `GET /api/alerts` - 获取告警列表（支持按严重程度筛选）
- `GET /api/system-health` - 获取系统健康状态
- `GET /api/load-balance` - 获取负载均衡状态

### 数据分析
- `GET /api/timeseries` - 获取时间序列数据（支持按指标类型、区域、时间范围筛选）
- `GET /api/search` - 全文搜索（支持按类型筛选）

## 快速启动

### 方法1：使用启动脚本（推荐）
```bash
# 进入backend目录
cd backend

# 运行启动脚本
python start_server.py
```

### 方法2：手动启动
```bash
# 进入backend目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务器
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 服务器信息

启动后，服务器将在以下地址运行：
- **API服务器**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **交互式API**: http://localhost:8000/redoc

## API使用示例

### 获取完整仪表板数据
```bash
curl http://localhost:8000/api/dashboard
```

### 按区域筛选服务器
```bash
curl "http://localhost:8000/api/servers?region=北京"
```

### 搜索数据
```bash
curl "http://localhost:8000/api/search?q=数据库&type=all"
```

### 获取CPU使用率时间序列
```bash
curl "http://localhost:8000/api/timeseries?metric_type=cpu_usage&minutes=10"
```

## 数据更新机制

- **实时更新**: 每2秒自动更新所有数据
- **后台任务**: 使用asyncio处理定期数据更新
- **状态同步**: 服务器状态、任务进度、告警信息实时同步
- **时间序列**: 维护最近15分钟的历史数据

## 开发说明

### 添加新的监控指标
1. 在 `models.py` 中添加新的数据模型
2. 在 `data_generator.py` 中实现数据生成逻辑
3. 在 `main.py` 中添加对应的API接口

### 自定义数据生成规则
修改 `data_generator.py` 中的生成逻辑：
- 调整服务器数量和配置
- 修改指标生成算法
- 更新告警触发条件

### 扩展API功能
- 在 `main.py` 中添加新的路由
- 更新数据转换逻辑
- 添加参数验证和错误处理

## 故障排除

### 常见问题
1. **端口占用**: 修改启动命令中的端口号
2. **依赖问题**: 运行 `pip install -r requirements.txt` 重新安装
3. **CORS错误**: 确认前端地址在允许列表中
4. **数据生成异常**: 检查数据生成器日志

### 调试模式
```bash
# 启用调试模式
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

## 性能优化

- 数据缓存减少重复计算
- 异步处理提高响应速度
- 批量操作减少数据库查询
- 时间窗口限制内存使用