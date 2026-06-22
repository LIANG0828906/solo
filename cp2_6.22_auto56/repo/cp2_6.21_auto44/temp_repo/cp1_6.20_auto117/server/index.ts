import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractSummaryFromSegment, getSegments, analyzeFullText } from './nlp';
import type { Meeting, MeetingSummary, TranscribeProgressEvent, SummaryUpdateEvent } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'meetings.json');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const readData = (): { meetings: Meeting[] } => {
  if (!fs.existsSync(DATA_FILE)) {
    return { meetings: [] };
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
};

const writeData = (data: { meetings: Meeting[] }) => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const createEmptySummary = (meetingName: string): MeetingSummary => ({
  title: `${meetingName}纪要`,
  topics: [],
  decisions: [],
  todos: [],
  participantEngagement: []
});

app.post('/api/meetings', (req, res) => {
  try {
    const { name, participants, duration } = req.body;
    
    if (!name || !participants || !duration) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：会议名称、参会人员或预计时长'
      });
    }
    
    const meeting: Meeting = {
      id: uuidv4(),
      name,
      participants: Array.isArray(participants) ? participants : participants.split('\n').filter(Boolean),
      duration: Number(duration),
      createdAt: new Date().toISOString(),
      rawText: '',
      summary: createEmptySummary(name),
      transcriptionProgress: 0,
      status: 'pending'
    };
    
    const data = readData();
    data.meetings.unshift(meeting);
    writeData(data);
    
    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('创建会议失败:', error);
    res.status(500).json({
      success: false,
      message: '创建会议失败'
    });
  }
});

app.get('/api/meetings', (req, res) => {
  try {
    const data = readData();
    const meetings = data.meetings.map(m => ({
      id: m.id,
      name: m.name,
      participants: m.participants,
      duration: m.duration,
      createdAt: m.createdAt,
      status: m.status,
      transcriptionProgress: m.transcriptionProgress,
      summaryCount: {
        topics: m.summary.topics.length,
        decisions: m.summary.decisions.length,
        todos: m.summary.todos.length
      }
    }));
    
    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('获取会议列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会议列表失败'
    });
  }
});

app.get('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const meeting = data.meetings.find(m => m.id === id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }
    
    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('获取会议详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会议详情失败'
    });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { summary, rawText } = req.body;
    
    const data = readData();
    const meetingIndex = data.meetings.findIndex(m => m.id === id);
    
    if (meetingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }
    
    if (summary) {
      data.meetings[meetingIndex].summary = summary;
    }
    
    if (rawText !== undefined) {
      data.meetings[meetingIndex].rawText = rawText;
    }
    
    writeData(data);
    
    io.emit('summary_update', {
      type: 'summary_update',
      meetingId: id,
      summary: data.meetings[meetingIndex].summary,
      isIncremental: false
    } as SummaryUpdateEvent);
    
    res.json({
      success: true,
      data: data.meetings[meetingIndex]
    });
  } catch (error) {
    console.error('更新会议失败:', error);
    res.status(500).json({
      success: false,
      message: '更新会议失败'
    });
  }
});

app.post('/api/meetings/:id/transcribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { rawText } = req.body;
    
    if (!rawText) {
      return res.status(400).json({
        success: false,
        message: '缺少录音文本'
      });
    }
    
    const data = readData();
    const meetingIndex = data.meetings.findIndex(m => m.id === id);
    
    if (meetingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }
    
    data.meetings[meetingIndex].rawText = rawText;
    data.meetings[meetingIndex].status = 'processing';
    data.meetings[meetingIndex].transcriptionProgress = 0;
    writeData(data);
    
    res.json({
      success: true,
      message: '开始分析录音文本'
    });
    
    const meeting = data.meetings[meetingIndex];
    const segments = getSegments(rawText);
    const totalSegments = segments.length;
    
    let currentSummary: MeetingSummary = createEmptySummary(meeting.name);
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      currentSummary = extractSummaryFromSegment(
        segment,
        currentSummary,
        meeting.participants,
        meeting.name
      );
      
      const percentage = Math.round(((i + 1) / totalSegments) * 100);
      
      const progressEvent: TranscribeProgressEvent = {
        type: 'transcribe_progress',
        meetingId: id,
        currentSegment: i + 1,
        totalSegments,
        percentage
      };
      
      io.emit('transcribe_progress', progressEvent);
      
      const summaryEvent: SummaryUpdateEvent = {
        type: 'summary_update',
        meetingId: id,
        summary: currentSummary,
        isIncremental: true
      };
      
      io.emit('summary_update', summaryEvent);
      
      const latestData = readData();
      const latestIndex = latestData.meetings.findIndex(m => m.id === id);
      if (latestIndex !== -1) {
        latestData.meetings[latestIndex].transcriptionProgress = percentage;
        latestData.meetings[latestIndex].summary = currentSummary;
        writeData(latestData);
      }
    }
    
    const finalData = readData();
    const finalIndex = finalData.meetings.findIndex(m => m.id === id);
    if (finalIndex !== -1) {
      const fullAnalysis = analyzeFullText(rawText, meeting.participants, meeting.name);
      finalData.meetings[finalIndex].summary = {
        ...currentSummary,
        participantEngagement: fullAnalysis.participantEngagement
      };
      finalData.meetings[finalIndex].status = 'completed';
      finalData.meetings[finalIndex].transcriptionProgress = 100;
      writeData(finalData);
      
      io.emit('summary_update', {
        type: 'summary_update',
        meetingId: id,
        summary: finalData.meetings[finalIndex].summary,
        isIncremental: false
      } as SummaryUpdateEvent);
    }
    
  } catch (error) {
    console.error('分析录音文本失败:', error);
  }
});

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
