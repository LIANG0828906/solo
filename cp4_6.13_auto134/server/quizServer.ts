import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoomByCode,
  addQuestion,
  activateQuestion,
  endQuestion,
  deactivateAllRoomQuestions,
  getActiveQuestion,
  getRoomQuestions,
  submitAnswer,
  getQuestionStats,
  hasStudentAnswered,
  getStudentAnswer,
  getQuestionById,
  Question,
} from './database';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

type ClientRole = 'teacher' | 'student';

interface RoomClient {
  ws: WebSocket;
  nickname: string;
  role: ClientRole;
}

interface Room {
  id: string;
  code: string;
  clients: Map<string, RoomClient>;
  teacherNickname: string;
  nextQuestionNumber: number;
}

const rooms = new Map<string, Room>();
const clientToRoom = new Map<WebSocket, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sendToClient(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const { ws } of room.clients.values()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

function questionToPublic(q: Question, forTeacher: boolean) {
  const base = {
    id: q.id,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    options: [
      { label: 'A', text: q.optionA },
      { label: 'B', text: q.optionB },
      { label: 'C', text: q.optionC },
      { label: 'D', text: q.optionD },
    ],
    isActive: q.isActive === 1,
    isEnded: q.isEnded === 1,
  };
  if (forTeacher || q.isEnded === 1) {
    return { ...base, correctOption: q.correctOption };
  }
  return base;
}

function handleCreateRoom(ws: WebSocket, nickname: string) {
  let code: string;
  do {
    code = generateRoomCode();
  } while (getRoomByCode(code));

  const roomId = uuidv4();
  createRoom(roomId, code, nickname);

  const room: Room = {
    id: roomId,
    code,
    clients: new Map(),
    teacherNickname: nickname,
    nextQuestionNumber: 1,
  };

  const clientId = uuidv4();
  room.clients.set(clientId, { ws, nickname, role: 'teacher' });
  rooms.set(roomId, room);
  clientToRoom.set(ws, roomId);

  const existingQuestions = getRoomQuestions(roomId);
  const questionSummaries = existingQuestions.map(q => {
    const stats = getQuestionStats(q.id);
    return {
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      correctRate: stats.correctRate,
      isActive: q.isActive === 1,
      isEnded: q.isEnded === 1,
    };
  });

  sendToClient(ws, {
    type: 'room_created',
    roomId,
    code,
    questionSummaries,
  });
}

function handleJoinRoom(ws: WebSocket, nickname: string, code: string) {
  const dbRoom = getRoomByCode(code);
  if (!dbRoom) {
    sendToClient(ws, { type: 'error', message: '房间不存在' });
    return;
  }

  let room = rooms.get(dbRoom.id);
  if (!room) {
    room = {
      id: dbRoom.id,
      code: dbRoom.code,
      clients: new Map(),
      teacherNickname: dbRoom.teacher_nickname,
      nextQuestionNumber: 1,
    };
    rooms.set(dbRoom.id, room);
  }

  const clientId = uuidv4();
  room.clients.set(clientId, { ws, nickname, role: 'student' });
  clientToRoom.set(ws, room.id);

  const activeQuestion = getActiveQuestion(room.id);
  let currentQuestion = null;
  let studentAnswer = null;

  if (activeQuestion) {
    currentQuestion = questionToPublic(activeQuestion, false);
    if (hasStudentAnswered(activeQuestion.id, nickname)) {
      const ans = getStudentAnswer(activeQuestion.id, nickname);
      studentAnswer = ans ? { selectedOption: ans.selectedOption, isCorrect: ans.isCorrect === 1 } : null;
    }
  }

  sendToClient(ws, {
    type: 'room_joined',
    roomId: room.id,
    code: room.code,
    teacherNickname: room.teacherNickname,
    currentQuestion,
    studentAnswer,
  });

  broadcastToRoom(room.id, {
    type: 'student_joined',
    studentCount: Array.from(room.clients.values()).filter(c => c.role === 'student').length,
  });
}

function handleAddQuestion(ws: WebSocket, payload: any) {
  const roomId = clientToRoom.get(ws);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const teacherClient = Array.from(room.clients.values()).find(c => c.ws === ws);
  if (!teacherClient || teacherClient.role !== 'teacher') {
    sendToClient(ws, { type: 'error', message: '无权限' });
    return;
  }

  const { questionText, optionA, optionB, optionC, optionD, correctOption } = payload;
  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
    sendToClient(ws, { type: 'error', message: '请完整填写题目信息' });
    return;
  }

  const questionNumber = room.nextQuestionNumber;
  const questionId = addQuestion(roomId, questionNumber, questionText, optionA, optionB, optionC, optionD, correctOption);
  room.nextQuestionNumber = questionNumber + 1;

  const stats = getQuestionStats(questionId);
  const summary = {
    id: questionId,
    questionNumber,
    questionText,
    correctRate: stats.correctRate,
    isActive: false,
    isEnded: false,
  };

  sendToClient(ws, {
    type: 'question_added',
    summary,
  });

  broadcastToRoom(roomId, {
    type: 'question_list_updated',
    summaries: getQuestionSummariesForRoom(roomId),
  }, ws);
}

function getQuestionSummariesForRoom(roomId: string) {
  const questions = getRoomQuestions(roomId);
  return questions.map(q => {
    const stats = getQuestionStats(q.id);
    return {
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      correctRate: stats.correctRate,
      isActive: q.isActive === 1,
      isEnded: q.isEnded === 1,
    };
  });
}

