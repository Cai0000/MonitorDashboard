// 全局状态管理
const dashboardState = {
    isStreaming: false,
    currentTheme: 'dark',
    dataStream: null,
    charts: {
        line: null,
        pie: null
    },
    historicalData: {
        cpu: [],
        memory: [],
        disk: [],
        network: [],
        load: []
    },
    maxDataPoints: 300
};

// 模拟数据生成器
class DataSimulator {
    constructor() {
        this.servers = ['server1', 'server2', 'server3'];
        this.regions = ['北京', '上海', '深圳'];
        this.tasks = this.generateTasks();
        this.alerts = this.generateAlerts();
    }

    generateRandomValue(min, max) {
        return Math.random() * (max - min) + min;
    }

    generateSystemMetrics() {
        return {
            cpu: Math.round(this.generateRandomValue(20, 90)),
            memory: Math.round(this.generateRandomValue(30, 85)),
            disk: Math.round(this.generateRandomValue(40, 80)),
            network: Math.round(this.generateRandomValue(10, 100)),
            load: this.generateRandomValue(0.5, 8.0).toFixed(1)
        };
    }

    generateTasks() {
        const taskNames = ['数据备份', '系统扫描', '日志清理', '性能优化', '安全检查'];
        const statuses = ['running', 'queued', 'failed', 'completed'];
        const clusters = ['cluster-1', 'cluster-2', 'cluster-3'];

        return Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            name: taskNames[i % taskNames.length],
            cluster: clusters[i % clusters.length],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            progress: Math.round(Math.random() * 100)
        }));
    }

    generateAlerts() {
        const sources = ['server1', 'server2', 'server3', 'database', 'cache'];
        const severities = ['high', 'medium', 'low'];
        const messages = [
            'CPU使用率过高',
            '内存不足',
            '磁盘空间不足',
            '网络连接异常',
            '服务响应超时'
        ];

        return Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
            source: sources[Math.floor(Math.random() * sources.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            message: messages[Math.floor(Math.random() * messages.length)]
        }));
    }

    updateTasks() {
        this.tasks.forEach(task => {
            if (task.status === 'running') {
                task.progress = Math.min(100, task.progress + Math.round(Math.random() * 10));
                if (task.progress >= 100) {
                    task.status = 'completed';
                }
            }
        });

        // 随机添加新任务
        if (Math.random() < 0.1) {
            this.tasks.push({
                id: this.tasks.length + 1,
                name: '新任务',
                cluster: 'cluster-1',
                status: 'queued',
                progress: 0
            });
        }

        // 保持任务数量
        if (this.tasks.length > 10) {
            this.tasks = this.tasks.slice(-10);
        }
    }

    updateAlerts() {
        // 随机添加新告警
        if (Math.random() < 0.2) {
            this.alerts.unshift({
                id: this.alerts.length + 1,
                time: new Date().toLocaleTimeString(),
                source: 'server' + Math.ceil(Math.random() * 3),
                severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                message: ['CPU使用率过高', '内存不足', '磁盘空间不足'][Math.floor(Math.random() * 3)]
            });
        }

        // 保持告警数量
        if (this.alerts.length > 10) {
            this.alerts = this.alerts.slice(0, 10);
        }
    }
}

// 初始化数据模拟器
const dataSimulator = new DataSimulator();

