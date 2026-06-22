import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import type { Room, Question, Student, Answer, WSMessage, QuestionType } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const rooms = new Map<string, Room>();
const wsClients = new Map<string, WebSocket>();
const clientInfo = new Map<WebSocket, { roomId: string; role: 'teacher' | 'student'; studentId?: string }>();

function generateRoomCode(): string {
  let code = '';
  const chars = '0123456789';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * 10));
  }
  return code;
}

function sendToRoom(roomId: string, message: WSMessage, exclude?: WebSocket) {
  const data = JSON.stringify(message);
  for (const [, ws] of wsClients) {
    const info = clientInfo.get(ws);
    if (info && info.roomId === roomId && ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function roomToJson(room: Room) {
  return {
    id: room.id,
    code: room.code,
    teacherId: room.teacherId,
    createdAt: room.createdAt,
    activeQuestionId: room.activeQuestionId,
    ended: room.ended,
    totalCorrect: room.totalCorrect,
    totalAnswers: room.totalAnswers,
    questions: room.questions,
    students: Array.from(room.students.values()),
  };
}

function updateRanks(room: Room) {
  const students = Array.from(room.students.values()).sort((a, b) => b.score - a.score);
  students.forEach((s, idx) => {
    s.prevRank = s.rank;
    s.rank = idx + 1;
  });
  return students;
}

app.post('/api/rooms', (_req, res) => {
  const code = generateRoomCode();
  const id = uuidv4();
  const room: Room = {
    id,
    code,
    teacherId: uuidv4(),
    createdAt: Date.now(),
    students: new Map(),
    questions: [],
    activeQuestionId: null,
    answers: new Map(),
    ended: false,
    totalCorrect: 0,
    totalAnswers: 0,
  };
  rooms.set(id, room);
  res.json({ room: roomToJson(room) });
});

app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const room = Array.from(rooms.values()).find((r) => r.code === code && !r.ended);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  res.json({ room: roomToJson(room) });
});

app.post('/api/rooms/:code/join', (req, res) => {
  const { code } = req.params;
  const { name } = req.body;
  const room = Array.from(rooms.values()).find((r) => r.code === code && !r.ended);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (!name || !name.trim()) return res.status(400).json({ error: '请输入昵称' });
  const id = uuidv4();
  const student: Student = {
    id,
    name: name.trim(),
    roomId: room.id,
    score: 0,
    rank: room.students.size + 1,
    prevRank: room.students.size + 1,
    connected: true,
  };
  room.students.set(id, student);
  updateRanks(room);
  sendToRoom(room.id, {
    type: 'student_joined',
    payload: {
      students: Array.from(room.students.values()),
      onlineCount: room.students.size,
      student,
    },
  });
  res.json({ room: roomToJson(room), studentId: id });
});

app.post('/api/rooms/:roomId/questions', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  const { type, title, options, correctIndex, duration } = req.body;
  const question: Question = {
    id: uuidv4(),
    type: type as QuestionType,
    title,
    options,
    correctIndex,
    duration,
    createdAt: Date.now(),
    status: 'active',
    buzzerId: null,
    buzzerName: null,
  };
  room.questions.push(question);
  room.activeQuestionId = question.id;
  room.answers.set(question.id, []);
  sendToRoom(room.id, { type: 'question_started', payload: { question } });
  setTimeout(() => {
    if (room.activeQuestionId === question.id && question.status === 'active') {
      endQuestion(room, question.id);
    }
  }, question.duration * 1000 + 500);

  res.json({ question });
});

function endQuestion(room: Room, qId: string) {
  const q = room.questions.find((x) => x.id === qId);
  if (!q || q.status !== 'active') return;
  q.status = 'ended';
  const answers = room.answers.get(qId) || [];
  const optionCounts: Record<number, number> = {};
  q.options.forEach((_o: string, i: number) => (optionCounts[i] = 0));
  answers.forEach((a) => {
    if (a.selectedIndex !== null) {
      optionCounts[a.selectedIndex] = (optionCounts[a.selectedIndex] || 0) + 1;
      if (a.isCorrect) {
        room.totalCorrect++;
      }
      room.totalAnswers++;
    }
  });
  let roundScores: { studentId: string; gain: number }[] = [];
  if (q.type === 'single') {
    roundScores = answers.map((a) => ({ studentId: a.studentId, gain: a.isCorrect ? 10 : 0 }));
    for (const s of room.students.values()) {
      s.score += roundScores.find((g) => g.studentId === s.id)?.gain || 0;
    }
  } else if (q.type === 'buzz' && q.buzzerId) {
    const winner = room.students.get(q.buzzerId);
    if (winner) {
      winner.score += 15;
      roundScores = [{ studentId: winner.id, gain: 15 }];
    }
  }
  updateRanks(room);
  const students = Array.from(room.students.values());
  sendToRoom(room.id, {
    type: 'question_ended',
    payload: {
      questionId: qId,
      question: q,
      optionCounts,
      students,
      roundScores,
    },
  });
  room.activeQuestionId = null;
}

