import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DataVisualCenter.css';

// Circular buffer implementation for time series data
class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.timestampMap = new Map(); // Map to track timestamps
  }

  // Add new data point
  add(data) {
    // Check if we already have this timestamp
    if (this.timestampMap.has(data.timestamp)) {
      return; // Don't add duplicate timestamps
    }

    // Add to buffer
    this.buffer[this.tail] = data;
    this.timestampMap.set(data.timestamp, this.tail);
    
    // Update pointers
    this.tail = (this.tail + 1) % this.size;
    if (this.count < this.size) {
      this.count++;
    } else {
      // Remove the oldest item from map
      const oldTimestamp = this.buffer[this.head].timestamp;
      this.timestampMap.delete(oldTimestamp);
      this.head = (this.head + 1) % this.size;
    }
  }

  // Get all data in chronological order
  getAll() {
    const result = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.size;
      result.push(this.buffer[index]);
    }
    return result;
  }

  // Get data within a time range
  getDataByTimeRange(minutes) {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - minutes * 60 * 1000);
    
    const result = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.size;
      const item = this.buffer[index];
      if (new Date(item.timestamp) >= cutoffTime) {
        result.push(item);
      }
    }
    return result;
  }

  // Clear buffer
  clear() {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.timestampMap.clear();
  }
}

