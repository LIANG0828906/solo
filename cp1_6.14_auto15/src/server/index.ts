import express from 'express';
import session from 'express-session';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';

import {
  initDb,
  getUserByUsername,
  getUserById,
  createUser,
  getInstruments,
  getInstrumentById,
  createInstrument,
  deleteInstrument,
  updateInstrumentStatus,
  getOrdersByUserId,
  getOrderById,
  createOrder,
  updateOrderStatus,
  sha256,
} from './dataStore.js';
import type {
  User,
  Instrument,
  Order,
  InstrumentCategory,
  OrderStatus,
  SessionUser,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const uploadsDir = path.join(projectRoot, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost: