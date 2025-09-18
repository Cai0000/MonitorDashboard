import React from 'react';
import Header from './components/Header';
import TaskManager from './components/TaskManager';
import SystemStatus from './components/SystemStatus';
import DataVisualCenter from './components/DataVisualCenter';
import { useApiData } from './hooks/useApiData';
import './App.css';

function App() {
  const {
    isStreaming,
    setIsStreaming,
    setSearchTerm,
    tasks,
    alerts,
    metrics,
    loadBalance,
    chartData,
    serverTags,
    refreshData,
    loading,
    error
  } = useApiData();

  return (
    <div className="app">
      <Header
        onSearch={setSearchTerm}
        onToggleStream={() => setIsStreaming(!isStreaming)}
        onRefresh={refreshData}
        isStreaming={isStreaming}
      />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载中...</div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">连接后端服务器失败: {error}</span>
          <button className="error-retry" onClick={refreshData}>重试</button>
        </div>
      )}

      <div className="main-content">
        <TaskManager tasks={tasks} alerts={alerts} />

        <div className="right-panel">
          <SystemStatus metrics={metrics} loadBalance={loadBalance} serverTags={serverTags} />
          <DataVisualCenter chartData={chartData} />
        </div>
      </div>
    </div>
  );
}

export default App;
