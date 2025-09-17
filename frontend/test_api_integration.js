// 前端API集成测试脚本
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// 模拟浏览器环境
global.fetch = fetch;

// 导入API服务
import api from './src/services/api.js';

async function testAPIIntegration() {
    console.log('开始测试前后端API集成...\n');

    let tests = [];
    let passed = 0;
    let failed = 0;

    // 测试1: 获取仪表板数据
    tests.push({
        name: '获取仪表板数据',
        test: async () => {
            try {
                const data = await api.getDashboardData();
                console.log('✓ 仪表板数据获取成功');
                console.log(`  - 服务器数量: ${data.servers?.length || 0}`);
                console.log(`  - 任务数量: ${data.tasks?.length || 0}`);
                console.log(`  - 告警数量: ${data.alerts?.length || 0}`);
                return true;
            } catch (error) {
                console.log(`✗ 仪表板数据获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试2: 获取服务器列表
    tests.push({
        name: '获取服务器列表',
        test: async () => {
            try {
                const servers = await api.getServers();
                console.log('✓ 服务器列表获取成功');
                console.log(`  - 总服务器数: ${servers.length}`);

                // 测试筛选功能
                const filteredServers = await api.getServers({ region: '北京' });
                console.log(`  - 北京地区服务器: ${filteredServers.length}`);
                return true;
            } catch (error) {
                console.log(`✗ 服务器列表获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试3: 获取系统健康状态
    tests.push({
        name: '获取系统健康状态',
        test: async () => {
            try {
                const health = await api.getSystemHealth();
                console.log('✓ 系统健康状态获取成功');
                console.log(`  - 整体状态: ${health.overall_status}`);
                console.log(`  - 健康服务器: ${health.healthy_servers}`);
                console.log(`  - 警告服务器: ${health.warning_servers}`);
                return true;
            } catch (error) {
                console.log(`✗ 系统健康状态获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试4: 获取任务列表
    tests.push({
        name: '获取任务列表',
        test: async () => {
            try {
                const tasks = await api.getTasks();
                console.log('✓ 任务列表获取成功');
                console.log(`  - 总任务数: ${tasks.length}`);

                // 测试运行中任务筛选
                const runningTasks = await api.getTasks({ status: 'running' });
                console.log(`  - 运行中任务: ${runningTasks.length}`);
                return true;
            } catch (error) {
                console.log(`✗ 任务列表获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试5: 获取告警列表
    tests.push({
        name: '获取告警列表',
        test: async () => {
            try {
                const alerts = await api.getAlerts();
                console.log('✓ 告警列表获取成功');
                console.log(`  - 告警数量: ${alerts.length}`);

                // 测试严重程度筛选
                const highAlerts = await api.getAlerts({ severity: 'high' });
                console.log(`  - 高危告警: ${highAlerts.length}`);
                return true;
            } catch (error) {
                console.log(`✗ 告警列表获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试6: 获取时间序列数据
    tests.push({
        name: '获取时间序列数据',
        test: async () => {
            try {
                const timeSeries = await api.getTimeSeriesData({
                    metric_type: 'cpu_usage',
                    minutes: 5
                });
                console.log('✓ 时间序列数据获取成功');
                console.log(`  - 数据点数量: ${timeSeries.length}`);
                return true;
            } catch (error) {
                console.log(`✗ 时间序列数据获取失败: ${error.message}`);
                return false;
            }
        }
    });

    // 测试7: 搜索功能
    tests.push({
        name: '搜索功能',
        test: async () => {
            try {
                const results = await api.searchData('cpu', 'all');
                console.log('✓ 搜索功能正常');
                console.log(`  - 搜索结果: 服务器${results.servers?.length || 0}个, 任务${results.tasks?.length || 0}个, 告警${results.alerts?.length || 0}个`);
                return true;
            } catch (error) {
                console.log(`✗ 搜索功能失败: ${error.message}`);
                return false;
            }
        }
    });

    // 执行所有测试
    console.log('='.repeat(50));
    for (const test of tests) {
        console.log(`\n测试: ${test.name}`);
        try {
            const result = await test.test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`✗ 测试异常: ${error.message}`);
            failed++;
        }
    }

    // 输出结果
    console.log('\n' + '='.repeat(50));
    console.log(`测试结果: ${passed}个通过, ${failed}个失败`);
    console.log(`成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 所有API集成测试通过！前后端集成正常工作。');
        return true;
    } else {
        console.log(`\n⚠️  ${failed}个测试失败，请检查问题。`);
        return false;
    }
}

// 运行测试
testAPIIntegration().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('测试运行出错:', error);
    process.exit(1);
});