import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import './TaskManager.css';

// Memoized TaskItem component to prevent unnecessary re-renders
const TaskItem = memo(({ task, onTaskClick, getStatusColor, getStatusText, isSelected }) => {
  return (
    <div
      className={`task-item ${task.status} ${isSelected ? 'selected' : ''}`}
      onClick={() => onTaskClick(task)}
      style={{ cursor: 'pointer' }}
    >
      <div className="task-header">
        <span className="task-name">{task.name}</span>
        <span
          className="task-status"
          style={{ color: getStatusColor(task.status) }}
        >
          {getStatusText(task.status)}
        </span>
      </div>
      <div className="task-cluster">{task.cluster}</div>
      <div className="task-target-cluster">目标集群: {task.targetCluster || '无'}</div>
      <div className="task-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${task.progress}%`,
              backgroundColor: getStatusColor(task.status)
            }}
          ></div>
        </div>
        <span className="progress-text">{task.progress}%</span>
      </div>
    </div>
  );
});

const TaskManager = ({ tasks = [], alerts = [], clusters = [], servers = [] }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const detailRef = useRef(null);
  const clusterDetailRef = useRef(null);

  // 过滤器状态
  const [filters, setFilters] = useState({
    serverName: '',
    selectedTags: [],
    selectedRegion: ''
  });

  // 获取所有可用的标签和区域
  const allTags = [...new Set(servers.flatMap(server => server.tags || []))];
  const allRegions = [...new Set(servers.map(server => server.region).filter(Boolean))];

  // 过滤逻辑
  const filteredData = useMemo(() => {
    // 过滤服务器
    const filteredServers = servers.filter(server => {
      if (filters.serverName && !server.name.toLowerCase().includes(filters.serverName.toLowerCase())) {
        return false;
      }
      if (filters.selectedRegion && server.region !== filters.selectedRegion) {
        return false;
      }
      if (filters.selectedTags.length > 0) {
        const hasMatchingTag = filters.selectedTags.some(tag =>
          server.tags && server.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      return true;
    });

    // 过滤集群 - 只显示包含过滤后服务器的集群
    const filteredClusters = clusters
      .filter(cluster =>
        cluster.servers && cluster.servers.some(server =>
          filteredServers.some(filteredServer => filteredServer.id === server.id)
        )
      )
      .map(cluster => ({
        ...cluster,
        servers: cluster.servers.filter(server =>
          filteredServers.some(filteredServer => filteredServer.id === server.id)
        )
      }));

    // 过滤任务 - 基于集群过滤
    const filteredTasks = tasks.filter(task => {
      if (filteredClusters.length === 0) return true;
      return filteredClusters.some(cluster => cluster.id === task.cluster);
    });

    // 过滤警报 - 基于服务器过滤
    const filteredAlerts = alerts.filter(alert => {
      if (filteredServers.length === 0) return true;
      return filteredServers.some(server => server.id === alert.serverId);
    });

    return {
      servers: filteredServers,
      clusters: filteredClusters,
      tasks: filteredTasks,
      alerts: filteredAlerts
    };
  }, [servers, clusters, tasks, alerts, filters]);

  // Memoized callback functions
  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'running': return 'var(--accent-blue)';
      case 'pending':
      case 'queued': return 'var(--warning-yellow)';
      case 'failed': return 'var(--error-red)';
      default: return 'var(--text-secondary)';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '运行中';
      case 'pending':
      case 'queued': return '排队中';
      case 'failed': return '已失败';
      default: return '未知';
    }
  }, []);

  const getAlertSeverityColor = useCallback((severity) => {
    switch (severity) {
      case 'high': return 'var(--error-red)';
      case 'medium': return 'var(--warning-yellow)';
      case 'low': return 'var(--success-green)';
      default: return 'var(--text-secondary)';
    }
  }, []);

  // 过滤器处理函数
  const handleServerNameChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, serverName: value }));
  }, []);

  const handleRegionChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, selectedRegion: value }));
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      serverName: '',
      selectedTags: [],
      selectedRegion: ''
    });
  }, []);

  // 检查是否有激活的过滤器
  const hasActiveFilters = useMemo(() => {
    return filters.serverName || filters.selectedTags.length > 0 || filters.selectedRegion;
  }, [filters]);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailRef.current && !detailRef.current.contains(event.target)) {
        setSelectedTask(null);
      }
      if (clusterDetailRef.current && !clusterDetailRef.current.contains(event.target)) {
        setSelectedCluster(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="task-manager">
      {/* 过滤器部分 */}
      <div className="filter-section">
        <h3>服务器筛选</h3>

        {/* 服务器名称搜索 */}
        <div className="filter-group">
          <label>服务器名称:</label>
          <input
            type="text"
            placeholder="输入服务器名称..."
            value={filters.serverName}
            onChange={(e) => handleServerNameChange(e.target.value)}
            className="filter-input"
          />
        </div>

        {/* 区域选择 */}
        <div className="filter-group">
          <label>区域:</label>
          <select
            value={filters.selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="filter-select"
          >
            <option value="">全部区域</option>
            {allRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* 标签选择 */}
        <div className="filter-group">
          <label>标签:</label>
          <div className="tag-filters">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 清除过滤器按钮 */}
        {hasActiveFilters && (
          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              清除筛选
            </button>
          </div>
        )}

        {/* 当前筛选状态 */}
        {hasActiveFilters && (
          <div className="filter-status">
            <h4>当前筛选:</h4>
            <div className="active-filters">
              {filters.serverName && (
                <span className="active-filter">服务器: {filters.serverName}</span>
              )}
              {filters.selectedRegion && (
                <span className="active-filter">区域: {filters.selectedRegion}</span>
              )}
              {filters.selectedTags.length > 0 && (
                <span className="active-filter">标签: {filters.selectedTags.join(', ')}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 集群信息部分 */}
      <div className="cluster-section">
        <h2>集群信息</h2>
        <div className="cluster-list">
          {filteredData.clusters.map((cluster) => (
            <div
              key={cluster.id}
              className={`cluster-item ${selectedCluster?.id === cluster.id ? 'selected' : ''}`}
              onClick={() => setSelectedCluster(cluster)}
            >
              <div className="cluster-header">
                <span className="cluster-name">{cluster.name}</span>
              </div>
              <div className="cluster-details">
                <div className="cluster-service-type">服务类型: {cluster.serviceType}</div>
                <div className="cluster-server-count">服务器数量: {cluster.servers?.length || 0}</div>
              </div>
              <div className="cluster-tags">
                {cluster.tags?.map((tag, index) => (
                  <span key={index} className="cluster-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="task-list-section">
        <h2>任务列表 ({filteredData.tasks.length})</h2>
        <div className="task-list">
          {filteredData.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onTaskClick={handleTaskClick}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              isSelected={selectedTask?.id === task.id}
            />
          ))}
        </div>
      </div>

      <div className="alerts-section">
        <h2>警报列表 ({filteredData.alerts.length})</h2>
        <div className="alerts-list">
          {filteredData.alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <div className="alert-header">
                <span className="alert-time">{alert.time}</span>
                <span
                  className="alert-severity"
                  style={{ color: getAlertSeverityColor(alert.severity) }}
                >
                  {alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'}
                </span>
              </div>
              <div className="alert-source">来源: {alert.source}</div>
              <div className="alert-server">服务器: {alert.serverId}</div>
              <div className="alert-message">{alert.message}</div>
              {alert.resolved && (
                <div className="alert-resolved">✓ 已解决</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <div className="task-detail" ref={detailRef}>
          <h3>任务详情</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>任务名称:</label>
              <span>{selectedTask.name}</span>
            </div>
            <div className="detail-item">
              <label>任务集群:</label>
              <span>{selectedTask.cluster}</span>
            </div>
            <div className="detail-item">
              <label>任务状态:</label>
              <span style={{ color: getStatusColor(selectedTask.status) }}>
                {getStatusText(selectedTask.status)}
              </span>
            </div>
            <div className="detail-item">
              <label>进度:</label>
              <span>{selectedTask.progress}%</span>
            </div>
            <div className="detail-item">
              <label>开始时间:</label>
              <span>{selectedTask.startTime}</span>
            </div>
            <div className="detail-item">
              <label>预计结束时间:</label>
              <span>{selectedTask.estimatedEnd}</span>
            </div>
            <div className="detail-item full-width">
              <label>任务描述:</label>
              <span>{selectedTask.description || '无描述'}</span>
            </div>
          </div>
        </div>
      )}

      {selectedCluster && (
        <div className="cluster-detail" ref={clusterDetailRef}>
          <h3>集群详情</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>集群名称:</label>
              <span>{selectedCluster.name}</span>
            </div>
            <div className="detail-item">
              <label>服务类型:</label>
              <span>{selectedCluster.serviceType}</span>
            </div>
            <div className="detail-item">
              <label>服务器数量:</label>
              <span>{selectedCluster.servers?.length || 0}</span>
            </div>
            <div className="detail-item full-width">
              <label>服务器列表:</label>
              <div className="server-list">
                {selectedCluster.servers?.map((server) => (
                  <div key={server.id} className="server-item">
                    <span className="server-name">{server.name}</span>
                    <span className="server-region">{server.region}</span>
                  </div>
                )) || '无服务器数据'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;