function handlePublishQuestion(ws: WebSocket, questionId: number) {
  const roomId = clientToRoom.get(ws);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const teacherClient = Array.from(room.clients.values()).find(c => c.ws === ws);
  if (!teacherClient || teacherClient.role !== 'teacher') {
    sendToClient(ws, { type: 'error', message: '无权限' });
    return;
  }

  const question = getQuestionById(questionId);
  if (!question) {
    sendToClient(ws, { type: 'error', message: '题目不存在' });
    return;
  }

  deactivateAllRoomQuestions(roomId);
  activateQuestion(questionId);

  const teacherQuestion = questionToPublic(question, true);
  sendToClient(ws, {
    type: 'question_published',
    question: teacherQuestion,
    stats: getQuestionStats(questionId),
  });

  for (const { ws: clientWs, role } of room.clients.values()) {
    if (clientWs === ws) continue;
    if (role === 'teacher') {
      sendToClient(clientWs, {
        type: 'question_published',
        question: teacherQuestion,
        stats: getQuestionStats(questionId),
      });
    } else {
      sendToClient(clientWs, {
        type: 'question_published',
        question: questionToPublic(question, false),
      });
    }
  }

  broadcastToRoom(roomId, {
    type: 'question_list_updated',
    summaries: getQuestionSummariesForRoom(roomId),
  });
}

function handleSubmitAnswer(ws: WebSocket, payload: any) {
  const roomId = clientToRoom.get(ws);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const studentClient = Array.from(room.clients.values()).find(c => c.ws === ws);
  if (!studentClient || studentClient.role !== 'student') {
    sendToClient(ws, { type: 'error', message: '无权限' });
    return;
  }

  const { questionId, selectedOption } = payload;
  const question = getQuestionById(questionId);
  if (!question || question.isActive !== 1) {
    sendToClient(ws, { type: 'error', message: '当前题目不可作答' });
    return;
  }

  const result = submitAnswer(roomId, questionId, studentClient.nickname, selectedOption, question.correctOption);
  if (result.isDuplicate) {
    sendToClient(ws, { type: 'error', message: '您已提交过答案' });
    return;
  }

  const isCorrect = selectedOption === question.correctOption;
  sendToClient(ws, {
    type: 'answer_submitted',
    selectedOption,
    submitted: true,
  });

  const stats = getQuestionStats(questionId);
  for (const { ws: clientWs, role } of room.clients.values()) {
    if (role === 'teacher') {
      sendToClient(clientWs, {
        type: 'stats_updated',
        questionId,
        stats,
      });
    }
  }
}

function handleEndQuestion(ws: WebSocket, questionId: number) {
  const roomId = clientToRoom.get(ws);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const teacherClient = Array.from(room.clients.values()).find(c => c.ws === ws);
  if (!teacherClient || teacherClient.role !== 'teacher') {
    sendToClient(ws, { type: 'error', message: '无权限' });
    return;
  }

  endQuestion(questionId);
  const question = getQuestionById(questionId);
  if (!question) return;

  const stats = getQuestionStats(questionId);

  for (const { ws: clientWs, role, nickname } of room.clients.values()) {
    if (role === 'teacher') {
      sendToClient(clientWs, {
        type: 'question_ended',
        questionId,
        stats,
      });
    } else {
      const ans = getStudentAnswer(questionId, nickname);
      const studentResult = ans ? {
        selectedOption: ans.selectedOption,
        isCorrect: ans.isCorrect === 1,
        correctOption: question.correctOption,
      } : {
        selectedOption: null,
        isCorrect: false,
        correctOption: question.correctOption,
      };
      sendToClient(clientWs, {
        type: 'question_ended',
        questionId,
        correctRate: stats.correctRate,
        studentResult,
      });
    }
  }

  broadcastToRoom(roomId, {
    type: 'question_list_updated',
    summaries: getQuestionSummariesForRoom(roomId),
  });
}

function handleViewQuestionStats(ws: WebSocket, questionId: number) {
  const roomId = clientToRoom.get(ws);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const teacherClient = Array.from(room.clients.values()).find(c => c.ws === ws);
  if (!teacherClient || teacherClient.role !== 'teacher') {
    sendToClient(ws, { type: 'error', message: '无权限' });
    return;
  }

  const question = getQuestionById(questionId);
  const stats = getQuestionStats(questionId);
  if (!question) return;

  sendToClient(ws, {
    type: 'question_stats_view',
    question: questionToPublic(question, true),
    stats,
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case 'create_room':
          handleCreateRoom(ws, msg.nickname);
          break;
        case 'join_room':
          handleJoinRoom(ws, msg.nickname, msg.code);
          break;
        case 'add_question':
          handleAddQuestion(ws, msg.payload);
          break;
        case 'publish_question':
          handlePublishQuestion(ws, msg.questionId);
          break;
        case 'submit_answer':
          handleSubmitAnswer(ws, msg.payload);
          break;
        case 'end_question':
          handleEndQuestion(ws, msg.questionId);
          break;
        case 'view_question_stats':
          handleViewQuestionStats(ws, msg.questionId);
          break;
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  ws.on('close', () => {
    const roomId = clientToRoom.get(ws);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    let clientIdToDelete: string | null = null;
    for (const [cid, client] of room.clients.entries()) {
      if (client.ws === ws) {
        clientIdToDelete = cid;
        break;
      }
    }
    if (clientIdToDelete) {
      room.clients.delete(clientIdToDelete);
    }
    clientToRoom.delete(ws);

    const studentCount = Array.from(room.clients.values()).filter(c => c.role === 'student').length;
    broadcastToRoom(roomId, {
      type: 'student_joined',
      studentCount,
    });

    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`LiveQuiz server running on port ${PORT}`);
});
