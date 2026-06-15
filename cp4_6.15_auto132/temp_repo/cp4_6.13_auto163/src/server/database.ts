import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { ScoreEntry, TowerConfig, TowerType } from '../shared/types';
import { TOWER_CONFIGS } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'game.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'anonymous',
      score INTEGER NOT NULL,
      kills INTEGER NOT NULL,
      wave INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tower_configs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL,
      damage INTEGER,
      slow_factor REAL,
      slow_duration INTEGER,
      chain_count INTEGER,
      range REAL NOT NULL,
      attack_interval INTEGER NOT NULL,
      build_cost INTEGER NOT NULL,
      upgrade_cost INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_user_scores_user_score ON user_scores (user_id, score DESC);
    CREATE INDEX IF NOT EXISTS idx_user_scores_score ON user_scores (score DESC);
    CREATE INDEX IF NOT EXISTS idx_user_scores_created ON user_scores (created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tower_configs_type_level ON tower_configs (type, level);
  `);

  const count = (db.prepare('SELECT COUNT(*) as cnt FROM tower_configs').get() as { cnt: number }).cnt;
  if (count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO tower_configs (id, type, level, damage, slow_factor, slow_duration, chain_count, range, attack_interval, build_cost, upgrade_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const types: TowerType[] = ['fireball', 'frost', 'lightning'];
    for (const type of types) {
      for (let level = 1 as 1 | 2 | 3; level <= 3; level = (level + 1) as 1 | 2 | 3) {
        const cfg: TowerConfig = TOWER_CONFIGS[type][level as 1 | 2 | 3];
        insertStmt.run(
          uuidv4(),
          `${cfg.type}_${cfg.level}`,
          cfg.level,
          cfg.damage ?? null,
          cfg.slowFactor ?? null,
          cfg.slowDuration ?? null,
          cfg.chainCount ?? null,
          cfg.range,
          cfg.attackInterval,
          cfg.buildCost,
          cfg.upgradeCost
        );
      }
    }
  }
}

export function saveScore(score: number, kills: number, wave: number, userId: string = 'anonymous'): ScoreEntry {
  const id = uuidv4();
  const createdAt = Date.now();
  db.prepare('INSERT INTO user_scores (id, user_id, score, kills, wave, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, score, kills, wave, createdAt);
  return { id, score, kills, wave, createdAt };
}

export function getTopScores(limit: number = 10): ScoreEntry[] {
  const rows = db.prepare(`
    SELECT id, score, kills, wave, created_at as createdAt
    FROM user_scores
    ORDER BY score DESC
    LIMIT ?
  `).all(limit) as ScoreEntry[];
  return rows;
}

export function getUserTopScores(userId: string, limit: number = 10): ScoreEntry[] {
  const rows = db.prepare(`
    SELECT id, score, kills, wave, created_at as createdAt
    FROM user_scores
    WHERE user_id = ?
    ORDER BY score DESC
    LIMIT ?
  `).all(userId, limit) as ScoreEntry[];
  return rows;
}

export { db };
