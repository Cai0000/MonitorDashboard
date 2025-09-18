import React, { useState, useRef, useEffect } from 'react';
import './DataVisualCenter.css';

const DataVisualCenter = ({ chartData = [], servers = [] }) => {
  const [timeRange, setTimeRange] = useState('5m');
  const [dimension, setDimension] = useState('server');
  const [selectedTime, setSelectedTime] = useState(0);
  const [chartSize, setChartSize] = useState({ width: 600, height: 300 });
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const chartRef = useRef(null);

  // 获取所有可用的区域和标签
  const allRegions = [...new Set(servers.map(s => s.region))];
  const allTags = [...new Set(servers.flatMap(s => s.tags || []))];

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
  useEffect(() => {
    const timeRangeMinutes = getTimeRangeInMinutes();
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeRangeMinutes * 60 * 1000);

    // 计算滑块对应的时间点
    const timeOffset = (selectedTime / 100) * timeRangeMinutes * 60 * 1000;
    const targetTime = new Date(cutoffTime.getTime() + timeOffset);

    // 过滤出目标时间点附近的数据（前后30秒）
    const filteredData = chartData.filter(item => {
      const itemTime = new Date(item.timestamp);
      const timeDiff = Math.abs(itemTime.getTime() - targetTime.getTime());
      return timeDiff <= 30000; // 30秒范围内
    });

    setHistoricalData(filteredData);
  }, [selectedTime, timeRange, chartData]);

  // 过滤图表数据
  const filteredChartData = historicalData.filter(item => {
    if (selectedServer && item.serverId !== selectedServer) return false;
    if (selectedRegion && item.region !== selectedRegion) return false;
    if (selectedTag && item.tags && !item.tags.includes(selectedTag)) return false;
    return true;
  });

  // 获取当前显示的时间
  const getCurrentDisplayTime = () => {
    const timeRangeMinutes = getTimeRangeInMinutes();
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeRangeMinutes * 60 * 1000);
    const timeOffset = (selectedTime / 100) * timeRangeMinutes * 60 * 1000;
    const targetTime = new Date(cutoffTime.getTime() + timeOffset);
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
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    if (!data || data.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无数据</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((d.value - minValue) / range) * chartHeight
    }));

    return (
      <svg width={width} height={height} className="line-chart">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--accent-blue)', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-blue)', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>

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

        <path
          d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth="2"
        />

        <path
          d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`}
          fill="url(#lineGradient)"
          opacity="0.3"
        />

        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--accent-blue)"
            className="data-point"
          />
        ))}

        <g className="x-axis">
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={height - padding}
                  x2={x}
                  y2={height - padding + 5}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding + 20}
                  fill="var(--text-secondary)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {d.time}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  const renderPieChart = (data) => {
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    if (!data || data.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>暂无数据</p>
        </div>
      );
    }

    // 根据当前历史数据计算饼图数据
    const pieData = [
      { label: 'CPU', value: 35, color: 'var(--accent-blue)' },
      { label: '内存', value: 25, color: 'var(--success-green)' },
      { label: '磁盘', value: 30, color: 'var(--warning-yellow)' },
      { label: '网络', value: 10, color: 'var(--error-red)' }
    ];

    // 如果有数据，使用实际数据计算比例
    if (data.length > 0) {
      const latestData = data[data.length - 1];
      pieData[0].value = Math.min(100, Math.max(0, latestData.value || 35));
      pieData[1].value = Math.min(100, Math.max(0, (latestData.value || 25) * 0.7));
      pieData[2].value = Math.min(100, Math.max(0, (latestData.value || 30) * 0.8));
      pieData[3].value = Math.min(100, Math.max(0, 100 - pieData[0].value - pieData[1].value - pieData[2].value));
    }

    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -Math.PI / 2;

    return (
      <svg width={size} height={size} className="pie-chart">
        {pieData.map((segment, i) => {
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
            <g key={i}>
              <path
                d={pathData}
                fill={segment.color}
                stroke="var(--primary-bg)"
                strokeWidth="2"
                className="pie-segment"
              />
              <text
                x={centerX + (radius * 0.7) * Math.cos(currentAngle - angle / 2)}
                y={centerY + (radius * 0.7) * Math.sin(currentAngle - angle / 2)}
                fill="white"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                {Math.round(segment.value)}%
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="data-visual-center" ref={chartRef}>
      <div className="visual-controls">
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
          <label>标签:</label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="filter-select"
          >
            <option value="">全部标签</option>
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
          <span className="time-display">{getCurrentDisplayTime()}</span>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>时间趋势</h3>
          <div className="chart-wrapper">
            {renderLineChart(filteredChartData)}
          </div>
        </div>

        <div className="chart-section">
          <h3>设备状态</h3>
          <div className="chart-wrapper">
            {renderPieChart(filteredChartData)}
          </div>
        </div>

        <div className="chart-section">
          <h3>设备状态</h3>
          <div className="status-grid">
            <div className="status-card healthy">
              <div className="status-icon">🟢</div>
              <div className="status-count">12</div>
              <div className="status-label">正常</div>
            </div>
            <div className="status-card warning">
              <div className="status-icon">🟡</div>
              <div className="status-count">3</div>
              <div className="status-label">警告</div>
            </div>
            <div className="status-card danger">
              <div className="status-icon">🔴</div>
              <div className="status-count">1</div>
              <div className="status-label">危险</div>
            </div>
            <div className="status-card offline">
              <div className="status-icon">⚫</div>
              <div className="status-count">2</div>
              <div className="status-label">离线</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualCenter;