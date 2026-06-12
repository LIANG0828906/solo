import type { SensorData, FrameData } from '@/stores/particleStore';

interface SensorReading {
  sensor_id: string;
  x: number;
  y: number;
  z: number;
  pm25: number;
  co2: number;
  temperature: number;
  humidity: number;
}

interface ParsedRow {
  timestamp: number;
  sensor_id: string;
  x: number;
  y: number;
  z: number;
  pm25: number;
  co2: number;
  temperature: number;
  humidity: number;
}

function parseRow(line: string): ParsedRow | null {
  const parts = line.split(',');
  if (parts.length < 9) return null;
  const ts = Number(parts[0]);
  if (isNaN(ts)) return null;
  const vals = parts.slice(1).map(Number);
  if (vals.some(isNaN)) return null;
  return {
    timestamp: ts,
    sensor_id: parts[1].trim(),
    x: vals[1],
    y: vals[2],
    z: vals[3],
    pm25: vals[4],
    co2: vals[5],
    temperature: vals[6],
    humidity: vals[7],
  };
}

export function parseCSV(
  csvText: string,
  onProgress?: (progress: number) => void,
): { frames: FrameData[]; rawData: SensorData[] } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { frames: [], rawData: [] };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row) rows.push(row);
  }

  if (rows.length === 0) return { frames: [], rawData: [] };
  onProgress?.(0.1);

  const timestampSet = new Set<number>();
  const sensorPositions = new Map<string, { x: number; y: number; z: number }>();
  for (const row of rows) {
    timestampSet.add(row.timestamp);
    if (!sensorPositions.has(row.sensor_id)) {
      sensorPositions.set(row.sensor_id, { x: row.x, y: row.y, z: row.z });
    }
  }

  const timestamps = Array.from(timestampSet).sort((a, b) => a - b);
  const sensorIds = Array.from(sensorPositions.keys());

  const dataMap = new Map<number, Map<string, SensorReading>>();
  for (const row of rows) {
    if (!dataMap.has(row.timestamp)) {
      dataMap.set(row.timestamp, new Map());
    }
    dataMap.get(row.timestamp)!.set(row.sensor_id, {
      sensor_id: row.sensor_id,
      x: row.x,
      y: row.y,
      z: row.z,
      pm25: row.pm25,
      co2: row.co2,
      temperature: row.temperature,
      humidity: row.humidity,
    });
  }

  onProgress?.(0.3);

  const paramKeys: (keyof Omit<SensorReading, 'sensor_id' | 'x' | 'y' | 'z'>)[] = [
    'pm25', 'co2', 'temperature', 'humidity',
  ];

  for (const sid of sensorIds) {
    const presentIndices: number[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const tsReadings = dataMap.get(timestamps[i]);
      if (tsReadings && tsReadings.has(sid)) {
        presentIndices.push(i);
      }
    }

    if (presentIndices.length === 0) continue;

    const pos = sensorPositions.get(sid)!;

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      if (!dataMap.has(ts)) dataMap.set(ts, new Map());
      const tsReadings = dataMap.get(ts)!;
      if (tsReadings.has(sid)) continue;

      let interpolated: SensorReading;

      if (i < presentIndices[0]) {
        const first = dataMap.get(timestamps[presentIndices[0]])!.get(sid)!;
        interpolated = { ...first, sensor_id: sid, x: pos.x, y: pos.y, z: pos.z };
      } else if (i > presentIndices[presentIndices.length - 1]) {
        const last = dataMap.get(timestamps[presentIndices[presentIndices.length - 1]])!.get(sid)!;
        interpolated = { ...last, sensor_id: sid, x: pos.x, y: pos.y, z: pos.z };
      } else {
        let loIdx = 0;
        let hiIdx = presentIndices.length - 1;
        for (let j = 0; j < presentIndices.length - 1; j++) {
          if (presentIndices[j] <= i && presentIndices[j + 1] > i) {
            loIdx = j;
            hiIdx = j + 1;
            break;
          }
        }
        const loTs = timestamps[presentIndices[loIdx]];
        const hiTs = timestamps[presentIndices[hiIdx]];
        const loReading = dataMap.get(loTs)!.get(sid)!;
        const hiReading = dataMap.get(hiTs)!.get(sid)!;
        const t = (ts - loTs) / (hiTs - loTs);

        interpolated = { sensor_id: sid, x: pos.x, y: pos.y, z: pos.z } as SensorReading;
        for (const key of paramKeys) {
          (interpolated as any)[key] = loReading[key] + t * (hiReading[key] - loReading[key]);
        }
      }

      tsReadings.set(sid, interpolated);
    }
  }

  onProgress?.(0.6);

  const rawData: SensorData[] = [];
  const frames: FrameData[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const tsReadings = dataMap.get(ts)!;

    const readings: SensorReading[] = [];
    for (const sid of sensorIds) {
      if (tsReadings.has(sid)) {
        readings.push(tsReadings.get(sid)!);
      }
    }

    rawData.push({
      timestamp: ts,
      sensors: readings,
    } as SensorData);

    const particles = new Float32Array(sensorIds.length * 4);
    for (let j = 0; j < sensorIds.length; j++) {
      const reading = tsReadings.get(sensorIds[j]);
      if (reading) {
        particles[j * 4] = reading.x;
        particles[j * 4 + 1] = reading.y;
        particles[j * 4 + 2] = reading.z;
        particles[j * 4 + 3] = reading.pm25;
      }
    }

    frames.push({
      time: ts,
      particles,
    });

    if (i % Math.max(1, Math.floor(timestamps.length / 10)) === 0) {
      onProgress?.(0.6 + 0.4 * (i / timestamps.length));
    }
  }

  onProgress?.(1);

  return { frames, rawData };
}
