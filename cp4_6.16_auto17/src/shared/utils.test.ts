import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculateTotalDistance,
  calculateAvgElevation,
  formatDistance,
  formatDuration,
  exportToGPX,
  getBounds,
} from './utils';
import { TrackPoint } from './types';

describe('haversineDistance', () => {
  it('应该正确计算两点之间的距离（北京-天津约114km）', () => {
    const distance = haversineDistance(39.9042, 116.4074, 39.1422, 117.1767);
    expect(distance).toBeGreaterThan(110000);
    expect(distance).toBeLessThan(120000);
  });

  it('相同坐标距离应为0', () => {
    const distance = haversineDistance(39.9042, 116.4074, 39.9042, 116.4074);
    expect(distance).toBeCloseTo(0, 5);
  });

  it('应该正确计算短距离（约1km）', () => {
    const distance = haversineDistance(39.9042, 116.4074, 39.9132, 116.4074);
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1100);
  });
});

describe('calculateTotalDistance', () => {
  it('点数小于2时应返回0', () => {
    const empty: TrackPoint[] = [];
    const single: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: 0, timestamp: new Date() },
    ];
    expect(calculateTotalDistance(empty)).toBe(0);
    expect(calculateTotalDistance(single)).toBe(0);
  });

  it('应该正确计算3个点的折线总距离', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 0, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 39.9052, lng: 116.4084, elevation: 0, timestamp: new Date() },
      { id: '3', trailId: 't1', lat: 39.9062, lng: 116.4094, elevation: 0, timestamp: new Date() },
    ];
    const total = calculateTotalDistance(points);
    const seg1 = haversineDistance(39.9042, 116.4074, 39.9052, 116.4084);
    const seg2 = haversineDistance(39.9052, 116.4084, 39.9062, 116.4094);
    expect(total).toBeCloseTo(seg1 + seg2, 3);
  });
});

describe('calculateAvgElevation', () => {
  it('包含null值时应正确过滤并计算平均值', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: 100, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 0, lng: 0, elevation: null, timestamp: new Date() },
      { id: '3', trailId: 't1', lat: 0, lng: 0, elevation: 200, timestamp: new Date() },
      { id: '4', trailId: 't1', lat: 0, lng: 0, elevation: null, timestamp: new Date() },
      { id: '5', trailId: 't1', lat: 0, lng: 0, elevation: 300, timestamp: new Date() },
    ];
    expect(calculateAvgElevation(points)).toBe(200);
  });

  it('全部为null时应返回0', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: null, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 0, lng: 0, elevation: null, timestamp: new Date() },
    ];
    expect(calculateAvgElevation(points)).toBe(0);
  });

  it('空数组应返回0', () => {
    expect(calculateAvgElevation([])).toBe(0);
  });

  it('普通情况应正确计算平均值', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: 10, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 0, lng: 0, elevation: 20, timestamp: new Date() },
      { id: '3', trailId: 't1', lat: 0, lng: 0, elevation: 30, timestamp: new Date() },
    ];
    expect(calculateAvgElevation(points)).toBe(20);
  });
});

describe('formatDistance', () => {
  it('小于1000米时应显示米', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(0)).toBe('0 m');
  });

  it('大于等于1000米时应转换为公里', () => {
    expect(formatDistance(1000)).toBe('1.00 km');
    expect(formatDistance(1500)).toBe('1.50 km');
    expect(formatDistance(2345.6)).toBe('2.35 km');
  });
});

describe('formatDuration', () => {
  it('小于60秒时应显示秒', () => {
    expect(formatDuration(0)).toBe('0秒');
    expect(formatDuration(30)).toBe('30秒');
    expect(formatDuration(59)).toBe('59秒');
  });

  it('60秒到3600秒之间应显示分秒', () => {
    expect(formatDuration(60)).toBe('1分0秒');
    expect(formatDuration(125)).toBe('2分5秒');
    expect(formatDuration(3599)).toBe('59分59秒');
  });

  it('大于等于3600秒应显示小时分', () => {
    expect(formatDuration(3600)).toBe('1小时0分');
    expect(formatDuration(3661)).toBe('1小时1分');
    expect(formatDuration(7200)).toBe('2小时0分');
  });
});

describe('exportToGPX', () => {
  it('输出应包含正确的XML头部结构', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 50, timestamp: new Date('2024-01-01T00:00:00Z') },
    ];
    const gpx = exportToGPX('测试轨迹', points);
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<trk>');
    expect(gpx).toContain('<name>测试轨迹</name>');
    expect(gpx).toContain('<trkseg>');
    expect(gpx).toContain('</trkseg>');
    expect(gpx).toContain('</trk>');
    expect(gpx).toContain('</gpx>');
  });

  it('应包含正确数量的轨迹点', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 50, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 39.9052, lng: 116.4084, elevation: 60, timestamp: new Date() },
      { id: '3', trailId: 't1', lat: 39.9062, lng: 116.4094, elevation: 70, timestamp: new Date() },
    ];
    const gpx = exportToGPX('测试', points);
    const matches = gpx.match(/<trkpt/g);
    expect(matches).toHaveLength(3);
  });

  it('轨迹点应包含正确的经纬度、海拔和时间', () => {
    const timestamp = new Date('2024-06-15T12:00:00Z');
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 123.5, timestamp },
    ];
    const gpx = exportToGPX('测试', points);
    expect(gpx).toContain('lat="39.9042"');
    expect(gpx).toContain('lon="116.4074"');
    expect(gpx).toContain('<ele>123.5</ele>');
    expect(gpx).toContain('<time>2024-06-15T12:00:00.000Z</time>');
  });

  it('海拔为null时不应包含ele标签', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: null, timestamp: new Date() },
    ];
    const gpx = exportToGPX('测试', points);
    expect(gpx).not.toContain('<ele>');
  });

  it('应正确转义特殊字符', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: null, timestamp: new Date() },
    ];
    const gpx = exportToGPX('测试&轨迹<特殊>字符"引用\'撇号', points);
    expect(gpx).toContain('测试&amp;轨迹&lt;特殊&gt;字符&quot;引用&apos;撇号');
  });
});

describe('getBounds', () => {
  it('空数组应返回null', () => {
    expect(getBounds([])).toBeNull();
  });

  it('单点应返回正确边界', () => {
    const points = [{ lat: 39.9042, lng: 116.4074 }];
    const bounds = getBounds(points);
    expect(bounds).toEqual([[39.9042, 116.4074], [39.9042, 116.4074]]);
  });

  it('多点应正确计算边界', () => {
    const points = [
      { lat: 39.9000, lng: 116.4000 },
      { lat: 39.9100, lng: 116.4100 },
      { lat: 39.8950, lng: 116.4050 },
      { lat: 39.9050, lng: 116.3950 },
    ];
    const bounds = getBounds(points);
    expect(bounds).toEqual([[39.8950, 116.3950], [39.9100, 116.4100]]);
  });

  it('应正确处理负数坐标', () => {
    const points = [
      { lat: -34.6037, lng: -58.3816 },
      { lat: -34.6050, lng: -58.3820 },
      { lat: -34.6020, lng: -58.3800 },
    ];
    const bounds = getBounds(points);
    expect(bounds).toEqual([[-34.6050, -58.3820], [-34.6020, -58.3800]]);
  });
});
