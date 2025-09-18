import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict
from models import (
    Server, ServerMetrics, Task, Alert, LoadBalanceStatus,
    SystemHealth, TimeSeriesData, ServerStatus, TaskStatus, AlertSeverity
)

class MockDataGenerator:
    def __init__(self):
        self.regions = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安"]
        self.service_types = ["web", "database", "cache", "message_queue", "file_storage", "api_gateway"]
        self.tags = ["生产", "测试", "开发", "关键业务", "高可用", "负载均衡", "数据库", "缓存"]

        # 服务器配置
        self.server_configs = [
            {"cores": 4, "memory": 16, "disk": 500},
            {"cores": 8, "memory": 32, "disk": 1000},
            {"cores": 16, "memory": 64, "disk": 2000},
            {"cores": 32, "memory": 128, "disk": 4000},
        ]

        self.servers = self._generate_servers()
        self.tasks = self._generate_tasks()
        self.alerts = self._generate_alerts()
        self.time_series_data = []

    def _generate_servers(self) -> List[Server]:
        servers = []
        for i in range(18):
            config = random.choice(self.server_configs)
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
                id=f"server-{i+1:03d}",
                name=f"{region}-{service_type}-{i+1:03d}",
                region=region,
                tags=server_tags,
                status=random.choice([ServerStatus.HEALTHY, ServerStatus.HEALTHY, ServerStatus.WARNING]),
                ip_address=f"192.168.{i//10}.{i%10+1}",
                cpu_cores=config["cores"],
                memory_gb=config["memory"],
                disk_gb=config["disk"],
                last_seen=datetime.now() - timedelta(minutes=random.randint(1, 30))
            )
            servers.append(server)

        # 添加一些离线和危险状态的服务器
        for i in range(3):
            server = servers[random.randint(0, len(servers)-1)]
            server.status = random.choice([ServerStatus.OFFLINE, ServerStatus.DANGER])

        return servers

    def _generate_tasks(self) -> List[Task]:
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

        tasks = []
        for i, template in enumerate(task_templates):
            target_servers = random.sample([s.id for s in self.servers], random.randint(3, 8))
            start_time = datetime.now() - timedelta(hours=random.randint(1, 12))
            duration = timedelta(minutes=random.randint(30, 120))

            task = Task(
                id=f"task-{i+1:03d}",
                name=template["name"],
                cluster=random.choice(self.regions),
                target_cluster=random.choice(self.regions),
                target_servers=target_servers,
                status=random.choice([TaskStatus.RUNNING, TaskStatus.COMPLETED, TaskStatus.PENDING]),
                progress=random.randint(0, 100),
                start_time=start_time,
                estimated_end_time=start_time + duration,
                description=template["description"]
            )
            tasks.append(task)

        return tasks

    def _generate_alerts(self) -> List[Alert]:
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

        alerts = []
        for i in range(15):
            alert = Alert(
                id=f"alert-{i+1:03d}",
                timestamp=datetime.now() - timedelta(minutes=random.randint(5, 120)),
                server_id=random.choice([s.id for s in self.servers]),
                severity=random.choice([AlertSeverity.HIGH, AlertSeverity.MEDIUM, AlertSeverity.LOW]),
                message=random.choice(alert_messages)
            )
            alerts.append(alert)

        # 按时间排序
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        return alerts

    def generate_metrics(self, server_id: str) -> ServerMetrics:
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

    def get_system_health(self) -> SystemHealth:
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
        # 获取所有服务器的网络流量
        network_data = []
        for server in self.servers:
            if server.status != ServerStatus.OFFLINE:
                metrics = self.generate_metrics(server.id)
                if metrics:
                    total_traffic = metrics.network_in_mbps + metrics.network_out_mbps
                    network_data.append(total_traffic)

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
        for i, server in enumerate(self.servers):
            if i < len(network_data):
                traffic_distribution[server.id] = network_data[i]

        return LoadBalanceStatus(
            is_balanced=ratio < 3.0,
            ratio=round(ratio, 2),
            server_count=len(network_data),
            traffic_distribution=traffic_distribution
        )

    def generate_time_series_data(self, minutes: int = 30) -> List[TimeSeriesData]:
        data = []
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=minutes)

        # 为每个指标类型生成时间序列数据
        metric_types = ["cpu_usage", "memory_usage", "disk_usage", "network_traffic"]

        for metric_type in metric_types:
            current_time = start_time
            while current_time <= end_time:
                # 为不同区域生成数据
                for region in self.regions[:4]:  # 取前4个区域
                    base_value = {
                        "cpu_usage": 50,
                        "memory_usage": 60,
                        "disk_usage": 40,
                        "network_traffic": 25
                    }.get(metric_type, 50)

                    # 添加时间趋势和随机波动
                    time_factor = math.sin((current_time - start_time).total_seconds() / 300) * 10
                    random_factor = random.uniform(-15, 15)
                    value = max(0, base_value + time_factor + random_factor)

                    data.append(TimeSeriesData(
                        timestamp=current_time,
                        value=round(value, 2),
                        metric_type=metric_type,
                        region=region
                    ))

                current_time += timedelta(seconds=30)  # 每30秒一个数据点

        return data

    def update_data(self):
        """更新实时数据"""
        # 更新任务进度
        for task in self.tasks:
            if task.status == TaskStatus.RUNNING:
                task.progress = min(100, task.progress + random.randint(1, 5))
                if task.progress >= 100:
                    task.status = TaskStatus.COMPLETED

        # 随机生成新的告警
        if random.random() < 0.1:  # 10%概率生成新告警
            alert_messages = [
                "CPU使用率异常",
                "内存泄漏检测",
                "网络连接中断",
                "磁盘空间不足",
                "服务响应超时"
            ]
            new_alert = Alert(
                id=f"alert-{len(self.alerts)+1:03d}",
                timestamp=datetime.now(),
                server_id=random.choice([s.id for s in self.servers]),
                severity=random.choice([AlertSeverity.HIGH, AlertSeverity.MEDIUM, AlertSeverity.LOW]),
                message=random.choice(alert_messages)
            )
            self.alerts.insert(0, new_alert)

        # 限制告警数量
        if len(self.alerts) > 20:
            self.alerts = self.alerts[:20]

        # 更新时间序列数据
        new_data = self.generate_time_series_data(minutes=1)
        self.time_series_data.extend(new_data)

        # 限制时间序列数据数量
        if len(self.time_series_data) > 1000:
            self.time_series_data = self.time_series_data[-1000:]

    def get_dashboard_data(self) -> Dict:
        """获取仪表板数据"""
        return {
            "servers": [server.dict() for server in self.servers],
            "metrics": [self.generate_metrics(server.id).dict() for server in self.servers if self.generate_metrics(server.id)],
            "tasks": [task.dict() for task in self.tasks],
            "alerts": [alert.dict() for alert in self.alerts[:10]],  # 只返回最新的10个告警
            "system_health": self.get_system_health().dict(),
            "load_balance": self.get_load_balance_status().dict(),
            "time_series": [data.dict() for data in self.time_series_data[-100:]]  # 返回最新的100个时间序列点
        }