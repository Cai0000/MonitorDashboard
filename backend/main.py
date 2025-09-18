from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, AsyncIterator
import asyncio
import json
from datetime import datetime, timedelta
from models import *
from data_generator import MockDataGenerator
from contextlib import asynccontextmanager

# 初始化数据生成器
data_generator = MockDataGenerator()

# 后台数据更新任务
async def background_data_updater():
    while True:
        try:
            data_generator.update_data()
            await asyncio.sleep(2)  # 每2秒更新一次
        except Exception as e:
            print(f"数据更新错误: {e}")
            await asyncio.sleep(5)

# 应用生命周期管理器
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 应用启动时执行
    # 初始化时间序列数据
    data_generator.time_series_data = data_generator.generate_time_series_data(minutes=15)

    # 启动后台数据更新任务
    asyncio.create_task(background_data_updater())
    print("后端服务器已启动。数据更新任务已初始化。")
    
    yield  # 应用运行期间
    
    # 应用关闭时执行(如果需要清理操作可以放在这里)
    pass

app = FastAPI(title="Monitor Dashboard API", version="1.0.0", lifespan=lifespan)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:5147"],  # 允许前端来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],   # 允许所有方法
    allow_headers=["*"],   # 允许所有头部
    expose_headers=["*"],  # 暴露所有头部
)
'''
@app.get("/")
async def root():
    return {"message": "Monitor Dashboard API is running", "timestamp": datetime.now()}

@app.get("/api/dashboard")
async def get_dashboard_data():
    """获取仪表板概览数据"""
    try:
        return data_generator.get_dashboard_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取仪表板数据时出错: {str(e)}")

@app.get("/api/servers")
async def get_servers(
    region: Optional[str] = Query(None, description="按区域筛选"),
    tag: Optional[str] = Query(None, description="按标签筛选"),
    status: Optional[ServerStatus] = Query(None, description="按状态筛选")
):
    """获取所有服务器信息"""
    try:
        servers = data_generator.servers

        if region:
            servers = [s for s in servers if s.region == region]
        if tag:
            servers = [s for s in servers if tag in s.tags]
        if status:
            servers = [s for s in servers if s.status == status]

        return [server.dict() for server in servers]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取服务器信息时出错: {str(e)}")

@app.get("/api/servers/{server_id}/metrics")
async def get_server_metrics(server_id: str):
    """获取指定服务器的指标数据"""
    try:
        metrics = data_generator.generate_metrics(server_id)
        if not metrics:
            raise HTTPException(status_code=404, detail=f"未找到服务器 {server_id}")
        return metrics.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取服务器指标时出错: {str(e)}")

@app.get("/api/metrics")
async def get_all_metrics():
    """获取所有服务器的指标数据"""
    try:
        metrics = []
        for server in data_generator.servers:
            server_metrics = data_generator.generate_metrics(server.id)
            if server_metrics:
                metrics.append(server_metrics.dict())
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取指标数据时出错: {str(e)}")

@app.get("/api/tasks")
async def get_tasks(
    status: Optional[TaskStatus] = Query(None, description="按状态筛选"),
    cluster: Optional[str] = Query(None, description="按集群筛选")
):
    """获取所有任务信息"""
    try:
        tasks = data_generator.tasks

        if status:
            tasks = [t for t in tasks if t.status == status]
        if cluster:
            tasks = [t for t in tasks if t.cluster == cluster]

        return [task.dict() for task in tasks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务信息时出错: {str(e)}")

@app.get("/api/tasks/{task_id}")
async def get_task_detail(task_id: str):
    """获取指定任务的详细信息"""
    try:
        task = next((t for t in data_generator.tasks if t.id == task_id), None)
        if not task:
            raise HTTPException(status_code=404, detail=f"未找到任务 {task_id}")
        return task.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务详情时出错: {str(e)}")

@app.get("/api/alerts")
async def get_alerts(
    severity: Optional[AlertSeverity] = Query(None, description="按严重程度筛选"),
    limit: int = Query(20, description="限制结果数量")
):
    """获取最近的警报信息"""
    try:
        alerts = data_generator.alerts

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        return [alert.dict() for alert in alerts[:limit]]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取警报信息时出错: {str(e)}")

@app.get("/api/system-health")
async def get_system_health():
    """获取系统整体健康状态"""
    try:
        return data_generator.get_system_health().dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取系统健康状态时出错: {str(e)}")

@app.get("/api/load-balance")
async def get_load_balance():
    """获取负载均衡状态"""
    try:
        return data_generator.get_load_balance_status().dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取负载均衡状态时出错: {str(e)}")

@app.get("/api/timeseries")
async def get_time_series_data(
    metric_type: Optional[str] = Query(None, description="指标类型: cpu_usage, memory_usage, disk_usage, network_traffic"),
    region: Optional[str] = Query(None, description="按区域筛选"),
    minutes: int = Query(15, description="时间范围（分钟）")
):
    """获取时间序列数据"""
    try:
        data = data_generator.time_series_data

        # 按时间范围筛选
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        data = [d for d in data if d.timestamp >= cutoff_time]

        # 按指标类型筛选
        if metric_type:
            data = [d for d in data if d.metric_type == metric_type]

        # 按区域筛选
        if region:
            data = [d for d in data if d.region == region]

        return [item.dict() for item in data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取时间序列数据时出错: {str(e)}")

@app.get("/api/stats")
async def get_statistics():
    """获取系统统计信息"""
    try:
        servers = data_generator.servers
        system_health = data_generator.get_system_health()

        stats = {
            "total_servers": len(servers),
            "servers_by_region": {},
            "servers_by_status": {
                "healthy": system_health.healthy_servers,
                "warning": system_health.warning_servers,
                "danger": system_health.danger_servers,
                "offline": system_health.offline_servers
            },
            "servers_by_service_type": {},
            "active_tasks": len([t for t in data_generator.tasks if t.status == TaskStatus.RUNNING]),
            "recent_alerts": len([a for a in data_generator.alerts if a.timestamp > datetime.now() - timedelta(hours=1)]),
            "load_balance_ratio": data_generator.get_load_balance_status().ratio
        }

        # 按区域统计服务器
        for server in servers:
            region = server.region
            if region not in stats["servers_by_region"]:
                stats["servers_by_region"][region] = 0
            stats["servers_by_region"][region] += 1

        # 按服务类型统计服务器
        for server in servers:
            for tag in server.tags:
                if tag in data_generator.service_types:
                    if tag not in stats["servers_by_service_type"]:
                        stats["servers_by_service_type"][tag] = 0
                    stats["servers_by_service_type"][tag] += 1

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息时出错: {str(e)}")

@app.get("/api/search")
async def search_data(
    q: str = Query(..., description="搜索查询"),
    type: str = Query("all", description="搜索类型: all, servers, tasks, alerts")
):
    """跨所有数据类型搜索"""
    try:
        query = q.lower()
        results = {
            "servers": [],
            "tasks": [],
            "alerts": []
        }

        if type in ["all", "servers"]:
            for server in data_generator.servers:
                if (query in server.name.lower() or
                    query in server.region.lower() or
                    any(query in tag.lower() for tag in server.tags)):
                    results["servers"].append(server.dict())

        if type in ["all", "tasks"]:
            for task in data_generator.tasks:
                if (query in task.name.lower() or
                    query in task.cluster.lower() or
                    query in task.description.lower()):
                    results["tasks"].append(task.dict())

        if type in ["all", "alerts"]:
            for alert in data_generator.alerts:
                if (query in alert.message.lower() or
                    query in alert.server_id.lower()):
                    results["alerts"].append(alert.dict())

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索数据时出错: {str(e)}")

# 注意：当使用 uvicorn.run 时，需要将 reload 设置为 False 或使用命令行方式启动
# 例如在命令行运行: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)