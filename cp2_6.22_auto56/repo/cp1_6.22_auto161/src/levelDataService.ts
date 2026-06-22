export interface Obstacle {
  id: string;
  type: 'rect' | 'triangle' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
}

export interface Button {
  id: string;
  x: number;
  y: number;
  radius: number;
  triggerDoorId?: string;
  triggerPlatformId?: string;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetY: number;
}

export interface Level {
  id: number;
  playerStart: { x: number; y: number };
  obstacles: Obstacle[];
  buttons: Button[];
  doors?: Door[];
  platforms?: Platform[];
  exit: { x: number; y: number; width: number; height: number };
}

export interface RecordRequest {
  playerId: string;
  levelId: number;
  duration: number;
}

export interface RecordResponse {
  success: boolean;
  fastestTime: number;
}

const API_BASE = 'http://localhost:3001/api';

export async function fetchLevels(): Promise<Level[]> {
  const response = await fetch(`${API_BASE}/levels`);
  if (!response.ok) {
    throw new Error('获取关卡数据失败');
  }
  return response.json();
}

export async function submitRecord(
  playerId: string,
  levelId: number,
  duration: number
): Promise<RecordResponse> {
  const response = await fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      levelId,
      duration,
      timestamp: Date.now(),
    }),
  });
  if (!response.ok) {
    throw new Error('提交记录失败');
  }
  return response.json();
}

export function getObstacleVertices(obstacle: Obstacle): { x: number; y: number }[] {
  switch (obstacle.type) {
    case 'rect': {
      const w = obstacle.width || 0;
      const h = obstacle.height || 0;
      return [
        { x: obstacle.x, y: obstacle.y },
        { x: obstacle.x + w, y: obstacle.y },
        { x: obstacle.x + w, y: obstacle.y + h },
        { x: obstacle.x, y: obstacle.y + h },
      ];
    }
    case 'triangle':
    case 'polygon': {
      const pts = obstacle.points || [];
      const vertices: { x: number; y: number }[] = [];
      for (let i = 0; i < pts.length; i += 2) {
        vertices.push({
          x: obstacle.x + pts[i],
          y: obstacle.y + pts[i + 1],
        });
      }
      return vertices;
    }
    default:
      return [];
  }
}
