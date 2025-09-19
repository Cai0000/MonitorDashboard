import React, { useState, useEffect, useRef } from 'react';
import './TaskManager.css';

const TaskManager = ({ tasks = [], alerts = [], clusters = [], servers = [] }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const detailRef = useRef(null);
  const clusterDetailRef = useRef(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'running': return 'var(--accent-blue)';
      case 'pending': return 'var(--warning-yellow)';
      case 'failed': return 'var(--error-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '✓ 完成';
      case 'running': return '⏳ 运行中';
      case 'pending': return '⏱️ 等待中';
      case 'failed': return '✖️ 失败';
      default: return '❓ 未知';
    }
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'var(--error-red)';
      case 'medium': return 'var(--warning-yellow)';
      case 'low': return 'var(--success-green)';
      default: return 'var(--text-secondary)';
    }
  };

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
      {/* 集群信息部分 */}
      <div className="cluster-section">
        <h2>集群信息</h2>
        <div className="cluster-list">
          {clusters.map((cluster) => (
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
        <h2>任务列表</h2>
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
              onClick={() => setSelectedTask(task)}
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
          ))}
        </div>
      </div>

      <div className="alerts-section">
        <h2>警报列表</h2>
        <div className="alerts-list">
          {alerts.map((alert) => (
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