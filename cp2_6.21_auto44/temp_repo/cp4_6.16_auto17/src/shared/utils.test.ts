import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  haversineDistance,
  calculateTotalDistance,
  calculateAvgElevation,
  formatDistance,
  formatDuration,
  exportToGPX,
  getBounds,
  simplifyTrackPoints,
  downloadFile,
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

  it('两个相同的点距离应为0', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 0, timestamp: new Date() },
      { id: '2', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 0, timestamp: new Date() },
    ];
    expect(calculateTotalDistance(points)).toBeCloseTo(0, 5);
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

  it('只有一个点时应返回该点海拔', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: 150, timestamp: new Date() },
    ];
    expect(calculateAvgElevation(points)).toBe(150);
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

  it('0值应正确显示', () => {
    expect(formatDistance(0)).toBe('0 m');
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

  it('0值应正确显示', () => {
    expect(formatDuration(0)).toBe('0秒');
  });
});

describe('simplifyTrackPoints', () => {
  const createPoint = (lat: number, lng: number, idx: number = 0): TrackPoint => ({
    id: `p${idx}`,
    trailId: 't1',
    lat,
    lng,
    elevation: 100,
    timestamp: new Date(),
  });

  it('少于2个点直接返回', () => {
    const empty: TrackPoint[] = [];
    const single = [createPoint(39.9, 116.4, 0)];
    expect(simplifyTrackPoints(empty)).toEqual(empty);
    expect(simplifyTrackPoints(single)).toEqual(single);
  });

  it('2个点不简化', () => {
    const points = [
      createPoint(39.9000, 116.4000, 0),
      createPoint(39.9100, 116.4100, 1),
    ];
    const result = simplifyTrackPoints(points);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(points[0]);
    expect(result[1]).toBe(points[1]);
  });

  it('间隔密集的点被合并', () => {
    const points: TrackPoint[] = [];
    for (let i = 0; i < 20; i++) {
      points.push(createPoint(39.9000 + i * 0.0001, 116.4000 + i * 0.0001, i));
    }
    const result = simplifyTrackPoints(points, 50);
    expect(result.length).toBeLessThan(points.length);
    expect(result.length).toBeGreaterThan(2);
  });

  it('保留首尾点', () => {
    const points: TrackPoint[] = [];
    for (let i = 0; i < 10; i++) {
      points.push(createPoint(39.9000 + i * 0.001, 116.4000 + i * 0.001, i));
    }
    const result = simplifyTrackPoints(points, 100);
    expect(result[0]).toBe(points[0]);
    expect(result[result.length - 1]).toBe(points[points.length - 1]);
  });

  it('tolerance参数有效', () => {
    const points: TrackPoint[] = [];
    for (let i = 0; i < 30; i++) {
      points.push(createPoint(39.9000 + i * 0.0005, 116.4000 + i * 0.0005, i));
    }
    const resultLarge = simplifyTrackPoints(points, 200);
    const resultSmall = simplifyTrackPoints(points, 20);
    expect(resultLarge.length).toBeLessThan(resultSmall.length);
  });
});

describe('downloadFile', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    const mockBody = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockAnchor),
      body: mockBody,
    });
  });

  it('应创建Blob并生成下载链接', () => {
    downloadFile('test.txt', 'hello world', 'text/plain');

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('应正确设置文件名和MIME类型', () => {
    downloadFile('trail.gpx', '<xml></xml>', 'text/xml');

    const mockAnchor = (document.createElement as any).mock.results[0].value;
    expect(mockAnchor.download).toBe('trail.gpx');
    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('点击下载后应清理DOM和URL', () => {
    downloadFile('test.txt', 'test');

    const mockAnchor = (document.createElement as any).mock.results[0].value;
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
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
      { id: '1', trailId: 't1', lat: 39.9042, lng: 116.4074, elevation: 60, timestamp: new Date() },
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

  it('轨迹名称中的特殊字符应被转义 - 补充测试', () => {
    const points: TrackPoint[] = [
      { id: '1', trailId: 't1', lat: 0, lng: 0, elevation: 0, timestamp: new Date() },
    ];
    const gpx = exportToGPX('<>&"\'', points);
    expect(gpx).toContain('&lt;&gt;&amp;&quot;&apos;');
    expect(gpx).not.toContain('<name><>&"\'</name>');
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
