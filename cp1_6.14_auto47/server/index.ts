import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { PresetData, ClimateParams } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface DatabaseData {
  presets: PresetData[];
  climates: ClimateParams[];
}

const defaultData: DatabaseData = {
  presets: [
    {
      id: 'cbd-preset-1',
      name: 'CBD商业区',
      terrainHeight: 0,
      cameraPosition: [40, 30, 40],
      buildings: [
        { shape: 'box', position: [-10, 0, -5], height: 35, width: 8, depth: 8 },
        { shape: 'box', position: [0, 0, -8], height: 45, width: 10, depth: 10 },
        { shape: 'box', position: [12, 0, -5], height: 38, width: 7, depth: 7 },
        { shape: 'cylinder', position: [-5, 0, 8], height: 28, width: 6, depth: 6 },
        { shape: 'box', position: [8, 0, 10], height: 32, width: 8, depth: 8 },
        { shape: 'pyramid', position: [-15, 0, 5], height: 25, width: 8, depth: 8 },
        { shape: 'box', position: [5, 0, -15], height: 20, width: 6, depth: 6 },
      ],
    },
    {
      id: 'residential-preset-1',
      name: '住宅区',
      terrainHeight: 0,
      cameraPosition: [35, 25, 35],
      buildings: [
        { shape: 'box', position: [-12, 0, -8], height: 15, width: 10, depth: 8 },
        { shape: 'box', position: [-2, 0, -10], height: 18, width: 12, depth: 8 },
        { shape: 'box', position: [10, 0, -8], height: 16, width: 10, depth: 8 },
        { shape: 'cylinder', position: [-8, 0, 5], height: 20, width: 7, depth: 7 },
        { shape: 'box', position: [5, 0, 8], height: 14, width: 9, depth: 7 },
        { shape: 'box', position: [-15, 0, 10], height: 12, width: 8, depth: 6 },
      ],
    },
    {
      id: 'mixed-preset-1',
      name: '综合商务区',
      terrainHeight: 0,
      cameraPosition: [45, 35, 45],
      buildings: [
        { shape: 'box', position: [0, 0, 0], height: 50, width: 12, depth: 12 },
        { shape: 'box', position: [-15, 0, -10], height: 30, width: 8, depth: 8 },
        { shape: 'cylinder', position: [18, 0, -8], height: 35, width: 9, depth: 9 },
        { shape: 'box', position: [-10, 0, 12], height: 25, width: 7, depth: 7 },
        { shape: 'pyramid', position: [12, 0, 15], height: 22, width: 10, depth: 10 },
        { shape: 'box', position: [-20, 0, 5], height: 18, width: 6, depth: 6 },
        { shape: 'cylinder', position: [20, 0, 5], height: 28, width: 7, depth: 7 },
        { shape: 'box', position: [0, 0, -18], height: 15, width: 8, depth: 8 },
      ],
    },
  ],
  climates: [
    {
      name: '晴天',
      mode: 'sunny',
      ambientIntensity: 0.3,
      directionalIntensity: 1.2,
      lightColor: '#ffffff',
      ambientColor: '#87ceeb',
      sunPosition: [30, 50, 20],
      shadowBlur: 1,
    },
    {
      name: '阴天',
      mode: 'cloudy',
      ambientIntensity: 0.6,
      directionalIntensity: 0.5,
      lightColor: '#c0c0c0',
      ambientColor: '#708090',
      sunPosition: [10, 30, 10],
      shadowBlur: 4,
    },
    {
      name: '黄昏',
      mode: 'dusk',
      ambientIntensity: 0.4,
      directionalIntensity: 0.8,
      lightColor: '#ff8c42',
      ambientColor: '#4a3728',
      sunPosition: [50, 15, 0],
      shadowBlur: 2,
    },
  ],
};

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile<DatabaseData>(file);
const db = new Low<DatabaseData>(adapter, defaultData);

