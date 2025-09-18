import React, { useState, useRef, useEffect } from 'react';
import './DataVisualCenter.css';

const DataVisualCenter = ({ chartData = [] }) => {
  const [timeRange, setTimeRange] = useState('5m');
  const [dimension, setDimension] = useState('server');
  const [selectedTime, setSelectedTime] = useState(0);
  const [chartSize, setChartSize] = useState({ width: 600, height: 300 });
  const chartRef = useRef(null);

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

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -Math.PI / 2;

    const colors = ['var(--accent-blue)', 'var(--success-green)', 'var(--warning-yellow)', 'var(--error-red)'];

    return (
      <svg width={size} height={size} className="pie-chart">
        {data.map((segment, i) => {
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
                fill={colors[i % colors.length]}
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
                {segment.value}%
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
          <label>时间选择:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedTime}
            onChange={(e) => setSelectedTime(parseInt(e.target.value))}
            className="time-slider"
          />
          <span className="time-display">{selectedTime}%</span>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>时间趋势</h3>
          <div className="chart-wrapper">
            {renderLineChart(chartData)}
          </div>
        </div>

        <div className="chart-section">
          <h3>设备状态</h3>
          <div className="chart-wrapper">
            {renderPieChart([
              { label: 'CPU', value: 35 },
              { label: '内存', value: 25 },
              { label: '磁盘', value: 30 },
              { label: '网络', value: 10 }
            ])}
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