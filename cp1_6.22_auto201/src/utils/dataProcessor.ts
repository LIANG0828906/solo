export interface SensorReading {
  id: string;
  lat: number;
  lng: number;
  vehicleCount: number;
  timestamp: number;
  roadName: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  roadName: string;
  vehicleCount: number;
}

export interface TrafficDataResponse {
  data: SensorReading[];
  timeRange: string;
  generatedAt: number;
}

function getTimeRangeMilliseconds(range: string): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

export function filterByTimeRange(
  data: SensorReading[],
  timeRange: string,
  endTime: number = Date.now()
): SensorReading[] {
  const rangeMs = getTimeRangeMilliseconds(timeRange);
  const startTime = endTime - rangeMs;
  return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
}

export function aggregateToGrid(
  data: SensorReading[],
  gridSize: number = 0.01
): HeatmapPoint[] {
  if (data.length === 0) return [];

  const gridMap = new Map<string, {
    totalVehicles: number;
    count: number;
    lat: number;
    lng: number;
    roadName: string;
  }>();

  for (const reading of data) {
    const gridLat = Math.floor(reading.lat / gridSize) * gridSize;
    const gridLng = Math.floor(reading.lng / gridSize) * gridSize;
    const key = `${gridLat.toFixed(4)}_${gridLng.toFixed(4)}`;

    const existing = gridMap.get(key);
    if (existing) {
      existing.totalVehicles += reading.vehicleCount;
      existing.count += 1;
      existing.lat = (existing.lat + reading.lat) / 2;
      existing.lng = (existing.lng + reading.lng) / 2;
    } else {
      gridMap.set(key, {
        totalVehicles: reading.vehicleCount,
        count: 1,
        lat: reading.lat,
        lng: reading.lng,
        roadName: reading.roadName
      });
    }
  }

  const aggregated: HeatmapPoint[] = [];
  let maxVehicles = 0;

  for (const value of gridMap.values()) {
    const avgVehicles = value.totalVehicles / value.count;
    maxVehicles = Math.max(maxVehicles, avgVehicles);
    aggregated.push({
      lat: value.lat,
      lng: value.lng,
      intensity: 0,
      roadName: value.roadName,
      vehicleCount: Math.floor(avgVehicles)
    });
  }

  if (maxVehicles > 0) {
    for (const point of aggregated) {
      point.intensity = Math.min(1, point.vehicleCount / maxVehicles);
    }
  }

  return aggregated.sort((a, b) => b.intensity - a.intensity).slice(0, 3000);
}

export function processTrafficData(
  response: TrafficDataResponse,
  timeRange?: string
): HeatmapPoint[] {
  const filtered = timeRange
    ? filterByTimeRange(response.data, timeRange)
    : response.data;
  return aggregateToGrid(filtered);
}

export function getCongestionLevel(intensity: number): '低' | '中' | '高' {
  if (intensity < 0.33) return '低';
  if (intensity < 0.66) return '中';
  return '高';
}

export function getAnimationFrameData(
  response: TrafficDataResponse,
  progress: number,
  windowSize: number = 0.1
): HeatmapPoint[] {
  if (response.data.length === 0) return [];

  const sortedData = [...response.data].sort((a, b) => a.timestamp - b.timestamp);
  const startTime = sortedData[0].timestamp;
  const endTime = sortedData[sortedData.length - 1].timestamp;
  const totalDuration = endTime - startTime;

  const windowStart = startTime + totalDuration * Math.max(0, progress - windowSize / 2);
  const windowEnd = startTime + totalDuration * Math.min(1, progress + windowSize / 2);

  const frameData = sortedData.filter(
    d => d.timestamp >= windowStart && d.timestamp <= windowEnd
  );

  return aggregateToGrid(frameData);
}
