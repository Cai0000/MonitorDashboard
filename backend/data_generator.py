import asyncio
import random
import time
from collections import deque
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from models import (
    Server, ServerMetrics, Task, Alert, LoadBalanceStatus,
    SystemHealth, TimeSeriesData, ServerStatus, TaskStatus, AlertSeverity
)

class MockDataGenerator:
    def __init__(self):
        # 配置
        self.SERVER_IDS = [f"srv-{i:03d}" for i in range(1, 19)]  # 18台服务器
        self.HISTORY_WINDOW = 15 * 60  # 15 分钟
        self.INTERVAL = 2  # 每 2 秒生成一次数据
        self.regions = ["北京", "上海", "广州", "深圳", "杭州", "成都"]
        self.service_types = ["web", "database", "cache", "message_queue", "file_storage", "api_gateway"]
        self.tags = ["生产", "测试", "开发", "关键业务", "高可用", "负载均衡", "数据库", "缓存"]

        # 内存存储
        self.metrics_history = {s: deque(maxlen=self.HISTORY_WINDOW // self.INTERVAL) for s in self.SERVER_IDS}
        self.tasks_data = []
        self.alerts_data = deque(maxlen=100)
        self.time_series_data = []

        # 初始化服务器
        self.servers = self._generate_servers()
        
        # 初始化任务和告警
        for _ in range(8):
            self.tasks_data.append(self._generate_task())
        
        for _ in range(5):
            self.alerts_data.append(self._generate_alert())

    def _generate_servers(self) -> List[Server]:
        """生成服务器列表"""
        servers = []
        for i, server_id in enumerate(self.SERVER_IDS):
            region = random.choice(self.regions)
            service_type = random.choice(self.service_types)
            
            # 根据服务类型分配标签
            server_tags = [region, service_type]
            if service_type in ["database", "cache"]:
                server_tags.extend(["数据服务", "高可用"])
            if service_type in ["web", "api_gateway"]:
                server_tags.extend(["前端服务", "负载均衡"])
            if random.random() < 0.3:
                server_tags.append("关键业务")

            server = Server(
                id=server_id,
                name=f"{region}-{service_type}-{i+1:03d}",
                region=region,
                tags=server_tags,
                status=random.choice([ServerStatus.HEALTHY, ServerStatus.HEALTHY, ServerStatus.WARNING, ServerStatus.DANGER, ServerStatus.OFFLINE]),
                ip_address=f"192.168.{i//10}.{i%10+1}",
                cpu_cores=random.choice([4, 8, 16, 32]),
                memory_gb=random.choice([16, 32, 64, 128]),
                disk_gb=random.choice([500, 1000, 2000, 4000]),
                last_seen=datetime.now() - timedelta(minutes=random.randint(1, 30))
            )
            servers.append(server)
        return servers

    def _generate_metrics(self, server_id: str) -> ServerMetrics:
        """生成服务器指标数据"""
        # 查找服务器
        server = next((s for s in self.servers if s.id == server_id), None)
        if not server:
            return None
            
        # 根据服务器状态生成合理的指标
        if server.status == ServerStatus.HEALTHY:
            cpu_base = random.uniform(20, 70)
            memory_base = random.uniform(30, 75)
            disk_base = random.uniform(20, 80)
        elif server.status == ServerStatus.WARNING:
            cpu_base = random.uniform(60, 85)
            memory_base = random.uniform(70, 88)
            disk_base = random.uniform(70, 90)
        elif server.status == ServerStatus.DANGER:
            cpu_base = random.uniform(85, 98)
            memory_base = random.uniform(85, 95)
            disk_base = random.uniform(85, 98)
        else:  # OFFLINE
            cpu_base = random.uniform(0, 10)
            memory_base = random.uniform(0, 20)
            disk_base = random.uniform(0, 30)

        # 添加随机波动
        cpu_usage = max(0, min(100, cpu_base + random.uniform(-10, 10)))
        memory_usage = max(0, min(100, memory_base + random.uniform(-8, 8)))
        disk_usage = max(0, min(100, disk_base + random.uniform(-5, 5)))

        # 网络流量（根据服务类型调整）
        network_base = random.uniform(5, 50)
        network_in = max(0, network_base + random.uniform(-5, 15))
        network_out = max(0, network_base * 0.7 + random.uniform(-3, 10))

        # 系统负载
        load_1m = max(0, cpu_usage / 20 + random.uniform(-0.5, 0.5))
        load_5m = load_1m * 0.85 + random.uniform(-0.3, 0.3)
        load_15m = load_5m * 0.9 + random.uniform(-0.2, 0.2)

        return ServerMetrics(
            server_id=server_id,
            timestamp=datetime.now(),
            cpu_usage=round(cpu_usage, 2),
            memory_usage=round(memory_usage, 2),
            disk_usage=round(disk_usage, 2),
            network_in_mbps=round(network_in, 2),
            network_out_mbps=round(network_out, 2),
            load_1m=round(load_1m, 2),
            load_5m=round(load_5m, 2),
            load_15m=round(load_15m, 2)
        )

    def _generate_task(self) -> Task:
        """生成任务数据"""
        task_templates = [
            {"name": "服务器性能监控", "description": "监控服务器CPU、内存、磁盘使用情况"},
            {"name": "网络流量分析", "description": "分析网络流量模式和异常情况"},
            {"name": "安全扫描任务", "description": "扫描服务器安全漏洞和威胁"},
            {"name": "数据库备份", "description": "备份关键数据库数据"},
            {"name": "日志收集任务", "description": "收集和整理系统日志"},
            {"name": "系统更新部署", "description": "部署系统更新和安全补丁"},
            {"name": "负载均衡检查", "description": "检查负载均衡器状态和配置"},
            {"name": "缓存清理", "description": "清理过期缓存数据"},
        ]
        
        task_statuses = [
            TaskStatus.PENDING, 
            TaskStatus.RUNNING, 
            TaskStatus.COMPLETED, 
            TaskStatus.FAILED
        ]
        
        template = random.choice(task_templates)
        
        return Task(
            id=f"task-{int(time.time() * 1000)}",
            name=template["name"],
            cluster=random.choice(self.regions),
            target_cluster=random.choice(self.regions),
            target_servers=random.sample(self.SERVER_IDS, random.randint(3, 8)),
            status=random.choice(task_statuses),
            progress=random.randint(0, 100),
            start_time=datetime.now() - timedelta(minutes=random.randint(1, 120)),
            estimated_end_time=datetime.now() + timedelta(minutes=random.randint(1, 60)),
            description=template["description"]
        )

    def _generate_alert(self) -> Alert:
        """生成告警数据"""
        severities = [
            AlertSeverity.LOW,
            AlertSeverity.MEDIUM,
            AlertSeverity.HIGH
        ]
        
        alert_messages = [
            "CPU使用率超过90%",
            "内存使用率超过85%",
            "磁盘空间不足",
            "网络延迟过高",
            "数据库连接数过多",
            "服务响应时间过长",
            "系统负载过高",
            "磁盘I/O异常",
            "网络连接中断",
            "进程无响应",
            "内存泄漏检测",
            "防火墙规则异常"
        ]
        
        return Alert(
            id=f"alert-{int(time.time() * 1000)}",
            timestamp=datetime.now() - timedelta(minutes=random.randint(1, 60)),
            server_id=random.choice(self.SERVER_IDS),
            severity=random.choice(severities),
            message=random.choice(alert_messages)
        )

    def _generate_time_series_data(self, minutes: int = 30) -> List[TimeSeriesData]:
        """生成时间序列数据"""
        data = []
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=minutes)

        # 为每个指标类型生成时间序列数据
        metric_types = ["cpu_usage", "memory_usage", "disk_io", "network_in", "network_out", "load_1m", "load_5m", "load_15m"]

        for metric_type in metric_types:
            current_time = start_time
            while current_time <= end_time:
                # 为不同服务器和区域生成数据
                for server in self.servers:
                    base_value = {
                        "cpu_usage": 50,
                        "memory_usage": 60,
                        "disk_io": 25,  # MB/s
                        "network_in": 15,  # KB/s
                        "network_out": 12,  # KB/s
                        "load_1m": 1.2,
                        "load_5m": 1.0,
                        "load_15m": 0.8
                    }.get(metric_type, 50)

                    # 添加时间趋势和随机波动
                    time_factor = random.uniform(-15, 15)
                    value = max(0, base_value + time_factor)
                    
                    # 对于负载指标，确保不为负数
                    if "load" in metric_type:
                        value = max(0, value)

                    data.append(TimeSeriesData(
                        timestamp=current_time,
                        value=round(value, 2),
                        metric_type=metric_type,
                        server_id=server.id,
                        region=server.region,
                        service_type=random.choice(server.tags)
                    ))

                current_time += timedelta(seconds=10)  # 每10秒一个数据点

        return data

    def generate_metrics(self, server_id: str) -> ServerMetrics:
        """生成并返回指定服务器的指标"""
        return self._generate_metrics(server_id)

    def get_system_health(self) -> SystemHealth:
        """获取系统健康状态"""
        total = len(self.servers)
        healthy = sum(1 for s in self.servers if s.status == ServerStatus.HEALTHY)
        warning = sum(1 for s in self.servers if s.status == ServerStatus.WARNING)
        danger = sum(1 for s in self.servers if s.status == ServerStatus.DANGER)
        offline = sum(1 for s in self.servers if s.status == ServerStatus.OFFLINE)

        # 确定整体状态
        if danger > 0 or (warning / total > 0.3):
            overall_status = ServerStatus.DANGER
        elif warning > 0 or (healthy / total < 0.8):
            overall_status = ServerStatus.WARNING
        else:
            overall_status = ServerStatus.HEALTHY

        return SystemHealth(
            overall_status=overall_status,
            total_servers=total,
            healthy_servers=healthy,
            warning_servers=warning,
            danger_servers=danger,
            offline_servers=offline,
            timestamp=datetime.now()
        )

    def get_load_balance_status(self) -> LoadBalanceStatus:
        """获取负载均衡状态"""
        # 获取所有服务器的网络流量
        network_data = []
        server_ids = []
        for server in self.servers:
            if server.status != ServerStatus.OFFLINE:
                metrics = self._generate_metrics(server.id)
                if metrics:
                    total_traffic = metrics.network_in_mbps + metrics.network_out_mbps
                    network_data.append(total_traffic)
                    server_ids.append(server.id)

        if not network_data:
            return LoadBalanceStatus(
                is_balanced=True,
                ratio=1.0,
                server_count=0,
                traffic_distribution={}
            )

        max_traffic = max(network_data)
        min_traffic = min(network_data)
        ratio = max_traffic / min_traffic if min_traffic > 0 else 1.0

        # 生成流量分布
        traffic_distribution = {}
        for i, server_id in enumerate(server_ids):
            if i < len(network_data):
                traffic_distribution[server_id] = network_data[i]

        return LoadBalanceStatus(
            is_balanced=ratio < 3.0,
            ratio=round(ratio, 2),
            server_count=len(network_data),
            traffic_distribution=traffic_distribution
        )

    def generate_time_series_data(self, minutes: int = 30) -> List[TimeSeriesData]:
        """生成时间序列数据"""
        return self._generate_time_series_data(minutes)

    def update_data(self):
        """更新实时数据"""
        # 更新任务进度
        for task in self.tasks_data:
            if task.status == TaskStatus.RUNNING:
                task.progress = min(100, task.progress + random.randint(1, 5))
                if task.progress >= 100:
                    task.status = TaskStatus.COMPLETED
            elif random.random() < 0.1:  # 10%概率改变任务状态
                task.status = random.choice([TaskStatus.RUNNING, TaskStatus.FAILED, TaskStatus.PENDING])

        # 随机生成新的任务
        if random.random() < 0.2:  # 20%概率生成新任务
            self.tasks_data.append(self._generate_task())
            
        # 限制任务数量
        if len(self.tasks_data) > 20:
            self.tasks_data = self.tasks_data[-20:]

        # 随机生成新的告警
        if random.random() < 0.15:  # 15%概率生成新告警
            new_alert = self._generate_alert()
            self.alerts_data.append(new_alert)

        # 限制告警数量
        if len(self.alerts_data) > 20:
            self.alerts_data = deque(list(self.alerts_data)[-20:], maxlen=100)

        # 更新时间序列数据（更频繁地生成数据）
        new_data = self._generate_time_series_data(minutes=0.5)  # 30秒数据
        self.time_series_data.extend(new_data)

        # 限制时间序列数据数量
        if len(self.time_series_data) > 5000:  # 增加数据存储量
            self.time_series_data = self.time_series_data[-5000:]

    def get_grouped_server_data(self) -> Dict:
        """获取分组服务器数据"""
        grouped_data = {
            "by_region": {},
            "by_service_type": {},
            "by_status": {},
            "overall": {
                "healthy": 0,
                "warning": 0,
                "danger": 0,
                "offline": 0
            }
        }

        # 按区域分组
        for region in self.regions:
            region_servers = [s for s in self.servers if s.region == region]
            grouped_data["by_region"][region] = {
                "total": len(region_servers),
                "healthy": len([s for s in region_servers if s.status == ServerStatus.HEALTHY]),
                "warning": len([s for s in region_servers if s.status == ServerStatus.WARNING]),
                "danger": len([s for s in region_servers if s.status == ServerStatus.DANGER]),
                "offline": len([s for s in region_servers if s.status == ServerStatus.OFFLINE]),
                "servers": [s.dict() for s in region_servers]
            }

        # 按服务类型分组
        for service_type in self.service_types:
            service_servers = [s for s in self.servers if service_type in s.tags]
            grouped_data["by_service_type"][service_type] = {
                "total": len(service_servers),
                "healthy": len([s for s in service_servers if s.status == ServerStatus.HEALTHY]),
                "warning": len([s for s in service_servers if s.status == ServerStatus.WARNING]),
                "danger": len([s for s in service_servers if s.status == ServerStatus.DANGER]),
                "offline": len([s for s in service_servers if s.status == ServerStatus.OFFLINE]),
                "servers": [s.dict() for s in service_servers]
            }

        # 按状态分组
        for status in [ServerStatus.HEALTHY, ServerStatus.WARNING, ServerStatus.DANGER, ServerStatus.OFFLINE]:
            status_servers = [s for s in self.servers if s.status == status]
            grouped_data["by_status"][status.value] = {
                "total": len(status_servers),
                "servers": [s.dict() for s in status_servers]
            }

        # 整体统计
        grouped_data["overall"] = {
            "healthy": len([s for s in self.servers if s.status == ServerStatus.HEALTHY]),
            "warning": len([s for s in self.servers if s.status == ServerStatus.WARNING]),
            "danger": len([s for s in self.servers if s.status == ServerStatus.DANGER]),
            "offline": len([s for s in self.servers if s.status == ServerStatus.OFFLINE])
        }

        return grouped_data

    def get_dashboard_data(self) -> Dict:
        """获取仪表板数据"""
        return {
            "servers": [server.dict() for server in self.servers],
            "metrics": [self._generate_metrics(server.id).dict() for server in self.servers if self._generate_metrics(server.id)],
            "tasks": [task.dict() for task in self.tasks_data],
            "alerts": [alert.dict() for alert in list(self.alerts_data)[-10:]],  # 只返回最新的10个告警
            "system_health": self.get_system_health().dict(),
            "load_balance": self.get_load_balance_status().dict(),
            "time_series": [data.dict() for data in self.time_series_data[-500:]],  # 返回最新的500个时间序列点
            "grouped_data": self.get_grouped_server_data()
        }