import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Database, HeritageItem, User } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

const defaultData: Database = {
  heritage: [
    {
      id: '1',
      name: '蔚县剪纸',
      region: '华北',
      category: '纸艺',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=600',
      ],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      story: '<p>蔚县剪纸是河北省张家口市蔚县的传统民间艺术，距今已有200多年的历史。</p><p>它以刻代剪，刀工精细，色彩艳丽，