app.post('/api/rooms/:roomId/questions/:qId/end', (req, res) => {
  const { roomId, qId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  endQuestion(room, qId);
  res.json({ ok: true });
});

app.post('/api/rooms/:roomId/end', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  room.ended = true;
  if (room.activeQuestionId) {
    const q = room.questions.find((x) => x.id === room.activeQuestionId);
    if (q && q.status === 'active') endQuestion(room, room.activeQuestionId);
  }
  const avgCorrect = room.totalAnswers > 0 ? Math.round((room.totalCorrect / room.totalAnswers) * 100) : 0;
  sendToRoom(room.id, {
    type: 'activity_ended',
    payload: {
      students: Array.from(room.students.values()),
      avgCorrectRate: avgCorrect,
    },
  });
  res.json({ ok: true, avgCorrectRate: avgCorrect });
});

wss.on('connection', (ws) => {
  const wsId = uuidv4();
  wsClients.set(wsId, ws);

  ws.on('message', (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString());
      const { type, payload } = msg;
      const info = clientInfo.get(ws);

      if (type === 'register') {
        if (payload.role === 'teacher') {
          const room = rooms.get(payload.roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', payload: { error: '房间不存在' } }));
            return;
          }
          clientInfo.set(ws, { roomId: payload.roomId, role: 'teacher' });
          ws.send(JSON.stringify({
            type: 'registered',
            payload: { room: roomToJson(room) },
          }));
        } else if (payload.role === 'student') {
          const room = Array.from(rooms.values()).find((r) => r.code === payload.code && !r.ended);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', payload: { error: '房间不存在' } }));
            return;
          }
          const student = room.students.get(payload.studentId);
          if (!student) {
            ws.send(JSON.stringify({ type: 'error', payload: { error: '学生不存在' } }));
            return;
          }
          student.connected = true;
          clientInfo.set(ws, { roomId: room.id, role: 'student', studentId: student.id });
          ws.send(JSON.stringify({
            type: 'registered',
            payload: {
              room: roomToJson(room),
              student,
            },
          }));
          const activeQ = room.questions.find((q) => q.id === room.activeQuestionId && q.status === 'active');
          if (activeQ) {
            ws.send(JSON.stringify({ type: 'question_started', payload: { question: activeQ } }));
          }
        }
      } else if (type === 'submit_answer' && info?.role === 'student') {
        const room = rooms.get(info.roomId);
        if (!room || !room.activeQuestionId) return;
        const q = room.questions.find((x) => x.id === room.activeQuestionId);
        if (!q || q.status !== 'active') return;
        const answers = room.answers.get(q.id) || [];
        if (answers.find((a) => a.studentId === info.studentId)) return;
        const student = room.students.get(info.studentId!);
        if (!student) return;
        const isCorrect = payload.selectedIndex === q.correctIndex;
        const answer: Answer = {
          questionId: q.id,
          studentId: info.studentId!,
          studentName: student.name,
          selectedIndex: payload.selectedIndex,
          isCorrect,
          timestamp: Date.now(),
        };
        answers.push(answer);
        room.answers.set(q.id, answers);
        const optionCounts: Record<number, number> = {};
        q.options.forEach((_o: string, i: number) => (optionCounts[i] = 0));
        answers.forEach((a) => {
          if (a.selectedIndex !== null) optionCounts[a.selectedIndex] = (optionCounts[a.selectedIndex] || 0) + 1;
        });
        sendToRoom(room.id, {
          type: 'answer_submitted',
          payload: {
            questionId: q.id,
            answer,
            optionCounts,
          },
        });
        ws.send(JSON.stringify({ type: 'answer_ack', payload: { questionId: q.id, isCorrect } }));
      } else if (type === 'buzz' && info?.role === 'student') {
        const room = rooms.get(info.roomId);
        if (!room || !room.activeQuestionId) return;
        const q = room.questions.find((x) => x.id === room.activeQuestionId);
        if (!q || q.type !== 'buzz' || q.status !== 'active' || q.buzzerId) return;
        const student = room.students.get(info.studentId!);
        if (!student) return;
        q.buzzerId = student.id;
        q.buzzerName = student.name;
        sendToRoom(room.id, {
          type: 'buzz_won',
          payload: {
            questionId: q.id,
            studentId: student.id,
            studentName: student.name,
          },
        });
      }
    } catch (e) {
      console.error('WS error', e);
    }
  });

  ws.on('close', () => {
    wsClients.delete(wsId);
    const info = clientInfo.get(ws);
    if (info) {
      const room = rooms.get(info.roomId);
      if (room && info.role === 'student' && info.studentId) {
        const s = room.students.get(info.studentId);
        if (s) {
          s.connected = false;
        }
      }
      clientInfo.delete(ws);
    }
  });
});

const PORT = 5050;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
