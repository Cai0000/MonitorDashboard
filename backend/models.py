from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class ServerStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    DANGER = "danger"
    OFFLINE = "offline"

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Server(BaseModel):
    id: str
    name: str
    region: str
    tags: List[str]
    status: ServerStatus
    ip_address: str
    cpu_cores: int
    memory_gb: int
    disk_gb: int
    last_seen: datetime

class ServerMetrics(BaseModel):
    server_id: str
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_in_mbps: float
    network_out_mbps: float
    load_1m: float
    load_5m: float
    load_15m: float

class Task(BaseModel):
    id: str
    name: str
    cluster: str
    target_cluster: Optional[str] = None
    target_servers: List[str]
    status: TaskStatus
    progress: int
    start_time: datetime
    estimated_end_time: datetime
    description: str

class Alert(BaseModel):
    id: str
    timestamp: datetime
    server_id: str
    severity: AlertSeverity
    message: str
    resolved: bool = False

class LoadBalanceStatus(BaseModel):
    is_balanced: bool
    ratio: float
    server_count: int
    traffic_distribution: Dict[str, float]

class SystemHealth(BaseModel):
    overall_status: ServerStatus
    total_servers: int
    healthy_servers: int
    warning_servers: int
    danger_servers: int
    offline_servers: int
    timestamp: datetime

class TimeSeriesData(BaseModel):
    timestamp: datetime
    value: float
    metric_type: str
    server_id: Optional[str] = None
    region: Optional[str] = None
    service_type: Optional[str] = None

class DashboardData(BaseModel):
    servers: List[Server]
    metrics: List[ServerMetrics]
    tasks: List[Task]
    alerts: List[Alert]
    system_health: SystemHealth
    load_balance: LoadBalanceStatus
    time_series: List[TimeSeriesData]