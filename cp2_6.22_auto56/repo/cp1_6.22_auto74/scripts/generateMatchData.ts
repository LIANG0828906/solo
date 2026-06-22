import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { MatchData, PlayerPosition, KillEvent, PlayerInfo } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DURATION = 180;
const SAMPLE_INTERVAL = 0.5;

const players: PlayerInfo[] = [
  { id: 'r1', teamId: 'red', name: 'Red-Player1', spawnPoint: { x: -18, y: -18 } },
  { id: 'r2', teamId: 'red', name: 'Red-Player2', spawnPoint: { x: -15, y: -18 } },
  { id: 'r3', teamId: 'red', name: 'Red-Player3', spawnPoint: { x: -18, y: -15 } },
  { id: 'r4', teamId: 'red', name: 'Red-Player4', spawnPoint: { x: -12, y: -18 } },
  { id: 'r5', teamId: 'red', name: 'Red-Player5', spawnPoint: { x: -18, y: -12 } },
  { id: 'b1', teamId: 'blue', name: 'Blue-Player1', spawnPoint: { x: 18, y: 18 } },
  { id: 'b2', teamId: 'blue', name: 'Blue-Player2', spawnPoint: { x: 15, y: 18 } },
  { id: 'b3', teamId: 'blue', name: 'Blue-Player3', spawnPoint: { x: 18, y: 15 } },
  { id: 'b4', teamId: 'blue', name: 'Blue-Player4', spawnPoint: { x: 12, y: 18 } },
  { id: 'b5', teamId: 'blue', name: 'Blue-Player5', spawnPoint: { x: 18, y: 12 } },
];

interface MovementPattern {
  waypoints: { x: number; y: number }[];
  speed: number;
}

