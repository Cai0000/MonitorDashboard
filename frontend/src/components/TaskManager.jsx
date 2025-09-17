import React, { useState } from 'react';
import './TaskManager.css';

const TaskManager = ({ tasks = [], alerts = [] }) => {
  const [selectedTask, setSelectedTask] = useState(null);

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

  return (
    <div className="task-manager">
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
              <div className="alert-source">{alert.source}</div>
              <div className="alert-message">{alert.message}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <div className="task-detail">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;