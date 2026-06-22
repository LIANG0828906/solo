import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { setupWebSocket, type CalendarEvent } from './websocket.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const events = new Map<string, CalendarEvent>();

const initialEvents: CalendarEvent[] = [
  {
    id: uuidv4(),
    title: '团队周会',
    description: '讨论本周工作进度和下周计划',
    category: 'meeting',
    start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    assignee: 'Alice'
  },
  {
    id: uuidv4(),
    title: '项目截止',
    description: 'Q2项目交付截止日期',
    category: 'deadline',
    start: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    assignee: 'Bob'
  },
  {
    id: uuidv4(),
    title: '代码审查',
    description: '审查新功能模块代码',
    category: 'task',
    start: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
    assignee: 'Charlie'
  },
  {
    id: uuidv4(),
    title: '产品演示',
    description: '向客户演示新功能',
    category: 'meeting',
    start: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),