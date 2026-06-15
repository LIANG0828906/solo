import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { CommitData } from './gitParser';

export interface RunRecord {
  id: string;
  repoPath: string;
  commits: CommitData[];
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  runs: RunRecord[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Low<DatabaseSchema> | null = null;

async function getDb(): Promise<Low<DatabaseSchema>> {
  if (!db) {
    const file = join(__dirname, '..', 'db.json');
    const adapter = new JSONFile<DatabaseSchema>(file);
    db = new Low(adapter, { runs: [] });
    await db.read();
  }
  return db;
}

export async function saveRun(repoPath: string, commits: CommitData[]): Promise<RunRecord> {
  const database = await getDb();
  const existingIndex = database.data.runs.findIndex((r) => r.repoPath === repoPath);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    database.data.runs[existingIndex] = {
      ...database.data.runs[existingIndex],
      commits,
      updatedAt: now,
    };
    await database.write();
    return database.data.runs[existingIndex];
  } else {
    const record: RunRecord = {
      id: uuidv4(),
      repoPath,
      commits,
      createdAt: now,
      updatedAt: now,
    };
    database.data.runs.push(record);
    await database.write();
    return record;
  }
}

export async function getRunByRepo(repoPath: string): Promise<RunRecord | undefined> {
  const database = await getDb();
  return database.data.runs.find((r) => r.repoPath === repoPath);
}

export async function getRunById(id: string): Promise<RunRecord | undefined> {
  const database = await getDb();
  return database.data.runs.find((r) => r.id === id);
}

export async function filterCommitsByDateRange(
  repoPath: string,
  startDate: Date,
  endDate: Date
): Promise<CommitData[]> {
  const run = await getRunByRepo(repoPath);
  if (!run) return [];

  const start = startDate.getTime();
  const end = endDate.getTime();

  return run.commits.filter((commit) => {
    const commitTime = new Date(commit.date).getTime();
    return commitTime >= start && commitTime <= end;
  });
}

export async function getAllRuns(): Promise<RunRecord[]> {
  const database = await getDb();
  return database.data.runs;
}
