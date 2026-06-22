import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const TOPICS = [
  '变量声明',
  '类型系统',
  '函数与闭包',
  '异步编程',
  '模块化开发',
  '面向对象编程',
  '错误处理',
  '泛型编程',
  '设计模式',
  '性能优化',
];

interface TopicVotes {
  understood: number;
  confused: number;
  lost: number;
}

interface Question {
  id: string;
  text: string;
  studentId: string;
  studentLabel: string;
  topicIndex: number;
  timestamp: number;
  lastFeedbackType: 'understood' | 'confused' | 'lost' | null;
}

interface TopicData {
  votes: TopicVotes;
  questions: Question[];
  studentVotes: Record<string, 'understood' | 'confused' | 'lost' | null>;
}

function createEmptyTopicData(): TopicData {
  return {
    votes: { understood: 0, confused: 0, lost: 0 },
    questions: [],
    studentVotes: {},
  };
}

const topicDataMap: TopicData[] = TOPICS.map(() => createEmptyTopicData());
let currentTopicIndex = 0;

const studentLabels: Record<string, string> = {};
let studentCounter = 0;

const studentLastFeedback: Record<string, 'understood' | 'confused' | 'lost' | null> = {};

function getStudentLabel(id: string): string {
  if (!studentLabels[id]) {
    studentCounter++;
    studentLabels[id] = `参训者#${studentCounter}`;
  }
  return studentLabels[id];
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('init', {
    topics: TOPICS,
    currentTopicIndex,
    topicDataMap,
  });

  socket.on('switch-topic', (topicIndex: number) => {
    if (topicIndex >= 0 && topicIndex < TOPICS.length) {
      currentTopicIndex = topicIndex;
      io.emit('topic-switched', topicIndex);
    }
  });

  socket.on('submit-feedback', (data: { type: 'understood' | 'confused' | 'lost'; studentId: string; topicIndex: number }) => {
    const td = topicDataMap[data.topicIndex];
    if (!td) return;

    const prev = td.studentVotes[data.studentId] || null;

    if (prev === data.type) {
      td.votes[data.type]--;
      td.studentVotes[data.studentId] = null;
      studentLastFeedback[data.studentId] = null;
    } else {
      if (prev) {
        td.votes[prev]--;
      }
      td.votes[data.type]++;
      td.studentVotes[data.studentId] = data.type;
      studentLastFeedback[data.studentId] = data.type;
    }

    io.emit('feedback-updated', {
      topicIndex: data.topicIndex,
      votes: td.votes,
      studentVote: { studentId: data.studentId, type: td.studentVotes[data.studentId] },
    });
  });

  socket.on('submit-question', (data: { text: string; studentId: string; topicIndex: number }) => {
    const td = topicDataMap[data.topicIndex];
    if (!td) return;

    const label = getStudentLabel(data.studentId);
    const question: Question = {
      id: uuidv4(),
      text: data.text,
      studentId: data.studentId,
      studentLabel: label,
      topicIndex: data.topicIndex,
      timestamp: Date.now(),
      lastFeedbackType: studentLastFeedback[data.studentId] || null,
    };

    td.questions.unshift(question);
    io.emit('question-added', question);
  });

  socket.on('request-export', () => {
    const exportData = TOPICS.map((name, idx) => ({
      name,
      index: idx,
      votes: topicDataMap[idx].votes,
      questions: topicDataMap[idx].questions.map((q) => ({
        text: q.text,
        studentLabel: q.studentLabel,
        timestamp: q.timestamp,
        lastFeedbackType: q.lastFeedbackType,
      })),
    }));
    socket.emit('export-data', exportData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
