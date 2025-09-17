import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useApiData = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loadBalance, setLoadBalance] = useState({});
  const [chartData, setChartData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});

  // 转换后端数据格式为前端需要的格式
  const transformData = useCallback((data) => {
    if (!data) return {};

    // 转换任务数据
    const transformedTasks = data.tasks?.map(task => ({
      id: task.id,
      name: task.name,
      cluster: task.cluster,
      status: task.status,
      progress: task.progress,
      startTime: new Date(task.start_time).toLocaleString('zh-CN'),
      estimatedEnd: new Date(task.estimated_end_time).toLocaleString('zh-CN')
    })) || [];

    // 转换告警数据
    const transformedAlerts = data.alerts?.map(alert => ({
      id: alert.id,
      time: new Date(alert.timestamp).toLocaleTimeString('zh-CN'),
      source: alert.server_id,
      severity: alert.severity,
      message: alert.message
    })) || [];

    // 转换指标数据 - 使用第一个服务器的指标作为系统指标
    const serverMetrics = data.metrics?.[0] || {};
    const transformedMetrics = {
      cpu: Math.round(serverMetrics.cpu_usage || 0),
      memory: Math.round(serverMetrics.memory_usage || 0),
      disk: Math.round(serverMetrics.disk_usage || 0),
      netIn: (serverMetrics.network_in_mbps || 0).toFixed(1),
      netOut: (serverMetrics.network_out_mbps || 0).toFixed(1),
      load1m: (serverMetrics.load_1m || 0).toFixed(1),
      load5m: (serverMetrics.load_5m || 0).toFixed(1),
      load15m: (serverMetrics.load_15m || 0).toFixed(1),
      health: data.system_health?.overall_status || 'good'
    };

    // 转换负载均衡数据
    const transformedLoadBalance = data.load_balance || {
      isBalanced: true,
      ratio: '1.0',
      serverCount: 0
    };

    // 转换时间序列数据
    const transformedChartData = data.time_series
      ?.filter(item => item.metric_type === 'cpu_usage')
      .map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        value: Math.round(item.value)
      })) || [];

    return {
      tasks: transformedTasks,
      alerts: transformedAlerts,
      metrics: transformedMetrics,
      loadBalance: transformedLoadBalance,
      chartData: transformedChartData,
      systemHealth: data.system_health || {}
    };
  }, []);

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!isStreaming) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getDashboardData();
      const transformed = transformData(data);

      setTasks(transformed.tasks);
      setAlerts(transformed.alerts);
      setMetrics(transformed.metrics);
      setLoadBalance(transformed.loadBalance);
      setChartData(transformed.chartData);
      setSystemHealth(transformed.systemHealth);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isStreaming, transformData]);

  // 搜索功能
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      fetchData();
      return;
    }

    try {
      const results = await api.searchData(term);

      // 合并搜索结果
      const allTasks = results.tasks || [];
      const allAlerts = results.alerts || [];

      // 转换搜索结果
      const transformedTasks = allTasks.map(task => ({
        id: task.id,
        name: task.name,
        cluster: task.cluster,
        status: task.status,
        progress: task.progress,
        startTime: new Date(task.start_time).toLocaleString('zh-CN'),
        estimatedEnd: new Date(task.estimated_end_time).toLocaleString('zh-CN')
      }));

      const transformedAlerts = allAlerts.map(alert => ({
        id: alert.id,
        time: new Date(alert.timestamp).toLocaleTimeString('zh-CN'),
        source: alert.server_id,
        severity: alert.severity,
        message: alert.message
      }));

      setTasks(transformedTasks);
      setAlerts(transformedAlerts);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    }
  }, []);

  // 刷新数据
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 定时更新数据
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      fetchData();
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming, fetchData]);

  return {
    isStreaming,
    setIsStreaming,
    searchTerm,
    setSearchTerm: handleSearch,
    loading,
    error,
    tasks,
    alerts,
    metrics,
    loadBalance,
    chartData,
    systemHealth,
    refreshData
  };
};