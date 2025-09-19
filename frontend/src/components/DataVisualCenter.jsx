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

  // 计算任务状态分布数据
  const calculateTaskStatusDistribution = (tasksToCount = tasks) => {
    const statusCounts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };

    if (!Array.isArray(tasksToCount)) {
      return statusCounts;
    }

    tasksToCount.forEach(task => {
      switch (task.status) {
        case 'pending':
        case 'queued': // queued状态也归类为pending
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

    return statusCounts;
  };

  // 计算各区域任务数量
  const calculateRegionTaskCounts = (tasksToCount = tasks) => {
    const regionTaskCounts = {};

    if (!Array.isArray(tasksToCount)) {
      return regionTaskCounts;
    }

    // 初始化所有区域计数为0
    allRegions.forEach(region => {
      regionTaskCounts[region] = 0;
    });

    // 计算每个任务对应服务器所在的区域
    tasksToCount.forEach(task => {
      // 查找任务对应服务器的区域
      const server = servers.find(s => s.id === task.serverId);
      if (server && server.region) {
        regionTaskCounts[server.region] = (regionTaskCounts[server.region] || 0) + 1;
      } else {
        // 如果找不到服务器，使用默认区域计数
        const defaultRegion = '未知区域';
        regionTaskCounts[defaultRegion] = (regionTaskCounts[defaultRegion] || 0) + 1;
      }
    });

    return regionTaskCounts;
  };

  // 渲染时间序列图表
  const renderTimeSeriesChart = (data, width = 600, height = 300) => {
    return renderLineChart(data, width, height);
  };

  // 渲染饼图
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

    // 使用所有任务数据，不根据时间过滤
    const statusCounts = calculateTaskStatusDistribution(tasks);
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无任务数据</p>
        </div>
      );
    }

    // 计算角度和路径
    let startAngle = 0;
    const segments = [];

    // 定义颜色
    const colors = {
      pending: '#FFA500',    // 橙色
      running: '#0066CC',    // 蓝色
      completed: '#00AA00',  // 绿色
      failed: '#CC0000'      // 红色
    };

    const statusLabels = {
      pending: '等待中',
      running: '运行中',
      completed: '已完成',
      failed: '失败'
    };

    // 为每个状态创建扇形
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        const sliceAngle = (count / total) * 360;
        const endAngle = startAngle + sliceAngle;
        
        // 计算起始点和结束点
        const startRadians = (startAngle - 90) * Math.PI / 180;
        const endRadians = (endAngle - 90) * Math.PI / 180;
        
        const startX = centerX + radius * Math.cos(startRadians);
        const startY = centerY + radius * Math.sin(startRadians);
        const endX = centerX + radius * Math.cos(endRadians);
        const endY = centerY + radius * Math.sin(endRadians);
        
        // 大角度弧标志
        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        
        // 创建路径数据
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${startX} ${startY}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          'Z'
        ].join(' ');
        
        segments.push({
          path: pathData,
          color: colors[status],
          label: statusLabels[status],
          count: count,
          percentage: ((count / total) * 100).toFixed(1),
          startAngle: startAngle,
          endAngle: endAngle
        });
        
        startAngle = endAngle;
      }
    });

    if (segments.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无任务数据</p>
        </div>
      );
    }

    return (
      <div className="pie-chart-container">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="1"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={hoveredSegment === index ? 'segment-hover' : ''}
            />
          ))}
          
          {/* 中心文本显示总数 */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="20"
            fontWeight="bold"
          >
            {total}
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="12"
          >
            总任务数
          </text>
        </svg>
        
        {/* 图例 */}
        <div className="pie-chart-legend">
          {segments.map((segment, index) => (
            <div 
              key={index} 
              className={`legend-item ${hoveredSegment === index ? 'legend-item-hover' : ''}`}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div 
                className="legend-color" 
                style={{ backgroundColor: segment.color }}
              ></div>
              <div className="legend-label">{segment.label}</div>
              <div className="legend-value">{segment.count} ({segment.percentage}%)</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染区域任务数量柱状图
  const renderRegionTaskChart = (tasks) => {
    // 使用所有任务数据，不根据时间过滤
    const regionTaskCounts = calculateRegionTaskCounts(tasks);
    const regions = Object.keys(regionTaskCounts);
    
    if (regions.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无区域任务数据</p>
        </div>
      );
    }

    const chartWidth = 300;
    const chartHeight = 200;
    const padding = 40;
    
    // 计算最大值以确定比例
    const maxCount = Math.max(...Object.values(regionTaskCounts), 1);
    
    // 计算柱状图的宽度和间隔
    const barWidth = Math.max(20, (chartWidth - 2 * padding - (regions.length - 1) * 10) / regions.length);
    
    // 定义颜色
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    return (
      <svg width={chartWidth} height={chartHeight} className="region-task-chart">
        {/* 柱状图 */}
        <g>
          {regions.map((region, index) => {
            const barHeight = (regionTaskCounts[region] / maxCount) * (chartHeight - 2 * padding);
            const x = padding + index * (barWidth + 10);
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
        case 'queued': // queued状态也归类为pending
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

    if (!Array.isArray(servers)) {
      return stats;
    }

    servers.forEach(server => {
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
          break;
      }
    });

    return stats;
  };

  // 渲染服务器状态网格
  const renderServerStatusGrid = () => {
    const stats = calculateServerStats();
    const totalServers = Object.values(stats).reduce((sum, count) => sum + count, 0);

    if (totalServers === 0) {
      return <div className="no-data">暂无服务器数据</div>;
    }

    const statusConfig = [
      { key: 'healthy', label: '健康', color: 'var(--success-green)' },
      { key: 'warning', label: '警告', color: 'var(--warning-yellow)' },
      { key: 'danger', label: '危险', color: 'var(--error-red)' },
      { key: 'offline', label: '离线', color: 'var(--text-secondary)' }
    ];

    return (
      <div className="server-status-grid">
        {statusConfig.map(({ key, label, color }) => (
          <div key={key} className="status-item">
            <div className="status-header">
              <span className="status-label">{label}</span>
              <span className="status-count">{stats[key]}</span>
            </div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{
                  width: `${(stats[key] / totalServers) * 100}%`,
                  backgroundColor: color
                }}
              ></div>
            </div>
            <div className="status-percent">
              {totalServers > 0 ? ((stats[key] / totalServers) * 100).toFixed(1) : 0}%
            </div>
          </div>
        ))}
        <div className="total-servers">总服务器数: {totalServers}</div>
      </div>
    );
  };

  // 获取过滤后的任务（仅用于时间序列图）
  const filteredTasks = getFilteredTasks();

  return (
    <div className="data-visual-center" ref={chartRef}>
      <div className="chart-grid">
        {/* 左侧：时间序列图 */}
        <div className="main-chart">
          <div className="chart-header">
            <h3>实时性能监控</h3>
            <div className="time-controls">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-range-selector"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <div className="time-slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                  className="time-slider"
                />
                <div className="slider-label">
                  时间: {getCurrentDisplayTime()}
                </div>
              </div>
            </div>
          </div>
          <div className="chart-container">
            {renderTimeSeriesChart(filteredChartData, chartSize.width, chartSize.height)}
          </div>
        </div>

        {/* 右侧：饼图和柱状图 */}
        <div className="side-charts">
          <div className="chart-card">
            <h4>任务状态分布</h4>
            <div className="pie-chart">
              {/* 任务状态分布使用所有任务，不根据时间过滤 */}
              {renderPieChart(tasks)}
            </div>
          </div>

          <div className="chart-card">
            <h4>各区域任务数量</h4>
            <div className="region-chart">
              {/* 各区域任务数量使用所有任务，不根据时间过滤 */}
              {renderRegionTaskChart(tasks)}
            </div>
          </div>
        </div>
      </div>

      {/* 底部：服务器状态网格 */}
      <div className="bottom-section">
        <div className="chart-card full-width">
          <h4>服务器状态</h4>
          <div className="server-status-container">
            {renderServerStatusGrid()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualCenter;