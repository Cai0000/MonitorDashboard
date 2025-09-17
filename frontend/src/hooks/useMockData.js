import { useState, useEffect, useCallback } from 'react';

export const useMockData = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [tasks, setTasks] = useState([
    { id: 1, name: '服务器性能监控', cluster: '生产集群', status: 'running', progress: 75, startTime: '2024-01-15 10:30', estimatedEnd: '2024-01-15 11:30' },
    { id: 2, name: '网络流量分析', cluster: '测试集群', status: 'completed', progress: 100, startTime: '2024-01-15 09:00', estimatedEnd: '2024-01-15 10:00' },
    { id: 3, name: '安全扫描任务', cluster: '开发集群', status: 'pending', progress: 0, startTime: '2024-01-15 11:00', estimatedEnd: '2024-01-15 12:00' },
    { id: 4, name: '数据库备份', cluster: '生产集群', status: 'failed', progress: 45, startTime: '2024-01-15 08:00', estimatedEnd: '2024-01-15 09:00' },
    { id: 5, name: '日志收集任务', cluster: '生产集群', status: 'running', progress: 60, startTime: '2024-01-15 10:00', estimatedEnd: '2024-01-15 11:00' }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, time: '10:45:23', source: 'server-001', severity: 'high', message: 'CPU使用率超过90%' },
    { id: 2, time: '10:42:15', source: 'server-002', severity: 'medium', message: '内存使用率超过80%' },
    { id: 3, time: '10:38:42', source: 'load-balancer', severity: 'low', message: '网络延迟增加' },
    { id: 4, time: '10:35:11', source: 'server-003', severity: 'high', message: '磁盘空间不足' },
    { id: 5, time: '10:30:05', source: 'database', severity: 'medium', message: '数据库连接数过高' }
  ]);

  const [metrics, setMetrics] = useState({
    cpu: 65,
    memory: 78,
    disk: 45,
    netIn: 12.5,
    netOut: 8.3,
    load1m: 2.1,
    load5m: 1.8,
    load15m: 1.5,
    health: 'good'
  });

  const [loadBalance, setLoadBalance] = useState({
    isBalanced: true,
    ratio: 1.8,
    serverCount: 18
  });

  const [chartData, setChartData] = useState([]);

  const generateTimeSeriesData = useCallback(() => {
    const data = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - (19 - i) * 30000); // 30秒间隔
      data.push({
        time: time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        value: 50 + Math.random() * 40 + Math.sin(i * 0.5) * 10
      });
    }

    return data;
  }, []);

  const updateMetrics = useCallback(() => {
    setMetrics(prev => ({
      cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 8)),
      disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
      netIn: Math.max(0, prev.netIn + (Math.random() - 0.5) * 5),
      netOut: Math.max(0, prev.netOut + (Math.random() - 0.5) * 4),
      load1m: Math.max(0, prev.load1m + (Math.random() - 0.5) * 0.5),
      load5m: Math.max(0, prev.load5m + (Math.random() - 0.5) * 0.3),
      load15m: Math.max(0, prev.load15m + (Math.random() - 0.5) * 0.2),
      health: prev.cpu > 85 || prev.memory > 90 || prev.load1m > 5 ? 'danger' :
             prev.cpu > 70 || prev.memory > 80 || prev.load1m > 3 ? 'warning' : 'good'
    }));
  }, []);

  const updateTasks = useCallback(() => {
    setTasks(prev => prev.map(task => {
      if (task.status === 'running') {
        const newProgress = Math.min(100, task.progress + Math.random() * 5);
        const newStatus = newProgress >= 100 ? 'completed' : task.status;
        return {
          ...task,
          progress: newProgress,
          status: newStatus
        };
      }
      return task;
    }));
  }, []);

  const updateAlerts = useCallback(() => {
    if (Math.random() < 0.3) {
      const severities = ['high', 'medium', 'low'];
      const sources = ['server-001', 'server-002', 'server-003', 'load-balancer', 'database'];
      const messages = [
        'CPU使用率超过90%',
        '内存使用率超过80%',
        '网络延迟增加',
        '磁盘空间不足',
        '数据库连接数过高',
        '服务响应时间过长',
        '网络流量异常'
      ];

      const newAlert = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('zh-CN'),
        source: sources[Math.floor(Math.random() * sources.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  }, []);

  const updateLoadBalance = useCallback(() => {
    const newRatio = 1 + Math.random() * 4;
    setLoadBalance({
      isBalanced: newRatio < 3,
      ratio: newRatio.toFixed(1),
      serverCount: 18 + Math.floor(Math.random() * 5)
    });
  }, []);

  const updateChartData = useCallback(() => {
    const newData = generateTimeSeriesData();
    setChartData(newData);
  }, [generateTimeSeriesData]);

  const refreshData = useCallback(() => {
    updateMetrics();
    updateTasks();
    updateAlerts();
    updateLoadBalance();
    updateChartData();
  }, [updateMetrics, updateTasks, updateAlerts, updateLoadBalance, updateChartData]);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      updateMetrics();
      updateTasks();
      updateAlerts();
      updateLoadBalance();
      updateChartData();
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming, updateMetrics, updateTasks, updateAlerts, updateLoadBalance, updateChartData]);

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.cluster.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    isStreaming,
    setIsStreaming,
    searchTerm,
    setSearchTerm,
    tasks: filteredTasks,
    alerts,
    metrics,
    loadBalance,
    chartData,
    refreshData
  };
};