const movementPatterns: Record<string, MovementPattern> = {
  r1: { waypoints: [{ x: -18, y: -18 }, { x: -10, y: -10 }, { x: 0, y: -5 }, { x: 5, y: 0 }, { x: 0, y: 5 }, { x: -5, y: 0 }], speed: 0.8 },
  r2: { waypoints: [{ x: -15, y: -18 }, { x: -8, y: -12 }, { x: -3, y: -8 }, { x: 2, y: -3 }, { x: -2, y: 2 }], speed: 0.7 },
  r3: { waypoints: [{ x: -18, y: -15 }, { x: -12, y: -8 }, { x: -5, y: -3 }, { x: 0, y: 0 }, { x: -3, y: 5 }], speed: 0.9 },
  r4: { waypoints: [{ x: -12, y: -18 }, { x: -5, y: -15 }, { x: 0, y: -10 }, { x: 5, y: -5 }, { x: 3, y: 0 }], speed: 0.75 },
  r5: { waypoints: [{ x: -18, y: -12 }, { x: -15, y: -5 }, { x: -10, y: 0 }, { x: -5, y: 5 }, { x: 0, y: 3 }], speed: 0.85 },
  b1: { waypoints: [{ x: 18, y: 18 }, { x: 10, y: 10 }, { x: 0, y: 5 }, { x: -5, y: 0 }, { x: 0, y: -5 }, { x: 5, y: 0 }], speed: 0.8 },
  b2: { waypoints: [{ x: 15, y: 18 }, { x: 8, y: 12 }, { x: 3, y: 8 }, { x: -2, y: 3 }, { x: 2, y: -2 }], speed: 0.7 },
  b3: { waypoints: [{ x: 18, y: 15 }, { x: 12, y: 8 }, { x: 5, y: 3 }, { x: 0, y: 0 }, { x: 3, y: -5 }], speed: 0.9 },
  b4: { waypoints: [{ x: 12, y: 18 }, { x: 5, y: 15 }, { x: 0, y: 10 }, { x: -5, y: 5 }, { x: -3, y: 0 }], speed: 0.75 },
  b5: { waypoints: [{ x: 18, y: 12 }, { x: 15, y: 5 }, { x: 10, y: 0 }, { x: 5, y: -5 }, { x: 0, y: -3 }], speed: 0.85 },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getPositionAtTime(player: PlayerInfo, time: number): { x: number; y: number } {
  const pattern = movementPatterns[player.id];
  if (!pattern) return { x: player.spawnPoint.x, y: player.spawnPoint.y };

  const cycleTime = pattern.waypoints.length * 30 * pattern.speed;
  const t = (time % cycleTime) / cycleTime;
  const segmentIndex = Math.floor(t * pattern.waypoints.length) % pattern.waypoints.length;
  const nextIndex = (segmentIndex + 1) % pattern.waypoints.length;
  const segmentT = (t * pattern.waypoints.length) % 1;

  const start = pattern.waypoints[segmentIndex];
  const end = pattern.waypoints[nextIndex];

  const randomOffsetX = Math.sin(time * 2 + player.id.charCodeAt(1)) * 0.5;
  const randomOffsetY = Math.cos(time * 2 + player.id.charCodeAt(1)) * 0.5;

  return {
    x: lerp(start.x, end.x, segmentT) + randomOffsetX,
    y: lerp(start.y, end.y, segmentT) + randomOffsetY,
  };
}

const killEvents: KillEvent[] = [
  { playerId: 'r1', teamId: 'red', timestamp: 25, x: 2, y: -3, z: 0, eventType: 'kill', victimId: 'b1', victimTeamId: 'blue' },
  { playerId: 'b2', teamId: 'blue', timestamp: 32, x: -1, y: 2, z: 0, eventType: 'kill', victimId: 'r3', victimTeamId: 'red' },
  { playerId: 'r4', teamId: 'red', timestamp: 45, x: 4, y: -1, z: 0, eventType: 'kill', victimId: 'b3', victimTeamId: 'blue' },
  { playerId: 'b4', teamId: 'blue', timestamp: 58, x: -3, y: 4, z: 0, eventType: 'kill', victimId: 'r2', victimTeamId: 'red' },
  { playerId: 'r5', teamId: 'red', timestamp: 72, x: 1, y: 3, z: 0, eventType: 'kill', victimId: 'b5', victimTeamId: 'blue' },
  { playerId: 'b1', teamId: 'blue', timestamp: 85, x: -2, y: -2, z: 0, eventType: 'kill', victimId: 'r1', victimTeamId: 'red' },
  { playerId: 'r2', teamId: 'red', timestamp: 95, x: 3, y: 1, z: 0, eventType: 'kill', victimId: 'b2', victimTeamId: 'blue' },
  { playerId: 'b3', teamId: 'blue', timestamp: 108, x: -4, y: -1, z: 0, eventType: 'kill', victimId: 'r4', victimTeamId: 'red' },
  { playerId: 'r3', teamId: 'red', timestamp: 122, x: 2, y: -4, z: 0, eventType: 'kill', victimId: 'b4', victimTeamId: 'blue' },
  { playerId: 'b5', teamId: 'blue', timestamp: 135, x: -1, y: 2, z: 0, eventType: 'kill', victimId: 'r5', victimTeamId: 'red' },
  { playerId: 'r1', teamId: 'red', timestamp: 148, x: 0, y: 0, z: 0, eventType: 'kill', victimId: 'b1', victimTeamId: 'blue' },
  { playerId: 'b2', teamId: 'blue', timestamp: 155, x: 3, y: 3, z: 0, eventType: 'kill', victimId: 'r2', victimTeamId: 'red' },
  { playerId: 'r4', teamId: 'red', timestamp: 162, x: -3, y: -3, z: 0, eventType: 'kill', victimId: 'b3', victimTeamId: 'blue' },
  { playerId: 'b4', teamId: 'blue', timestamp: 170, x: 1, y: -2, z: 0, eventType: 'kill', victimId: 'r3', victimTeamId: 'red' },
  { playerId: 'r5', teamId: 'red', timestamp: 176, x: -2, y: 1, z: 0, eventType: 'kill', victimId: 'b5', victimTeamId: 'blue' },
];

const deadPlayers: Set<string> = new Set();
const respawnTimes: Map<string, number> = new Map();

function isPlayerAlive(playerId: string, time: number): boolean {
  const respawnTime = respawnTimes.get(playerId);
  if (respawnTime && time < respawnTime) return false;
  return true;
}

const events: (PlayerPosition | KillEvent)[] = [];

for (let time = 0; time <= DURATION; time += SAMPLE_INTERVAL) {
  killEvents.forEach(kill => {
    if (Math.abs(kill.timestamp - time) < 0.01) {
      events.push({ ...kill });
      deadPlayers.add(kill.victimId);
      respawnTimes.set(kill.victimId, time + 0.5);
    }
  });

  players.forEach(player => {
    if (isPlayerAlive(player.id, time)) {
      const pos = getPositionAtTime(player, time);
      events.push({
        playerId: player.id,
        teamId: player.teamId,
        timestamp: time,
        x: Math.max(-20, Math.min(20, pos.x)),
        y: Math.max(-20, Math.min(20, pos.y)),
        z: 0,
        eventType: 'moving' as const,
      });
    }
  });
}

events.sort((a, b) => a.timestamp - b.timestamp);

const matchData: MatchData = {
  matchId: 'csgo-demo-001',
  gameType: 'CS:GO',
  duration: DURATION,
  players,
  events,
};

const outputPath = resolve(__dirname, '../src/data/matchData.json');
writeFileSync(outputPath, JSON.stringify(matchData, null, 2));
console.log(`Generated ${events.length} events for ${DURATION}s match data`);
console.log(`Output: ${outputPath}`);
