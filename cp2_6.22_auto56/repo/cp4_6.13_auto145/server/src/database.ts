import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Rule, GradingResult, HistoryRecord, ScoreResult } from './types';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '..', 'autolab.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    pattern TEXT NOT NULL,
    weight INTEGER NOT NULL,
    suggestion TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS grading_records (
    id TEXT PRIMARY KEY,
    reportName TEXT NOT NULL,
    totalScore INTEGER NOT NULL,
    maxScore INTEGER NOT NULL,
    resultsJson TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

const rulesPath = path.join(__dirname, 'rules.json');
const ruleCount = db.prepare('SELECT COUNT(*) as count FROM rules').get() as { count: number };
if (ruleCount.count === 0 && fs.existsSync(rulesPath)) {
  const defaultRules: Rule[] = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
  const insertStmt = db.prepare(
    'INSERT INTO rules (id, name, type, pattern, weight, suggestion) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const transaction = db.transaction((rules: Rule[]) => {
    for (const rule of rules) {
      insertStmt.run(rule.id, rule.name, rule.type, rule.pattern, rule.weight, rule.suggestion);
    }
  });
  transaction(defaultRules);
}

export function getRules(): Rule[] {
  const rows = db.prepare('SELECT * FROM rules ORDER BY id').all() as Array<{
    id: string;
    name: string;
    type: string;
    pattern: string;
    weight: number;
    suggestion: string;
  }>;
  return rows.map(row => ({
    ...row,
    type: row.type as 'keyword' | 'format' | 'formula'
  }));
}

export function addRule(rule: Omit<Rule, 'id'>): Rule {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO rules (id, name, type, pattern, weight, suggestion) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, rule.name, rule.type, rule.pattern, rule.weight, rule.suggestion);
  return { ...rule, id };
}

export function updateRule(id: string, rule: Partial<Omit<Rule, 'id'>>): Rule | null {
  const existing = db.prepare('SELECT * FROM rules WHERE id = ?').get(id) as Rule | undefined;
  if (!existing) return null;
  
  const updated = { ...existing, ...rule };
  db.prepare(
    'UPDATE rules SET name = ?, type = ?, pattern = ?, weight = ?, suggestion = ? WHERE id = ?'
  ).run(updated.name, updated.type, updated.pattern, updated.weight, updated.suggestion, id);
  return updated;
}

export function deleteRule(id: string): boolean {
  const result = db.prepare('DELETE FROM rules WHERE id = ?').run(id);
  return result.changes > 0;
}

export function saveGradingResult(
  reportName: string,
  totalScore: number,
  maxScore: number,
  results: ScoreResult[]
): GradingResult {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const resultsJson = JSON.stringify(results);
  
  db.prepare(
    'INSERT INTO grading_records (id, reportName, totalScore, maxScore, resultsJson, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, reportName, totalScore, maxScore, resultsJson, createdAt);
  
  return { id, reportName, totalScore, maxScore, results, createdAt };
}

export function getHistory(): HistoryRecord[] {
  const rows = db.prepare(
    'SELECT id, reportName, totalScore, maxScore, createdAt FROM grading_records ORDER BY createdAt DESC LIMIT 10'
  ).all() as HistoryRecord[];
  return rows;
}

export function getGradingById(id: string): GradingResult | null {
  const row = db.prepare('SELECT * FROM grading_records WHERE id = ?').get(id) as 
    | { id: string; reportName: string; totalScore: number; maxScore: number; resultsJson: string; createdAt: string }
    | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    reportName: row.reportName,
    totalScore: row.totalScore,
    maxScore: row.maxScore,
    results: JSON.parse(row.resultsJson) as ScoreResult[],
    createdAt: row.createdAt
  };
}
