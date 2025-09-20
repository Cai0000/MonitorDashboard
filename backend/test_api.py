import requests
import json
import time
from datetime import datetime, timedelta

class APITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []

    def log_test(self, test_name, success, message="", data=None):
        """记录测试结果"""
        status = "PASS" if success else "FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {message}")
        return success

    def make_request(self, method, endpoint, params=None, json_data=None):
        """发送HTTP请求"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=json_data, timeout=10)
            else:
                return None, "Unsupported method"

            if response.status_code == 200:
                return response.json(), None
            else:
                return None, f"HTTP {response.status_code}: {response.text}"
        except requests.exceptions.RequestException as e:
            return None, f"Request failed: {str(e)}"

    def test_server_status(self):
        """测试服务器状态"""
        data, error = self.make_request("GET", "/")
        if error:
            return self.log_test("Server Status", False, error)
        return self.log_test("Server Status", True, "Server is running", data)

    def test_dashboard_data(self):
        """测试仪表板数据"""
        data, error = self.make_request("GET", "/api/dashboard")
        if error:
            return self.log_test("Dashboard Data", False, error)

        # 验证数据结构
        required_keys = ["servers", "metrics", "tasks", "alerts", "system_health", "load_balance"]
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            return self.log_test("Dashboard Data", False, f"Missing keys: {missing_keys}")

        return self.log_test("Dashboard Data", True, f"Data loaded with {len(data['servers'])} servers", data)

    def test_servers_list(self):
        """测试服务器列表"""
        data, error = self.make_request("GET", "/api/servers")
        if error:
            return self.log_test("Servers List", False, error)

        if not isinstance(data, list):
            return self.log_test("Servers List", False, "Expected list data")

        return self.log_test("Servers List", True, f"Found {len(data)} servers")

    def test_server_filters(self):
        """测试服务器筛选"""
        # 按区域筛选
        data, error = self.make_request("GET", "/api/servers", {"region": "北京"})
        if error:
            return self.log_test("Server Region Filter", False, error)
        self.log_test("Server Region Filter", True, f"Found {len(data)} servers in 北京")

        # 按状态筛选
        data, error = self.make_request("GET", "/api/servers", {"status": "healthy"})
        if error:
            return self.log_test("Server Status Filter", False, error)
        self.log_test("Server Status Filter", True, f"Found {len(data)} healthy servers")

        return True

    def test_server_metrics(self):
        """测试服务器指标"""
        # 先获取服务器列表
        servers, error = self.make_request("GET", "/api/servers")
        if error or not servers:
            return self.log_test("Server Metrics", False, "No servers available")

        # 测试第一个服务器的指标
        server_id = servers[0]["id"]
        data, error = self.make_request("GET", f"/api/servers/{server_id}/metrics")
        if error:
            return self.log_test("Server Metrics", False, error)

        required_metrics = ["cpu_usage", "memory_usage", "disk_usage", "network_in_mbps"]
        missing_metrics = [m for m in required_metrics if m not in data]
        if missing_metrics:
            return self.log_test("Server Metrics", False, f"Missing metrics: {missing_metrics}")

        return self.log_test("Server Metrics", True, f"Metrics for {server_id}")

    def test_tasks_list(self):
        """测试任务列表"""
        data, error = self.make_request("GET", "/api/tasks")
        if error:
            return self.log_test("Tasks List", False, error)

        if not isinstance(data, list):
            return self.log_test("Tasks List", False, "Expected list data")

        return self.log_test("Tasks List", True, f"Found {len(data)} tasks")

    def test_alerts_list(self):
        """测试告警列表"""
        data, error = self.make_request("GET", "/api/alerts")
        if error:
            return self.log_test("Alerts List", False, error)

        if not isinstance(data, list):
            return self.log_test("Alerts List", False, "Expected list data")

        return self.log_test("Alerts List", True, f"Found {len(data)} alerts")

    def test_system_health(self):
        """测试系统健康状态"""
        data, error = self.make_request("GET", "/api/system-health")
        if error:
            return self.log_test("System Health", False, error)

        required_keys = ["overall_status", "total_servers", "healthy_servers"]
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            return self.log_test("System Health", False, f"Missing keys: {missing_keys}")

        return self.log_test("System Health", True, f"Status: {data['overall_status']}")

    def test_load_balance(self):
        """测试负载均衡状态"""
        data, error = self.make_request("GET", "/api/load-balance")
        if error:
            return self.log_test("Load Balance", False, error)

        required_keys = ["is_balanced", "ratio", "server_count"]
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            return self.log_test("Load Balance", False, f"Missing keys: {missing_keys}")

        return self.log_test("Load Balance", True, f"Ratio: {data['ratio']}, Balanced: {data['is_balanced']}")

    def test_time_series(self):
        """测试时间序列数据"""
        data, error = self.make_request("GET", "/api/timeseries", {"metric_type": "cpu_usage", "minutes": 5})
        if error:
            return self.log_test("Time Series Data", False, error)

        if not isinstance(data, list):
            return self.log_test("Time Series Data", False, "Expected list data")

        return self.log_test("Time Series Data", True, f"Found {len(data)} data points")

    def test_search(self):
        """测试搜索功能"""
        data, error = self.make_request("GET", "/api/search", {"q": "cpu", "type": "all"})
        if error:
            return self.log_test("Search Function", False, error)

        if not isinstance(data, dict) or "servers" not in data:
            return self.log_test("Search Function", False, "Invalid search response format")

        total_results = len(data.get("servers", [])) + len(data.get("tasks", [])) + len(data.get("alerts", []))
        return self.log_test("Search Function", True, f"Found {total_results} results for 'cpu'")

    def test_statistics(self):
        """测试统计信息"""
        data, error = self.make_request("GET", "/api/stats")
        if error:
            return self.log_test("Statistics", False, error)

        required_keys = ["total_servers", "servers_by_region", "active_tasks"]
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            return self.log_test("Statistics", False, f"Missing keys: {missing_keys}")

        return self.log_test("Statistics", True, f"Total servers: {data['total_servers']}")

    def test_data_updates(self):
        """测试数据更新"""
        # 获取初始数据
        data1, error = self.make_request("GET", "/api/dashboard")
        if error:
            return self.log_test("Data Updates", False, "Failed to get initial data")

        # 等待3秒
        time.sleep(3)

        # 获取更新后的数据
        data2, error = self.make_request("GET", "/api/dashboard")
        if error:
            return self.log_test("Data Updates", False, "Failed to get updated data")

        # 比较时间戳
        if "system_health" in data1 and "system_health" in data2:
            time1 = data1["system_health"].get("timestamp")
            time2 = data2["system_health"].get("timestamp")
            if time1 and time2 and time1 != time2:
                return self.log_test("Data Updates", True, "Data is updating properly")
            else:
                return self.log_test("Data Updates", False, "Data not updating")

        return self.log_test("Data Updates", False, "Cannot verify data updates")

    def run_all_tests(self):
        """运行所有测试"""
        print("Starting API Tests")
        print("=" * 50)

        tests = [
            self.test_server_status,
            self.test_dashboard_data,
            self.test_servers_list,
            self.test_server_filters,
            self.test_server_metrics,
            self.test_tasks_list,
            self.test_alerts_list,
            self.test_system_health,
            self.test_load_balance,
            self.test_time_series,
            self.test_search,
            self.test_statistics,
            self.test_data_updates
        ]

        passed = 0
        total = len(tests)

        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
            time.sleep(0.5)  # 避免请求过于频繁

        print("=" * 50)
        print(f"Test Results: {passed}/{total} tests passed")
        print(f"Success Rate: {(passed/total)*100:.1f}%")

        if passed == total:
            print("All tests passed! The API is working correctly.")
        else:
            print("Some tests failed. Please check the issues above.")

        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()

    # 保存测试结果
    with open("test_results.json", "w", encoding="utf-8") as f:
        json.dump(tester.test_results, f, indent=2, ensure_ascii=False)

    print(f"\nTest results saved to test_results.json")
    exit(0 if success else 1)