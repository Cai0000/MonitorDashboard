import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useApiData = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loadBalance, setLoadBalance] = useState({});
  const [chartData, setChartData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [serverTags, setServerTags] = useState([]);
  const [servers, setServers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [groupedData, setGroupedData] = useState({});

  // 转换后端数据格式为前端需要的格式
  const transformData = useCallback((data) => {
    if (!data) return {};

    // 转换任务数据
    const transformedTasks = data.tasks?.map(task => ({
      id: task.taskId,
      name: task.taskName,
      cluster: task.cluster,
      targetCluster: task.targetCluster,
      status: task.status,
      progress: task.progress,
      startTime: new Date(task.startTime).toLocaleString('zh-CN'),
      estimatedEnd: new Date(task.estimatedEndTime).toLocaleString('zh-CN'),
      description: task.description,
      // 添加原始时间戳用于时间过滤
      startTimeTimestamp: new Date(task.startTime).getTime(),
      estimatedEndTimeTimestamp: new Date(task.estimatedEndTime).getTime(),
      createdAt: task.createdAt || new Date().getTime()
    })) || [];

    // 转换告警数据
    const transformedAlerts = data.alerts?.map(alert => ({
      id: alert.alarmId,
      time: new Date(alert.timestamp).toLocaleTimeString('zh-CN'),
      source: alert.source,
      serverId: alert.serverId,
      severity: alert.severity,
      message: alert.message,
      resolved: alert.resolved
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
    const transformedChartData = data.time_series?.map(item => ({
      timestamp: item.timestamp,
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      value: Math.round(item.value),
      metric_type: item.metric_type,
      serverId: item.server_id,
      region: item.region,
      tags: item.service_type ? [item.service_type] : []
    })) || [];

    // 获取服务器标签
    const uniqueTags = [...new Set(data.servers?.flatMap(server => server.tags) || [])];

    // 转换服务器数据
    const transformedServers = data.servers?.map(server => ({
      id: server.serverId,
      name: server.serverName,
      region: server.region,
      tags: [server.serviceType, ...server.tags],
      status: server.status,
      serviceType: server.serviceType,
      clusterId: server.clusterId,
      ip_address: server.ipAddress
    })) || [];

    // 转换集群数据
    const transformedClusters = data.clusters?.map(cluster => ({
      id: cluster.clusterId,
      name: cluster.clusterName,
      region: cluster.region,
      tags: cluster.tags,
      serviceType: cluster.serviceType,
      serverIds: cluster.serverIds,
      servers: transformedServers.filter(server => cluster.serverIds.includes(server.id))
    })) || [];

    return {
      tasks: transformedTasks,
      alerts: transformedAlerts,
      metrics: transformedMetrics,
      loadBalance: transformedLoadBalance,
      chartData: transformedChartData,
      systemHealth: data.system_health || {},
      serverTags: uniqueTags,
      servers: transformedServers,
      clusters: transformedClusters,
      groupedData: data.grouped_data || {}
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

      // 当搜索激活时，不更新任务列表，保持搜索结果
      if (!isSearchActive) {
        setTasks(prevTasks => transformed.tasks);
      }
      
      setAlerts(prevAlerts => transformed.alerts);
      setMetrics(prevMetrics => transformed.metrics);
      setLoadBalance(prevLoadBalance => transformed.loadBalance);
      setChartData(prevChartData => transformed.chartData);
      setSystemHealth(prevSystemHealth => transformed.systemHealth);
      setServerTags(prevServerTags => transformed.serverTags);
      setServers(prevServers => transformed.servers);
      setClusters(prevClusters => transformed.clusters);
      setGroupedData(prevGroupedData => transformed.groupedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isStreaming, isSearchActive, transformData]);

  // 搜索功能
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);

    try {
      const results = await api.searchData(term);

      // 转换搜索结果
      const transformedTasks = results.tasks?.map(task => ({
        id: task.id,
        name: task.name,
        cluster: task.cluster,
        targetCluster: task.target_cluster,
        status: task.status,
        progress: task.progress,
        startTime: new Date(task.start_time).toLocaleString('zh-CN'),
        estimatedEnd: new Date(task.estimated_end_time).toLocaleString('zh-CN')
      })) || [];

      const transformedAlerts = results.alerts?.map(alert => ({
        id: alert.id,
        time: new Date(alert.timestamp).toLocaleTimeString('zh-CN'),
        source: alert.source,
        serverId: alert.server_id,
        severity: alert.severity,
        message: alert.message,
        resolved: alert.resolved
      })) || [];

      // 更新搜索结果
      setTasks(prevTasks => transformedTasks);
      setAlerts(prevAlerts => transformedAlerts);
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
  }, [isStreaming, isSearchActive, fetchData]);

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
    serverTags,
    servers,
    clusters,
    refreshData,
    groupedData
  };
};