// 初始化图表
function initCharts() {
    // 折线图
    const lineChart = echarts.init(document.getElementById('lineChart'));
    dashboardState.charts.line = lineChart;

    const lineOption = {
        title: {
            text: '系统性能趋势',
            textStyle: { color: '#e6eef9' }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1d3e',
            borderColor: '#2a2f55',
            textStyle: { color: '#e6eef9' }
        },
        legend: {
            data: ['CPU', '内存', '磁盘', '网络'],
            textStyle: { color: '#e6eef9' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: [],
            axisLine: { lineStyle: { color: '#2a2f55' } },
            axisLabel: { color: '#9aa5b1' }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#2a2f55' } },
            axisLabel: { color: '#9aa5b1' },
            splitLine: { lineStyle: { color: '#2a2f55' } }
        },
        series: [
            {
                name: 'CPU',
                type: 'line',
                data: [],
                smooth: true,
                lineStyle: { color: '#00d4ff' },
                itemStyle: { color: '#00d4ff' }
            },
            {
                name: '内存',
                type: 'line',
                data: [],
                smooth: true,
                lineStyle: { color: '#00ff88' },
                itemStyle: { color: '#00ff88' }
            },
            {
                name: '磁盘',
                type: 'line',
                data: [],
                smooth: true,
                lineStyle: { color: '#ffb800' },
                itemStyle: { color: '#ffb800' }
            },
            {
                name: '网络',
                type: 'line',
                data: [],
                smooth: true,
                lineStyle: { color: '#ff4757' },
                itemStyle: { color: '#ff4757' }
            }
        ]
    };
    lineChart.setOption(lineOption);

    // 饼图
    const pieChart = echarts.init(document.getElementById('pieChart'));
    dashboardState.charts.pie = pieChart;

    const pieOption = {
        title: {
            text: '服务器资源分布',
            textStyle: { color: '#e6eef9' }
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1a1d3e',
            borderColor: '#2a2f55',
            textStyle: { color: '#e6eef9' }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            textStyle: { color: '#e6eef9' }
        },
        series: [
            {
                name: '资源分布',
                type: 'pie',
                radius: '50%',
                data: [
                    { value: 35, name: 'Server 1' },
                    { value: 30, name: 'Server 2' },
                    { value: 25, name: 'Server 3' },
                    { value: 10, name: '其他' }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    pieChart.setOption(pieOption);

    // 响应式调整
    window.addEventListener('resize', () => {
        lineChart.resize();
        pieChart.resize();
    });
}

// 更新系统状态显示
function updateSystemStatus(metrics) {
    document.getElementById('cpuValue').textContent = `${metrics.cpu}%`;
    document.getElementById('memoryValue').textContent = `${metrics.memory}%`;
    document.getElementById('diskValue').textContent = `${metrics.disk}%`;
    document.getElementById('networkValue').textContent = `${metrics.network} MB/s`;
    document.getElementById('loadValue').textContent = metrics.load;

    // 更新进度条
    document.getElementById('cpuBar').style.width = `${metrics.cpu}%`;
    document.getElementById('memoryBar').style.width = `${metrics.memory}%`;
    document.getElementById('diskBar').style.width = `${metrics.disk}%`;
    document.getElementById('networkBar').style.width = `${metrics.network}%`;
    document.getElementById('loadBar').style.width = `${(metrics.load / 10) * 100}%`;

    // 设置颜色
    const getColor = (value, thresholds) => {
        if (value > thresholds.high) return '#ff4757';
        if (value > thresholds.medium) return '#ffb800';
        return '#00ff88';
    };

    document.getElementById('cpuBar').style.backgroundColor = getColor(metrics.cpu, { medium: 60, high: 85 });
    document.getElementById('memoryBar').style.backgroundColor = getColor(metrics.memory, { medium: 70, high: 90 });
    document.getElementById('diskBar').style.backgroundColor = getColor(metrics.disk, { medium: 75, high: 85 });
    document.getElementById('networkBar').style.backgroundColor = getColor(metrics.network, { medium: 50, high: 80 });
    document.getElementById('loadBar').style.backgroundColor = getColor(parseFloat(metrics.load), { medium: 3, high: 5 });

    // 更新健康度
    updateHealthStatus(metrics);
}

// 更新健康度状态
function updateHealthStatus(metrics) {
    const isHealthy = metrics.cpu < 85 && metrics.memory < 90 && parseFloat(metrics.load) < 5;
    const healthIndicator = document.getElementById('healthIndicator');
    const healthText = healthIndicator.querySelector('.health-text');

    if (isHealthy) {
        healthIndicator.className = 'health-indicator health-good';
        healthText.textContent = '良好';
    } else if (metrics.cpu < 95 && metrics.memory < 95 && parseFloat(metrics.load) < 7) {
        healthIndicator.className = 'health-indicator health-warning';
        healthText.textContent = '警告';
    } else {
        healthIndicator.className = 'health-indicator health-error';
        healthText.textContent = '危险';
    }
}

// 更新负载均衡状态
function updateLoadBalanceStatus() {
    const balanceStatus = document.getElementById('balanceStatus');
    const isBalanced = Math.random() < 0.8; // 80%概率均衡

    if (isBalanced) {
        balanceStatus.textContent = '流量分配均衡';
        balanceStatus.style.color = '#00ff88';
    } else {
        balanceStatus.textContent = '流量分配倾斜比超阈值';
        balanceStatus.style.color = '#ff4757';
    }
}

// 更新任务列表
function updateTaskList() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    dataSimulator.tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <div class="task-name">${task.name}</div>
            <div class="task-meta">${task.cluster} • ID: ${task.id}</div>
            <div class="task-meta">
                <span class="status-badge status-${task.status}">${getStatusText(task.status)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${task.progress}%"></div>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
}

// 更新告警列表
function updateAlertList() {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';

    dataSimulator.alerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        alertItem.innerHTML = `
            <div class="alert-time">${alert.time}</div>
            <div class="alert-source">${alert.source}</div>
            <div class="alert-meta">
                <span class="alert-severity severity-${alert.severity}">${getSeverityText(alert.severity)}</span>
            </div>
            <div>${alert.message}</div>
        `;
        alertList.appendChild(alertItem);
    });
}

// 更新图表数据
function updateCharts(metrics) {
    const now = new Date().toLocaleTimeString();

    // 添加新数据点
    dashboardState.historicalData.cpu.push(metrics.cpu);
    dashboardState.historicalData.memory.push(metrics.memory);
    dashboardState.historicalData.disk.push(metrics.disk);
    dashboardState.historicalData.network.push(metrics.network);
    dashboardState.historicalData.load.push(parseFloat(metrics.load));

    // 限制数据点数量
    Object.keys(dashboardState.historicalData).forEach(key => {
        if (dashboardState.historicalData[key].length > dashboardState.maxDataPoints) {
            dashboardState.historicalData[key].shift();
        }
    });

    // 更新折线图
    const timeLabels = Array.from({ length: dashboardState.historicalData.cpu.length }, (_, i) => {
        const time = new Date(Date.now() - (dashboardState.historicalData.cpu.length - i - 1) * 1000);
        return time.toLocaleTimeString();
    });

    dashboardState.charts.line.setOption({
        xAxis: {
            data: timeLabels
        },
        series: [
            { data: dashboardState.historicalData.cpu },
            { data: dashboardState.historicalData.memory },
            { data: dashboardState.historicalData.disk },
            { data: dashboardState.historicalData.network }
        ]
    });

    // 更新饼图数据（模拟）
    const pieData = [
        { value: Math.round(Math.random() * 50) + 20, name: 'Server 1' },
        { value: Math.round(Math.random() * 50) + 15, name: 'Server 2' },
        { value: Math.round(Math.random() * 40) + 10, name: 'Server 3' },
        { value: Math.round(Math.random() * 20) + 5, name: '其他' }
    ];

    dashboardState.charts.pie.setOption({
        series: [{ data: pieData }]
    });
}

// 辅助函数
function getStatusText(status) {
    const statusMap = {
        'running': '运行中',
        'queued': '排队',
        'failed': '失败',
        'completed': '完成'
    };
    return statusMap[status] || status;
}

function getSeverityText(severity) {
    const severityMap = {
        'high': '高',
        'medium': '中',
        'low': '低'
    };
    return severityMap[severity] || severity;
}

// 数据流更新
function dataStreamUpdate() {
    if (!dashboardState.isStreaming) return;

    const metrics = dataSimulator.generateSystemMetrics();
    updateSystemStatus(metrics);
    updateCharts(metrics);
    updateLoadBalanceStatus();
    dataSimulator.updateTasks();
    dataSimulator.updateAlerts();
    updateTaskList();
    updateAlertList();
}

// 启动/停止数据流
function toggleDataStream() {
    dashboardState.isStreaming = !dashboardState.isStreaming;
    const button = document.getElementById('toggleStream');

    if (dashboardState.isStreaming) {
        button.textContent = '暂停数据流';
        button.className = 'btn btn-secondary';

        // 立即更新一次
        dataStreamUpdate();

        // 设置定时更新
        dashboardState.dataStream = setInterval(dataStreamUpdate, 1500);
    } else {
        button.textContent = '启动数据流';
        button.className = 'btn btn-primary';

        // 停止定时更新
        if (dashboardState.dataStream) {
            clearInterval(dashboardState.dataStream);
            dashboardState.dataStream = null;
        }
    }
}

// 刷新数据
function refreshData() {
    const metrics = dataSimulator.generateSystemMetrics();
    updateSystemStatus(metrics);
    updateCharts(metrics);
    updateLoadBalanceStatus();
    dataSimulator.updateTasks();
    dataSimulator.updateAlerts();
    updateTaskList();
    updateAlertList();
}

// 搜索功能
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        // 过滤任务列表
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });

        // 过滤告警列表
        const alertItems = document.querySelectorAll('.alert-item');
        alertItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

// 主题切换（预留功能）
function toggleTheme() {
    // 这里可以实现主题切换逻辑
    alert('主题切换功能正在开发中...');
}

// 初始化应用
function initApp() {
    // 初始化图表
    initCharts();

    // 设置事件监听器
    document.getElementById('toggleStream').addEventListener('click', toggleDataStream);
    document.getElementById('refreshData').addEventListener('click', refreshData);
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

    // 设置搜索功能
    setupSearch();

    // 设置服务器和时间范围选择器
    document.getElementById('serverSelect').addEventListener('change', refreshData);
    document.getElementById('timeRange').addEventListener('change', refreshData);

    // 初始化显示
    refreshData();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);