import './SystemStatus.css';

const SystemStatus = ({ metrics = {}, loadBalance = {}, serverTags = [] }) => {
  const getHealthColor = (health) => {
    switch (health) {
      case 'good': return 'var(--success-green)';
      case 'warning': return 'var(--warning-yellow)';
      case 'danger': return 'var(--error-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const getHealthText = (health) => {
    switch (health) {
      case 'good': return '健康';
      case 'warning': return '警告';
      case 'danger': return '危险';
      default: return '未知';
    }
  };

  const getMetricColor = (value, thresholds) => {
    if (value >= thresholds.danger) return 'var(--error-red)';
    if (value >= thresholds.warning) return 'var(--warning-yellow)';
    return 'var(--success-green)';
  };

  return (
    <div className="system-status">
      <h2>系统状态</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">CPU 使用率</span>
            <span
              className="metric-value"
              style={{ color: getMetricColor(metrics.cpu, { warning: 70, danger: 85 }) }}
            >
              {metrics.cpu}%
            </span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.cpu}%`,
                backgroundColor: getMetricColor(metrics.cpu, { warning: 70, danger: 85 })
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">内存使用率</span>
            <span
              className="metric-value"
              style={{ color: getMetricColor(metrics.memory, { warning: 80, danger: 90 }) }}
            >
              {metrics.memory}%
            </span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.memory}%`,
                backgroundColor: getMetricColor(metrics.memory, { warning: 80, danger: 90 })
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">磁盘使用率</span>
            <span
              className="metric-value"
              style={{ color: getMetricColor(metrics.disk, { warning: 80, danger: 90 }) }}
            >
              {metrics.disk}%
            </span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.disk}%`,
                backgroundColor: getMetricColor(metrics.disk, { warning: 80, danger: 90 })
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">网络 I/O</span>
            <span className="metric-value">
              {metrics.netIn}/s {metrics.netOut}/s
            </span>
          </div>
          <div className="metric-details">
            <div className="net-stat">
              <span>入站:</span>
              <span>{metrics.netIn} MB/s</span>
            </div>
            <div className="net-stat">
              <span>出站:</span>
              <span>{metrics.netOut} MB/s</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">系统负载</span>
            <span
              className="metric-value"
              style={{ color: getMetricColor(metrics.load1m, { warning: 3, danger: 5 }) }}
            >
              {metrics.load1m}
            </span>
          </div>
          <div className="metric-details">
            <div className="load-stats">
              <span>1m: {metrics.load1m}</span>
              <span>5m: {metrics.load5m}</span>
              <span>15m: {metrics.load15m}</span>
            </div>
          </div>
        </div>

        <div className="metric-card health-indicator">
          <div className="health-content">
            <div className="health-icon">
              <div
                className="health-dot"
                style={{ backgroundColor: getHealthColor(metrics.health) }}
              ></div>
            </div>
            <div className="health-text">
              <div className="health-status">{getHealthText(metrics.health)}</div>
              <div className="health-description">
                {metrics.health === 'good' && '系统运行正常'}
                {metrics.health === 'warning' && '存在潜在问题'}
                {metrics.health === 'danger' && '系统处于危险状态'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="load-balance-section">
        <h3>负载均衡状态</h3>
        <div className="load-balance-info">
          <div className="balance-item">
            <span className="balance-label">是否均衡:</span>
            <span
              className="balance-value"
              style={{ color: loadBalance.isBalanced ? 'var(--success-green)' : 'var(--error-red)' }}
            >
              {loadBalance.isBalanced ? '是' : '否'}
            </span>
          </div>
          <div className="balance-item">
            <span className="balance-label">负载比例:</span>
            <span className="balance-value">{loadBalance.ratio}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">服务器数量:</span>
            <span className="balance-value">{loadBalance.serverCount}</span>
          </div>
        </div>
      </div>

      <div className="server-tags-section">
        <h3>服务器标签</h3>
        <div className="tags-container">
          {serverTags.map((tag, index) => (
            <span key={index} className="server-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;