// ============================================================================
// dataHandler.ts - 数据处理模块
// 职责：解析模拟城市温度JSON数据，温度值映射到色阶，计算高度和颜色，
//       生成传递给渲染模块的Mesh数据数组
// 调用关系：
//   - 被 main.ts 调用初始化
//   - emit('dataReady', meshData)  →  renderer.ts 接收并渲染
//   - emit('hourlyDataReady', ...) →  renderer.ts 接收并更新时间轴动画
// 数据流向：静态JSON数据 → 解析处理 → 计算Mesh属性 → 事件总线发送给渲染模块
// ============================================================================

import * as THREE from 'three';
import { eventBus } from './eventBus';

// 温度数据点接口
export interface TemperaturePoint {
  lat: number;
  lng: number;
  temperature: number;
  gridX: number;
  gridZ: number;
}

// Mesh数据接口 - 传递给渲染模块
export interface MeshData {
  id: string;
  gridX: number;
  gridZ: number;
  position: THREE.Vector3;
  height: number;
  temperature: number;
  topColor: THREE.Color;
  sideOpacity: number;
}

// 24小时温度数据
export interface HourlyTemperatureData {
  hour: number;
  points: TemperaturePoint[];
}

// 色阶控制点 - 蓝色 → 绿色 → 黄色 → 红色
const COLOR_STOPS: Array<{ temp: number; color: THREE.Color }> = [
  { temp: 15, color: new THREE.Color('#0066FF') },
  { temp: 25, color: new THREE.Color('#00CC66') },
  { temp: 35, color: new THREE.Color('#FFCC00') },
  { temp: 45, color: new THREE.Color('#FF3300') },
];

// 高度范围配置
const HEIGHT_CONFIG = {
  minHeight: 0.5,
  maxHeight: 4.0,
  minTemp: 15,
  maxTemp: 45,
};

// 网格配置
const GRID_CONFIG = {
  size: 10,
  barWidth: 0.8,
  spacing: 0.2,
};

export class DataHandler {
  private gridSize: number;
  private hourlyData: HourlyTemperatureData[] = [];

  constructor(gridSize: number = 10) {
    this.gridSize = gridSize;
  }

