import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/palettes.json');

function readPalettes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writePalettes(palettes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(palettes, null, 2), 'utf8');
}

export function getAllPalettes() {
  return readPalettes();
}

export function getPaletteById(id) {
  const palettes = readPalettes();
  return palettes.find(p => p.id === id);
}

export function createPalette(paletteData) {
  const palettes = readPalettes();
  const now = new Date().toISOString();
  const newPalette = {
    id: uuidv4(),
    ...paletteData,
    createdAt: now,
    updatedAt: now
  };
  palettes.unshift(newPalette);
  writePalettes(palettes);
  return newPalette;
}

export function updatePalette(id, paletteData) {
  const palettes = readPalettes();
  const index = palettes.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  palettes[index] = {
    ...palettes[index],
    ...paletteData,
    updatedAt: new Date().toISOString()
  };
  writePalettes(palettes);
  return palettes[index];
}

export function deletePalette(id) {
  const palettes = readPalettes();
  const index = palettes.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  palettes.splice(index, 1);
  writePalettes(palettes);
  return true;
}
