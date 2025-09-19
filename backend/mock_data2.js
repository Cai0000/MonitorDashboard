// mock-data-generator.js
import { faker } from '@faker-js/faker';

// --- 基础配置 ---
const CLUSTERS_COUNT = 3;
const SERVERS_PER_CLUSTER = 5;

// --- 生成 Cluster ---
function generateClusters() {
  return Array.from({ length: CLUSTERS_COUNT }).map((_, i) => {
    const clusterId = `cluster-${i + 1}`;
    return {
      clusterId,
      clusterName: faker.company.name(),
      region: faker.location.countryCode(),
      tags: [faker.hacker.adjective(), faker.hacker.noun()],
      serviceType: faker.helpers.arrayElement(["web", "db", "cache"]),
      serverIds: Array.from({ length: SERVERS_PER_CLUSTER }).map(
        (_, j) => `srv-${i + 1}-${j + 1}`
      ),
    };
  });
}

// --- 生成 Server ---
function generateServers(clusters) {
  return clusters.flatMap(cluster =>
    cluster.serverIds.map(serverId => ({
      serverId,
      serverName: faker.internet.domainWord(),
      region: cluster.region,
      tags: [faker.hacker.verb(), faker.hacker.adjective()],
      serviceType: cluster.serviceType,
      clusterId: cluster.clusterId,
    }))
  );
}

// --- 生成 Task ---
function generateTasks(clusters, count = 10) {
  return Array.from({ length: count }).map((_, i) => ({
    taskId: `task-${i + 1}`,
    taskName: faker.hacker.phrase(),
    targetCluster: faker.helpers.arrayElement(clusters).clusterId,
    status: faker.helpers.arrayElement(["queued", "running", "failed", "completed"]),
    progress: faker.number.int({ min: 0, max: 100 }),
    createdAt: Date.now() - faker.number.int({ min: 0, max: 3600 }) * 1000,
  }));
}

// --- 生成 Alarm ---
function generateAlarms(servers, count = 20) {
  return Array.from({ length: count }).map((_, i) => {
    const server = faker.helpers.arrayElement(servers);
    return {
      alarmId: `alarm-${i + 1}`,
      serverId: server.serverId,
      timestamp: Date.now() - faker.number.int({ min: 0, max: 1800 }) * 1000,
      source: faker.helpers.arrayElement(["nginx", "disk-monitor", "task-runner"]),
      severity: faker.helpers.arrayElement(["low", "medium", "high"]),
      message: faker.hacker.phrase(),
    };
  });
}

// --- 生成 Metrics ---
function generateMetrics(servers, count = 50) {
  return Array.from({ length: count }).map((_, i) => {
    const server = faker.helpers.arrayElement(servers);
    return {
      timestamp: Date.now() - i * 2000,
      serverId: server.serverId,
      metrics: {
        cpuUsage: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
        memoryUsage: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
        diskRead: faker.number.float({ min: 0, max: 500, precision: 0.1 }),
        diskWrite: faker.number.float({ min: 0, max: 500, precision: 0.1 }),
        netIn: faker.number.float({ min: 0, max: 1000, precision: 0.1 }),
        netOut: faker.number.float({ min: 0, max: 1000, precision: 0.1 }),
        load1m: faker.number.float({ min: 0, max: 10, precision: 0.1 }),
        load5m: faker.number.float({ min: 0, max: 10, precision: 0.1 }),
        load15m: faker.number.float({ min: 0, max: 10, precision: 0.1 }),
      },
    };
  });
}

// --- 主函数 ---
function generateMockData() {
  const clusters = generateClusters();
  const servers = generateServers(clusters);
  const tasks = generateTasks(clusters);
  const alarms = generateAlarms(servers);
  const metrics = generateMetrics(servers);

  return { clusters, servers, tasks, alarms, metrics };
}

// 调用
console.log(JSON.stringify(generateMockData(), null, 2));
