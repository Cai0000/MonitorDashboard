const API_BASE_URL = 'http://localhost:8001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 获取完整仪表板数据
  async getDashboardData() {
    return this.request('/dashboard');
  }

  // 获取服务器列表
  async getServers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });

    const endpoint = params.toString() ? `/servers?${params.toString()}` : '/servers';
    return this.request(endpoint);
  }

  // 获取服务器指标
  async getServerMetrics(serverId) {
    return this.request(`/servers/${serverId}/metrics`);
  }

  // 获取所有指标
  async getAllMetrics() {
    return this.request('/metrics');
  }

  // 获取任务列表
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });

    const endpoint = params.toString() ? `/tasks?${params.toString()}` : '/tasks';
    return this.request(endpoint);
  }

  // 获取任务详情
  async getTaskDetail(taskId) {
    return this.request(`/tasks/${taskId}`);
  }

  // 获取告警列表
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });

    const endpoint = params.toString() ? `/alerts?${params.toString()}` : '/alerts';
    return this.request(endpoint);
  }

  // 获取系统健康状态
  async getSystemHealth() {
    return this.request('/system-health');
  }

  // 获取负载均衡状态
  async getLoadBalance() {
    return this.request('/load-balance');
  }

  // 获取时间序列数据
  async getTimeSeriesData(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });

    const endpoint = params.toString() ? `/timeseries?${params.toString()}` : '/timeseries';
    return this.request(endpoint);
  }

  // 获取统计信息
  async getStatistics() {
    return this.request('/stats');
  }

  // 搜索数据
  async searchData(query, type = 'all') {
    const params = new URLSearchParams({ q: query, type });
    return this.request(`/search?${params.toString()}`);
  }
}

export default new ApiService();