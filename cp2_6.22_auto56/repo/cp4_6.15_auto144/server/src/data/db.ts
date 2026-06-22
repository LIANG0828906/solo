import fs from 'fs';
import path from 'path';
import { FoodJournal } from '../types';

const dataDir = path.join(__dirname, '../../data');
const dataFile = path.join(dataDir, 'journals.json');

function ensureDataFile(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
  }
}

export function readJournals(): FoodJournal[] {
  ensureDataFile();
  const rawData = fs.readFileSync(dataFile, 'utf-8');
  return JSON.parse(rawData);
}

export function writeJournals(journals: FoodJournal[]): void {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(journals, null, 2));
}