  // 线性插值计算温度对应的高度
  public calculateHeight(temperature: number): number {
    const { minHeight, maxHeight, minTemp, maxTemp } = HEIGHT_CONFIG;
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));
    const ratio = (clampedTemp - minTemp) / (maxTemp - minTemp);
    return minHeight + ratio * (maxHeight - minHeight);
  }

  // 蓝→绿→黄→红 四色渐变色阶映射函数
  public mapTemperatureToColor(temperature: number): THREE.Color {
    const { minTemp, maxTemp } = HEIGHT_CONFIG;
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));

    // 找到温度所在的色阶区间
    for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
      const start = COLOR_STOPS[i];
      const end = COLOR_STOPS[i + 1];

      if (clampedTemp >= start.temp && clampedTemp <= end.temp) {
        const ratio = (clampedTemp - start.temp) / (end.temp - start.temp);
        return start.color.clone().lerp(end.color, ratio);
      }
    }

    // 边界情况
    if (clampedTemp <= COLOR_STOPS[0].temp) {
      return COLOR_STOPS[0].color.clone();
    }
    return COLOR_STOPS[COLOR_STOPS.length - 1].color.clone();
  }

  // 生成模拟的城市温度数据
  public generateMockData(): TemperaturePoint[] {
    const points: TemperaturePoint[] = [];
    const center = this.gridSize / 2;

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        // 计算距离中心的距离，模拟城市热岛效应（中心温度高）
        const distFromCenter = Math.sqrt(
          Math.pow(x - center, 2) + Math.pow(z - center, 2)
        );
        const maxDist = Math.sqrt(2) * center;
        const heatIslandFactor = 1 - distFromCenter / maxDist;

        // 基础温度 + 热岛效应 + 随机波动
        const baseTemp = 25;
        const heatIslandBonus = heatIslandFactor * 12;
        const randomVariation = (Math.random() - 0.5) * 6;
        const temperature = baseTemp + heatIslandBonus + randomVariation;

        points.push({
          lat: 39.9 + x * 0.01,
          lng: 116.4 + z * 0.01,
          temperature: Math.round(temperature * 10) / 10,
          gridX: x,
          gridZ: z,
        });
      }
    }

    return points;
  }

  // 生成24小时周期的温度数据
  public generateHourlyData(): HourlyTemperatureData[] {
    const hourlyData: HourlyTemperatureData[] = [];

    // 一天中的温度变化曲线（模拟）
    const tempVariationByHour: number[] = [
      -4, -4.5, -5, -5, -4.5, -3.5, // 0-5点
      -2, 0, 3, 5, 7, 8,             // 6-11点
      9, 9.5, 9, 8, 6, 4,            // 12-17点
      2, 0, -1, -2, -3, -3.5,        // 18-23点
    ];

    // 基础数据
    const basePoints = this.generateMockData();

    for (let hour = 0; hour < 24; hour++) {
      const tempOffset = tempVariationByHour[hour];
      const points: TemperaturePoint[] = basePoints.map((p) => ({
        ...p,
        temperature: Math.round((p.temperature + tempOffset) * 10) / 10,
      }));
      hourlyData.push({ hour, points });
    }

    this.hourlyData = hourlyData;
    return hourlyData;
  }

  // 将温度数据转换为Mesh数据数组
  public processDataToMesh(points: TemperaturePoint[]): MeshData[] {
    const { barWidth, spacing } = GRID_CONFIG;
    const totalUnit = barWidth + spacing;
    const offset = (this.gridSize * totalUnit - spacing) / 2 - barWidth / 2;

    return points.map((point) => {
      const x = point.gridX * totalUnit - offset;
      const z = point.gridZ * totalUnit - offset;
      const height = this.calculateHeight(point.temperature);
      const topColor = this.mapTemperatureToColor(point.temperature);

      return {
        id: `bar-${point.gridX}-${point.gridZ}`,
        gridX: point.gridX,
        gridZ: point.gridZ,
        position: new THREE.Vector3(x, height / 2, z),
        height,
        temperature: point.temperature,
        topColor,
        sideOpacity: 0.6,
      };
    });
  }

  // 初始化并发送数据
  public initialize(): void {
    const points = this.generateMockData();
    const meshData = this.processDataToMesh(points);
    const hourlyData = this.generateHourlyData();

    // 发送初始数据到渲染模块
    eventBus.emit('dataReady', meshData, {
      gridSize: this.gridSize,
      barWidth: GRID_CONFIG.barWidth,
      minTemp: HEIGHT_CONFIG.minTemp,
      maxTemp: HEIGHT_CONFIG.maxTemp,
    });

    // 发送24小时数据
    const hourlyMeshData = hourlyData.map((hd) => ({
      hour: hd.hour,
      meshData: this.processDataToMesh(hd.points),
    }));
    eventBus.emit('hourlyDataReady', hourlyMeshData);

    // 发送统计信息
    this.updateStats(points);
  }

  // 根据小时获取数据
  public getDataForHour(hour: number): MeshData[] {
    const hourData = this.hourlyData[hour % 24];
    if (hourData) {
      return this.processDataToMesh(hourData.points);
    }
    return [];
  }

  // 更新统计信息
  private updateStats(points: TemperaturePoint[]): void {
    const temps = points.map((p) => p.temperature);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);

    eventBus.emit('statsUpdate', {
      avgTemp: Math.round(avgTemp * 10) / 10,
      maxTemp,
      minTemp,
      totalBars: points.length,
    });
  }

  // 获取当前网格配置
  public getGridConfig() {
    return { ...GRID_CONFIG, size: this.gridSize };
  }

  // 获取高度配置
  public getHeightConfig() {
    return { ...HEIGHT_CONFIG };
  }
}

export const dataHandler = new DataHandler(10);
