import express from 'express';
import cors from 'cors';
import { JSONFile, Low } from 'lowdb';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key';

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploads