import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { CityParams } from '../modules/BuildingGenerator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'configs.json');

export interface CityConfig {
  id: string;
  name: string;
  params: CityParams;
  createdAt: string;
  updatedAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readConfigs(): CityConfig[] {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeConfigs(configs: CityConfig[]) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
}

export function getAllConfigs(): CityConfig[] {
  return readConfigs();
}

export function getConfigById(id: string): CityConfig | undefined {
  const configs = readConfigs();
  return configs.find((c) => c.id === id);
}

export function createConfig(name: string, params: CityParams): CityConfig {
  const configs = readConfigs();
  const now = new Date().toISOString();
  const newConfig: CityConfig = {
    id: uuidv4(),
    name,
    params,
    createdAt: now,
    updatedAt: now,
  };
  configs.push(newConfig);
  writeConfigs(configs);
  return newConfig;
}

export function updateConfig(id: string, name: string, params: CityParams): CityConfig | undefined {
  const configs = readConfigs();
  const index = configs.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  configs[index] = {
    ...configs[index],
    name,
    params,
    updatedAt: new Date().toISOString(),
  };
  writeConfigs(configs);
  return configs[index];
}

export function deleteConfig(id: string): boolean {
  const configs = readConfigs();
  const initialLength = configs.length;
  const filtered = configs.filter((c) => c.id !== id);
  if (filtered.length === initialLength) return false;
  writeConfigs(filtered);
  return true;
}