const DataVisualCenter = ({ chartData = [], servers = [], groupedData = {}, tasks = [] }) => {
  const [timeRange, setTimeRange] = useState('5m');
  const [dimension, setDimension] = useState('server');
  const [selectedTime, setSelectedTime] = useState(100); // 默认显示最新数据
  const [chartSize, setChartSize] = useState({ width: 600, height: 300 });
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState(null); // 用于饼图悬停效果
  const [selectedMetric, setSelectedMetric] = useState('cpu_usage'); // 新增：选择指标类型
  
  // Create circular buffer for time series data (15 minutes of data at 2s intervals = 450 data points)
  const dataBufferRef = useRef(new CircularBuffer(450));
  const [localChartData, setLocalChartData] = useState([]);
  
  const chartRef = useRef(null);

  // 指标类型选项
  const metricTypes = [
    { value: 'cpu_usage', label: 'CPU 使用率 (%)' },
    { value: 'memory_usage', label: '内存使用率 (%)' }
    /*
    { value: 'disk_io', label: '磁盘 I/O (MB/s)' },
    { value: 'network_in', label: '网络流入 (KB/s)' },
    { value: 'network_out', label: '网络流出 (KB/s)' },
    { value: 'load_1m', label: '平均负载 (1m)' },
    { value: 'load_5m', label: '平均负载 (5m)' },
    { value: 'load_15m', label: '平均负载 (15m)' }
     */
  ];

  // 获取所有可用的区域和服务类型
  const allRegions = [...new Set(servers.map(s => s.region))];
  const allTags = [...new Set(servers.map(s => s.serviceType).filter(Boolean))];

  // Update buffer with new data
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      // Add new data points to buffer
      chartData.forEach(point => {
        dataBufferRef.current.add(point);
      });
      
      // Update local chart data state
      setLocalChartData(dataBufferRef.current.getAll());
    }
  }, [chartData]);

  // 计算时间范围（分钟）
  const getTimeRangeInMinutes = () => {
    switch (timeRange) {
      case '5m': return 5;
      case '10m': return 10;
      case '15m': return 15;
      default: return 5;
    }
  };

  // 根据滑块位置计算历史数据
  const getHistoricalData = useCallback(() => {
    const timeRangeMinutes = getTimeRangeInMinutes();
    const now = new Date();

    // 计算滑块对应的时间点（100表示最新，0表示最旧）
    const timeOffset = ((100 - selectedTime) / 100) * timeRangeMinutes * 60 * 1000;
    const targetTime = new Date(now.getTime() - timeOffset);

    // 获取缓冲区中的所有数据
    const allData = dataBufferRef.current.getAll();

    // 过滤出目标时间点附近的数据（前后30秒）
    const filteredData = allData.filter(item => {
      const itemTime = new Date(item.timestamp);
      const timeDiff = Math.abs(itemTime.getTime() - targetTime.getTime());
      return timeDiff <= 30000; // 30秒范围内
    });

    return filteredData;
  }, [selectedTime, timeRange]);

  const historicalData = getHistoricalData();

  // 根据时间选择过滤任务
  const getFilteredTasks = () => {
    const timeRangeMinutes = getTimeRangeInMinutes();
    const now = new Date();
    const timeOffset = ((100 - selectedTime) / 100) * timeRangeMinutes * 60 * 1000;
    const targetTime = new Date(now.getTime() - timeOffset);

    // 过滤在目标时间点创建或正在运行的任务
    return tasks.filter(task => {
      const taskCreatedTime = task.createdAt || task.startTimeTimestamp;
      const timeDiff = Math.abs(taskCreatedTime - targetTime.getTime());
      return timeDiff <= timeRangeMinutes * 60 * 1000; // 在时间范围内的任务
    });
  };

  // 过滤图表数据
  const filteredChartData = historicalData.filter(item => {
    if (selectedMetric && item.metric_type !== selectedMetric) return false;
    if (selectedServer && item.serverId !== selectedServer) return false;
    if (selectedRegion && item.region !== selectedRegion) return false;
    if (selectedTag && item.service_type !== selectedTag) return false;
    return true;
  });

  // 获取当前显示的时间
  const getCurrentDisplayTime = () => {
    const timeRangeMinutes = getTimeRangeInMinutes();
    const now = new Date();
    const timeOffset = ((100 - selectedTime) / 100) * timeRangeMinutes * 60 * 1000;
    const targetTime = new Date(now.getTime() - timeOffset);
    return targetTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const timeRanges = [
    { label: '5分钟', value: '5m' },
    { label: '10分钟', value: '10m' },
    { label: '15分钟', value: '15m' }
  ];

  const dimensions = [
    { label: '服务器', value: 'server' },
    { label: '区域', value: 'region' },
    { label: '服务', value: 'service' }
  ];

  // 响应式调整图表大小
  useEffect(() => {
    const updateChartSize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        const newWidth = Math.max(400, Math.min(containerWidth - 40, 800));
        const newHeight = Math.max(200, Math.min(newWidth * 0.5, 400));
        setChartSize({ width: newWidth, height: newHeight });
      }
    };

    updateChartSize();
    window.addEventListener('resize', updateChartSize);
    return () => window.removeEventListener('resize', updateChartSize);
  }, []);

  const renderLineChart = (data) => {
    const { width, height } = chartSize;
    const padding = 60; // 增加左边距以适应Y轴标签
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    if (!data || data.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无数据</p>
        </div>
      );
    }

    // 修复：确保数据有正确的时间格式并按时间排序
    const processedData = data.map(item => ({
      ...item,
      displayTime: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      value: item.value !== undefined ? item.value : 0
    })).filter(item => !isNaN(item.value)); // 过滤掉无效值

    if (processedData.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无有效数据</p>
        </div>
      );
    }

    // 按时间排序数据
    processedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // 获取数值范围
    const values = processedData.map(d => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    // 按服务器分组数据
    const groupedByServer = {};
    processedData.forEach(item => {
      if (!groupedByServer[item.serverId]) {
        groupedByServer[item.serverId] = [];
      }
      groupedByServer[item.serverId].push(item);
    });

    // 为每个服务器生成颜色
    const serverColors = {};
    const serverIds = Object.keys(groupedByServer);
    const colors = [
      'var(--accent-blue)', 
      'var(--success-green)', 
      'var(--warning-yellow)', 
      'var(--error-red)',
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#feca57',
      '#ff9ff3'
    ];
    
    serverIds.forEach((serverId, index) => {
      serverColors[serverId] = colors[index % colors.length];
    });

    // 生成时间标签（每10个点显示一个时间标签）
    const timeLabels = [];
    const step = Math.max(1, Math.floor(processedData.length / 5));
    for (let i = 0; i < processedData.length; i += step) {
      timeLabels.push({
        x: padding + (i / (processedData.length - 1)) * chartWidth,
        time: processedData[i].displayTime
      });
    }

    return (
      <svg width={width} height={height} className="line-chart">
        <defs>
          {serverIds.map((serverId, index) => (
            <linearGradient key={serverId} id={`lineGradient-${serverId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: serverColors[serverId], stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: serverColors[serverId], stopOpacity: 0.1 }} />
            </linearGradient>
          ))}
        </defs>

        {/* Y轴网格线和标签 */}
        <g className="grid">
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = padding + (percent / 100) * chartHeight;
            const value = maxValue - (percent / 100) * range;
            return (
              <g key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="var(--text-secondary)"
                  fontSize="12"
                  textAnchor="end"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}
        </g>

        {/* X轴时间标签 */}
        <g className="time-labels">
          {timeLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={height - padding + 20}
              fill="var(--text-secondary)"
              fontSize="12"
              textAnchor="middle"
            >
              {label.time}
            </text>
          ))}
        </g>

        {/* 绘制每条线 */}
        {Object.entries(groupedByServer).map(([serverId, serverData]) => {
          if (serverData.length === 0) return null;
          
          // 为每个数据点计算坐标
          const points = serverData.map((d, i) => {
            // 使用数据点在该服务器数据中的位置计算x坐标
            const x = padding + (i / (serverData.length - 1 || 1)) * chartWidth;
            // 使用数据值计算y坐标
            const y = padding + chartHeight - ((d.value - minValue) / (range || 1)) * chartHeight;
            return { x, y, data: d };
          });

          // 创建折线路径
          const linePath = points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ');

          // 创建填充区域路径
          const areaPath = `M ${points[0].x} ${height - padding} ${linePath} L ${points[points.length - 1].x} ${height - padding} Z`;

          return (
            <g key={serverId}>
              {/* 填充区域 */}
              <path
                d={areaPath}
                fill={`url(#lineGradient-${serverId})`}
              />
              
              {/* 折线 */}
              <path
                d={linePath}
                fill="none"
                stroke={serverColors[serverId]}
                strokeWidth="2"
              />

              {/* 数据点 */}
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={serverColors[serverId]}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </g>
          );
        })}

        {/* X轴和Y轴 */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--text-secondary)"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="var(--text-secondary)"
          strokeWidth="1"
        />

        {/* 添加指标类型标注 */}
        <text
          x={width - padding}
          y={20}
          fill="var(--text-primary)"
          fontSize="12"
          fontWeight="bold"
          textAnchor="end"
        >
          {metricTypes.find(m => m.value === selectedMetric)?.label || '未知指标'}
        </text>
        
        {/* 添加图例 */}
        <g transform={`translate(${padding}, ${height - 25})`}>
          {serverIds.slice(0, 5).map((serverId, index) => {
            const server = servers.find(s => s.id === serverId);
            const serverName = server ? server.name : serverId;
            return (
              <g key={serverId} transform={`translate(${index * 120}, 0)`}>
                <line 
                  x1="0" 
                  y1="0" 
                  x2="20" 
                  y2="0" 
                  stroke={serverColors[serverId]} 
                  strokeWidth="2" 
                />
                <text 
                  x="25" 
                  y="4" 
                  fill="var(--text-primary)" 
                  fontSize="10"
                >
                  {serverName.length > 15 ? serverName.substring(0, 15) + '...' : serverName}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  const renderPieChart = (tasks) => {
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    if (!tasks || tasks.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无数据</p>
        </div>
      );
    }

    // 计算各状态任务数量
    const statusCounts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };

    tasks.forEach(task => {
      switch (task.status) {
        case 'pending':
          statusCounts.pending++;
          break;
        case 'running':
          statusCounts.running++;
          break;
        case 'completed':
          statusCounts.completed++;
          break;
        case 'failed':
          statusCounts.failed++;
          break;
        default:
          break;
      }
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无任务数据</p>
        </div>
      );
    }

    // 根据任务状态计算饼图数据
    const pieData = [
      { label: '排队中', value: statusCounts.pending, color: 'var(--warning-yellow)' },
      { label: '运行中', value: statusCounts.running, color: 'var(--accent-blue)' },
      { label: '已完成', value: statusCounts.completed, color: 'var(--success-green)' },
      { label: '已失败', value: statusCounts.failed, color: 'var(--error-red)' }
    ];

    let currentAngle = -Math.PI / 2;

    return (
      <svg width={size} height={size} className="pie-chart">
        {pieData.map((segment, i) => {
          // 如果值为0，跳过绘制
          if (segment.value === 0) return null;
          
          const angle = (segment.value / total) * 2 * Math.PI;
          const endAngle = currentAngle + angle;

          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);

          const largeArcFlag = angle > Math.PI ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return (
            <g 
              key={i}
              onMouseEnter={() => setHoveredSegment(i)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <path
                d={pathData}
                fill={segment.color}
                stroke="var(--primary-bg)"
                strokeWidth="2"
                className="pie-segment"
                opacity={hoveredSegment === null || hoveredSegment === i ? 1 : 0.7}
              />
              <text
                x={centerX + (radius * 0.7) * Math.cos(currentAngle - angle / 2)}
                y={centerY + (radius * 0.7) * Math.sin(currentAngle - angle / 2)}
                fill="white"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                {segment.value > 0 ? `${Math.round((segment.value/total)*100)}%` : ''}
              </text>
            </g>
          );
        })}
        
        {/* 添加悬停信息显示 */}
        {hoveredSegment !== null && (
          <g>
            <rect 
              x={centerX - 60} 
              y={centerY - 25} 
              width={120} 
              height={30} 
              fill="var(--secondary-bg)" 
              stroke="var(--border-color)"
              rx="5"
            />
            <text 
              x={centerX} 
              y={centerY - 5} 
              fill="var(--text-primary)" 
              fontSize="14" 
              textAnchor="middle"
              fontWeight="bold"
            >
              {pieData[hoveredSegment].label}: {pieData[hoveredSegment].value} ({Math.round((pieData[hoveredSegment].value/total)*100)}%)
            </text>
          </g>
        )}
      </svg>
    );
  };

  // 计算各区域任务数量并渲染柱状图
  const renderRegionTaskChart = (tasks) => {
    const chartWidth = 300;
    const chartHeight = 200;
    const padding = 40;

    if (!tasks || tasks.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无任务数据</p>
        </div>
      );
    }

    // 按区域统计任务数量
    const regionTaskCounts = {};
    tasks.forEach(task => {
      // 首先通过targetCluster找到对应的服务器，然后获取服务器所属地域
      const targetCluster = task.targetCluster;
      let region = 'unknown';

      if (targetCluster) {
        // 查找该集群下的服务器，获取服务器所属地域
        const clusterServers = servers.filter(server => server.clusterId === targetCluster);
        if (clusterServers.length > 0) {
          // 取第一个服务器的地域作为任务的地域
          region = clusterServers[0].region;
        }
      }

      if (regionTaskCounts[region]) {
        regionTaskCounts[region]++;
      } else {
        regionTaskCounts[region] = 1;
      }
    });

    const regions = Object.keys(regionTaskCounts);
    const maxCount = Math.max(...Object.values(regionTaskCounts), 1);
    
    if (regions.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无区域数据</p>
        </div>
      );
    }

    // 柱状图颜色
    const colors = [
      'var(--accent-blue)',
      'var(--success-green)',
      'var(--warning-yellow)',
      'var(--error-red)',
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#feca57',
      '#ff9ff3'
    ];

    return (
      <svg width={chartWidth} height={chartHeight} className="bar-chart">
        {/* Y轴网格线和标签 */}
        <g className="grid">
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = padding + ((100 - percent) / 100) * (chartHeight - 2 * padding);
            const value = Math.round((percent / 100) * maxCount);
            return (
              <g key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="var(--text-secondary)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            );
          })}
        </g>

        {/* 柱状图 */}
        <g>
          {regions.map((region, index) => {
            const barWidth = (chartWidth - 2 * padding) / regions.length * 0.8;
            const barHeight = (regionTaskCounts[region] / maxCount) * (chartHeight - 2 * padding);
            const x = padding + (index * (chartWidth - 2 * padding) / regions.length) + ((chartWidth - 2 * padding) / regions.length * 0.1);
            const y = chartHeight - padding - barHeight;

            return (
              <g key={region}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[index % colors.length]}
                  rx="2"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill="var(--text-primary)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {regionTaskCounts[region]}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding + 15}
                  fill="var(--text-secondary)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {region.length > 8 ? region.substring(0, 8) + '...' : region}
                </text>
              </g>
            );
          })}
        </g>

        {/* X轴和Y轴 */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="var(--text-secondary)"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="var(--text-secondary)"
          strokeWidth="1"
        />
      </svg>
    );
  };

  // 计算任务统计数据（用于原始状态网格显示）
  const calculateTaskStats = (tasksToCount = tasks) => {
    const stats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };

    if (!Array.isArray(tasksToCount)) {
      return stats;
    }

    tasksToCount.forEach(task => {
      switch (task.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        default:
          break;
      }
    });

    return stats;
  };

  // 计算服务器状态统计数据
  const calculateServerStats = () => {
    console.log('Grouped data:', groupedData);

    // 优先使用分组数据的整体统计
    if (groupedData?.overall) {
      console.log('Using grouped data overall stats:', groupedData.overall);
      return groupedData.overall;
    }

    // 回退到原来的计算方法
    const stats = {
      healthy: 0,
      warning: 0,
      danger: 0,
      offline: 0
    };

    console.log('Servers data:', servers);
    console.log('Selected filters:', { selectedServer, selectedRegion, selectedTag });

    // 根据筛选条件过滤服务器
    const filteredServers = servers.filter(server => {
      if (selectedServer && server.id !== selectedServer) return false;
      if (selectedRegion && server.region !== selectedRegion) return false;
      if (selectedTag && server.tags && !server.tags.includes(selectedTag)) return false;
      return true;
    });

    console.log('Filtered servers:', filteredServers);

    // 统计各状态服务器数量
    filteredServers.forEach(server => {
      console.log('Server status:', server.status);
      switch (server.status) {
        case 'healthy':
          stats.healthy++;
          break;
        case 'warning':
          stats.warning++;
          break;
        case 'danger':
          stats.danger++;
          break;
        case 'offline':
          stats.offline++;
          break;
        default:
          console.log('Unknown status:', server.status);
          break;
      }
    });

    console.log('Final stats:', stats);
    return stats;
  };

  const serverStats = calculateServerStats();
  const filteredTasks = getFilteredTasks();
  const taskStats = calculateTaskStats(filteredTasks); // 用于原始状态网格显示

  return (
    <div className="data-visual-center" ref={chartRef}>
      <div className="visual-controls">
        {/* 时间范围选择 
        <div className="control-group">
          <label>时间范围:</label>
          <div className="time-range-buttons">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                className={`control-btn ${timeRange === range.value ? 'active' : ''}`}
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
         */}

        <div className="control-group">
          <label>指标类型:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="filter-select"
          >
            {metricTypes.map(metric => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        {/* 
        <div className="control-group">
          <label>维度:</label>
          <div className="dimension-buttons">
            {dimensions.map((dim) => (
              <button
                key={dim.value}
                className={`control-btn ${dimension === dim.value ? 'active' : ''}`}
                onClick={() => setDimension(dim.value)}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>
        */}
        
        <div className="control-group">
          <label>服务器:</label>
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="filter-select"
          >
            <option value="">全部服务器</option>
            {servers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>区域:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="filter-select"
          >
            <option value="">全部区域</option>
            {allRegions.map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>服务类型:</label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="filter-select"
          >
            <option value="">全部服务类型</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>时间选择:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedTime}
            onChange={(e) => setSelectedTime(parseInt(e.target.value))}
            className="time-slider"
          />
          <div className="time-labels">
            <span>过去</span>
            <span className="current-time">{getCurrentDisplayTime()}</span>
            <span>现在</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section main-chart">
          <h3>时间趋势</h3>
          <div className="chart-wrapper">
            {renderLineChart(filteredChartData)}
          </div>
        </div>

        <div className="chart-section secondary-charts">
          <div className="chart-subsection">
            <h3>任务状态分布</h3>
            <div className="chart-wrapper">
              {/* 任务状态分布使用所有任务，不根据时间过滤 */}
              {renderPieChart(tasks)}
            </div>
          </div>

          <div className="chart-subsection">
            <h3>各区域任务数量</h3>
            <div className="chart-wrapper">
              {/* 各区域任务数量使用所有任务，不根据时间过滤 */}
              {renderRegionTaskChart(tasks)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualCenter;