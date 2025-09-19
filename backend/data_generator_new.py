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
        # 配置 - 基于新的数据结构
        self.CLUSTERS_COUNT = 3
        self.SERVERS_PER_CLUSTER = 2

        # 模拟 faker 的数据生成
        self.regions = ["香港", "贵州", "新加坡", "广州", "北京", "上海", "深圳", "杭州"]
        self.service_types = ["web", "db", "cache", "message_queue", "file_storage", "api_gateway"]
        self.adjectives = ["secure", "fast", "reliable", "scalable", "efficient", "robust", "dynamic", "static"]
        self.nouns = ["system", "network", "database", "cache", "server", "cluster", "node", "endpoint"]
        self.verbs = ["process", "handle", "manage", "monitor", "execute", "run", "serve", "respond"]
        self.phrases = [
            "System overload detected", "Memory usage critical", "Network latency high",
            "Disk space low", "CPU usage abnormal", "Service response timeout",
            "Connection pool exhausted", "Cache miss rate high", "Database slow query",
            "Load balancer failure", "Authentication error", "Authorization failed"
        ]

        # 内存存储
        self.metrics_history = {}
        self.tasks_data = []
        self.alerts_data = deque(maxlen=100)
        self.time_series_data = []

        # 初始化数据
        self.clusters = self._generate_clusters()
        self.servers = self._generate_servers()

        # 初始化任务和告警
        for _ in range(10):
            self.tasks_data.append(self._generate_task())

        for _ in range(20):
            self.alerts_data.append(self._generate_alert())

        # 初始化指标历史
        for server in self.servers:
            self.metrics_history[server["serverId"]] = deque(maxlen=450)

    def _generate_clusters(self) -> List[Dict]:
        """生成集群数据"""
        clusters = []
        for i in range(self.CLUSTERS_COUNT):
            cluster_id = f"cluster-{i + 1}"
            server_ids = [f"srv-{i + 1}-{j + 1}" for j in range(self.SERVERS_PER_CLUSTER)]
            clusters.append({
                "clusterId": cluster_id,
                "clusterName": self._generate_cluster_name(),
                "region": random.choice(self.regions),
                "tags": [random.choice(self.adjectives), random.choice(self.nouns)],
                "serviceType": random.choice(self.service_types),
                "serverIds": server_ids,
            })
        return clusters

    def _generate_cluster_name(self) -> str:
        """生成集群名称"""
        names = [
            "Production Cluster", "Development Cluster", "Testing Cluster",
            "Staging Environment", "Production East", "Production West",
            "Database Cluster", "Application Cluster", "Cache Cluster"
        ]
        return random.choice(names)

    def _generate_servers(self) -> List[Dict]:
        """生成服务器数据"""
        servers = []
        for cluster in self.clusters:
            for server_id in cluster["serverIds"]:
                servers.append({
                    "serverId": server_id,
                    "serverName": self._generate_server_name(),
                    "region": random.choice(self.regions),  # 服务器可以位于不同地域
                    "tags": [random.choice(self.verbs), random.choice(self.adjectives)],
                    "serviceType": cluster["serviceType"],
                    "clusterId": cluster["clusterId"],
                    # 新增服务器状态信息
                    "status": random.choice(["healthy", "warning", "danger", "offline"]),
                    "ipAddress": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    "cpuCores": random.choice([4, 8, 16, 32]),
                    "memoryGB": random.choice([16, 32, 64, 128]),
                    "diskGB": random.choice([500, 1000, 2000, 4000]),
                    "lastSeen": datetime.now() - timedelta(minutes=random.randint(1, 30))
                })
        return servers

    def _generate_server_name(self) -> str:
        """生成服务器名称"""
        prefixes = ["web", "app", "db", "cache", "api", "mq", "storage", "auth"]
        suffixes = ["server", "node", "host", "instance", "container", "vm"]
        return f"{random.choice(prefixes)}-{random.choice(suffixes)}-{random.randint(1, 999)}"

    def _generate_task(self) -> Dict:
        """生成任务数据"""
        return {
            "taskId": f"task-{int(time.time() * 1000)}",
            "taskName": random.choice(self.phrases),
            "cluster": random.choice(self.clusters)["clusterId"],
            "targetCluster": random.choice(self.clusters)["clusterId"],
            "status": random.choice(["queued", "running", "failed", "completed"]),
            "progress": random.randint(0, 100),
            "createdAt": int(time.time() * 1000) - random.randint(0, 3600) * 1000,
            "startTime": datetime.now() - timedelta(minutes=random.randint(1, 120)),
            "estimatedEndTime": datetime.now() + timedelta(minutes=random.randint(1, 60)),
            "description": f"Task for system monitoring"
        }

    def _generate_alert(self) -> Dict:
        """生成告警数据"""
        server = random.choice(self.servers)
        return {
            "alarmId": f"alarm-{int(time.time() * 1000)}",
            "serverId": server["serverId"],
            "timestamp": int(time.time() * 1000) - random.randint(0, 1800) * 1000,
            "source": random.choice(["nginx", "disk-monitor", "task-runner", "system", "network"]),
            "severity": random.choice(["low", "medium", "high"]),
            "message": random.choice(self.phrases),
            "resolved": random.random() < 0.3
        }

    def _generate_time_series_data(self, minutes: int = 30) -> List[TimeSeriesData]:
        """生成时间序列数据"""
        data = []
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=minutes)

        metric_types = ["cpu_usage", "memory_usage", "disk_io", "network_in", "network_out"]

        for metric_type in metric_types:
            current_time = start_time
            while current_time <= end_time:
                for server in self.servers:
                    base_value = {
                        "cpu_usage": 50,
                        "memory_usage": 60,
                        "disk_io": 25,
                        "network_in": 15,
                        "network_out": 12
                    }.get(metric_type, 50)

                    time_factor = random.uniform(-15, 15)
                    value = max(0, base_value + time_factor)

                    data.append(TimeSeriesData(
                        timestamp=current_time,
                        value=round(value, 2),
                        metric_type=metric_type,
                        server_id=server["serverId"],
                        region=server["region"],
                        service_type=server["serviceType"]
                    ))

                current_time += timedelta(seconds=10)

        return data

    def update_data(self):
        """更新实时数据"""
        # 更新任务进度
        for task in self.tasks_data:
            if task["status"] == "running":
                task["progress"] = min(100, task["progress"] + random.randint(1, 5))
                if task["progress"] >= 100:
                    task["status"] = "completed"
            elif random.random() < 0.1:
                task["status"] = random.choice(["running", "failed", "queued"])

        # 随机生成新的任务
        if random.random() < 0.2:
            self.tasks_data.append(self._generate_task())

        # 限制任务数量
        if len(self.tasks_data) > 20:
            self.tasks_data = self.tasks_data[-20:]

        # 随机生成新的告警
        if random.random() < 0.15:
            new_alert = self._generate_alert()
            self.alerts_data.append(new_alert)

        # 限制告警数量
        if len(self.alerts_data) > 20:
            self.alerts_data = deque(list(self.alerts_data)[-20:], maxlen=100)

        # 更新时间序列数据
        new_data = self._generate_time_series_data(minutes=1)
        self.time_series_data.extend(new_data)

        # 限制时间序列数据数量
        if len(self.time_series_data) > 5000:
            self.time_series_data = self.time_series_data[-5000:]

    def get_system_health(self) -> SystemHealth:
        """获取系统健康状态"""
        total = len(self.servers)
        healthy = sum(1 for s in self.servers if s["status"] == "healthy")
        warning = sum(1 for s in self.servers if s["status"] == "warning")
        danger = sum(1 for s in self.servers if s["status"] == "danger")
        offline = sum(1 for s in self.servers if s["status"] == "offline")

        # 确定整体状态
        if danger > 0 or (warning / total > 0.3):
            overall_status = "danger"
        elif warning > 0 or (healthy / total < 0.8):
            overall_status = "warning"
        else:
            overall_status = "healthy"

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
        network_data = []
        server_ids = []

        for server in self.servers:
            if server["status"] != "offline":
                # 生成当前指标
                metrics = self._generate_single_server_metrics(server["serverId"])
                total_traffic = metrics.network_in_mbps + metrics.network_out_mbps
                network_data.append(total_traffic)
                server_ids.append(server["serverId"])

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

        traffic_distribution = {}
        for i, server_id in enumerate(server_ids):
            if i < len(network_data):
                traffic_distribution[server_id] = network_data[i]

        return LoadBalanceStatus(
            is_balanced=ratio < 3.0,
            ratio=round(ratio, 2),
            server_count=len(network_data),  # 修复：确保返回正确的服务器数量
            traffic_distribution=traffic_distribution
        )

    def _generate_single_server_metrics(self, server_id: str) -> ServerMetrics:
        """为单个服务器生成指标"""
        server = next((s for s in self.servers if s["serverId"] == server_id), None)
        if not server:
            return None

        if server["status"] == "healthy":
            cpu_base = random.uniform(20, 70)
            memory_base = random.uniform(30, 75)
        elif server["status"] == "warning":
            cpu_base = random.uniform(60, 85)
            memory_base = random.uniform(70, 88)
        elif server["status"] == "danger":
            cpu_base = random.uniform(85, 98)
            memory_base = random.uniform(85, 95)
        else:  # offline
            cpu_base = random.uniform(0, 10)
            memory_base = random.uniform(0, 20)

        cpu_usage = max(0, min(100, cpu_base + random.uniform(-10, 10)))
        memory_usage = max(0, min(100, memory_base + random.uniform(-8, 8)))

        network_in = max(0, random.uniform(5, 50) + random.uniform(-5, 15))
        network_out = max(0, network_in * 0.7 + random.uniform(-3, 10))

        load_1m = max(0, cpu_usage / 20 + random.uniform(-0.5, 0.5))
        load_5m = load_1m * 0.85 + random.uniform(-0.3, 0.3)
        load_15m = load_5m * 0.9 + random.uniform(-0.2, 0.2)

        return ServerMetrics(
            server_id=server_id,
            timestamp=datetime.now(),
            cpu_usage=round(cpu_usage, 2),
            memory_usage=round(memory_usage, 2),
            disk_usage=round(random.uniform(20, 80), 2),
            network_in_mbps=round(network_in, 2),
            network_out_mbps=round(network_out, 2),
            load_1m=round(load_1m, 2),
            load_5m=round(load_5m, 2),
            load_15m=round(load_15m, 2)
        )

    def get_grouped_server_data(self) -> Dict:
        """获取分组服务器数据"""
        grouped_data = {
            "by_region": {},
            "by_service_type": {},
            "by_cluster": {},  # 新增按集群分组
            "overall": {
                "healthy": 0,
                "warning": 0,
                "danger": 0,
                "offline": 0
            }
        }

        # 按区域分组
        for region in self.regions:
            region_servers = [s for s in self.servers if s["region"] == region]
            grouped_data["by_region"][region] = {
                "total": len(region_servers),
                "healthy": len([s for s in region_servers if s["status"] == "healthy"]),
                "warning": len([s for s in region_servers if s["status"] == "warning"]),
                "danger": len([s for s in region_servers if s["status"] == "danger"]),
                "offline": len([s for s in region_servers if s["status"] == "offline"]),
                "servers": region_servers
            }

        # 按服务类型分组
        for service_type in self.service_types:
            service_servers = [s for s in self.servers if s["serviceType"] == service_type]
            grouped_data["by_service_type"][service_type] = {
                "total": len(service_servers),
                "healthy": len([s for s in service_servers if s["status"] == "healthy"]),
                "warning": len([s for s in service_servers if s["status"] == "warning"]),
                "danger": len([s for s in service_servers if s["status"] == "danger"]),
                "offline": len([s for s in service_servers if s["status"] == "offline"]),
                "servers": service_servers
            }

        # 按集群分组
        for cluster in self.clusters:
            cluster_servers = [s for s in self.servers if s["clusterId"] == cluster["clusterId"]]
            grouped_data["by_cluster"][cluster["clusterId"]] = {
                "total": len(cluster_servers),
                "healthy": len([s for s in cluster_servers if s["status"] == "healthy"]),
                "warning": len([s for s in cluster_servers if s["status"] == "warning"]),
                "danger": len([s for s in cluster_servers if s["status"] == "danger"]),
                "offline": len([s for s in cluster_servers if s["status"] == "offline"]),
                "servers": cluster_servers
            }

        # 整体统计
        grouped_data["overall"] = {
            "healthy": len([s for s in self.servers if s["status"] == "healthy"]),
            "warning": len([s for s in self.servers if s["status"] == "warning"]),
            "danger": len([s for s in self.servers if s["status"] == "danger"]),
            "offline": len([s for s in self.servers if s["status"] == "offline"])
        }

        return grouped_data

    def get_dashboard_data(self) -> Dict:
        """获取仪表板数据"""
        return {
            "clusters": self.clusters,
            "servers": self.servers,
            "metrics": [self._generate_single_server_metrics(server["serverId"]).dict()
                       for server in self.servers if self._generate_single_server_metrics(server["serverId"])],
            "tasks": self.tasks_data,
            "alerts": list(self.alerts_data)[-10:],
            "system_health": self.get_system_health().dict(),
            "load_balance": self.get_load_balance_status().dict(),
            "time_series": [data.dict() for data in self.time_series_data[-500:]],
            "grouped_data": self.get_grouped_server_data()
        }