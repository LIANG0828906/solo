import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { diffLines } from 'diff';
import { v4 as uuidv4 } from 'uuid';
import {
  DiffSegment,
  Comment,
  ReviewTask,
  DiffResultPayload,
  StatusUpdatePayload,
  CommentPayload,
  SaveTaskPayload,
  LoadTaskPayload,
  TaskLoadedPayload,
  UserEditingPayload
} from '../src/types';

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const tasks = new Map<string, ReviewTask>();
const segmentStatuses = new Map<string, Map<string, DiffSegment>>();
const segmentComments = new Map<string, Map<string, Comment[]>>();
const taskSegments = new Map<string, Map<string, DiffSegment>>();
const taskComments = new Map<string, Map<string, Comment[]>>();

interface ConnectedUser {
  id: string;
  nickname: string;
  avatarColor: string;
}

const connectedUsers = new Map<string, ConnectedUser>();

const generateAvatarColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#FF69B4', '#32CD32', '#FF7F50', '#6495ED'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const randomNicknames = [
  '翻译小熊', '校对达人', '字斟句酌', '文字工匠', '语言专家',
  '逐句审核', '语料猎人', '润色大师', '术语卫士', '风格检查员'
];

const calculateDiff = (originalText: string, revisedText: string): DiffSegment[] => {
  const changes = diffLines(originalText, revisedText, {
    ignoreWhitespace: false,
    newlineIsToken: false
  });

  const segments: DiffSegment[] = [];
  let originalLine = 1;
  let revisedLine = 1;
  let pendingRemoved: { text: string; startLine: number; endLine: number } | null = null;

  changes.forEach((change, index) => {
    const lineCount = change.value === '' ? 0 : change.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || change.value.endsWith('\n') ? true : arr[i] !== '').length || (change.value ? 1 : 0);
    const actualLines = change.value ? change.value.split('\n').length - (change.value.endsWith('\n') ? 1 : 0) : 0;

    if (change.removed) {
      const startLine = originalLine;
      const endLine = originalLine + actualLines - 1;
      pendingRemoved = { text: change.value, startLine, endLine };
      originalLine += actualLines;
    } else if (change.added) {
      const startLine = revisedLine;
      const endLine = revisedLine + actualLines - 1;

      if (pendingRemoved) {
        segments.push({
          id: uuidv4(),
          type: 'modified',
          originalLines: { start: pendingRemoved.startLine, end: pendingRemoved.endLine },
          revisedLines: { start: startLine, end: endLine },
          originalText: pendingRemoved.text,
          revisedText: change.value,
          status: null
        });
        pendingRemoved = null;
      } else {
        segments.push({
          id: uuidv4(),
          type: 'added',
          originalLines: { start: 0, end: 0 },
          revisedLines: { start: startLine, end: endLine },
          originalText: '',
          revisedText: change.value,
          status: null
        });
      }
      revisedLine += actualLines;
    } else {
      if (pendingRemoved) {
        segments.push({
          id: uuidv4(),
          type: 'removed',
          originalLines: { start: pendingRemoved.startLine, end: pendingRemoved.endLine },
          revisedLines: { start: revisedLine, end: revisedLine - 1 },
          originalText: pendingRemoved.text,
          revisedText: '',
          status: null
        });
        pendingRemoved = null;
      }

      const origStart = originalLine;
      const origEnd = originalLine + actualLines - 1;
      const revStart = revisedLine;
      const revEnd = revisedLine + actualLines - 1;

      const chunkSize = 5;
      for (let i = 0; i < actualLines; i += chunkSize) {
        const chunkLines = Math.min(chunkSize, actualLines - i);
        const origChunkStart = origStart + i;
        const origChunkEnd = Math.min(origStart + i + chunkLines - 1, origEnd);
        const revChunkStart = revStart + i;
        const revChunkEnd = Math.min(revStart + i + chunkLines - 1, revEnd);
        const lines = change.value.split('\n');
        const chunkText = lines.slice(i, i + chunkLines).join('\n') + (i + chunkLines < lines.length ? '\n' : (change.value.endsWith('\n') ? '' : ''));

        if (i === 0 && change.value.startsWith('\n')) {
          continue;
        }

        if (chunkText.trim() || i < actualLines - 1) {
          segments.push({
            id: uuidv4(),
            type: 'unchanged',
            originalLines: { start: origChunkStart, end: origChunkEnd },
            revisedLines: { start: revChunkStart, end: revChunkEnd },
            originalText: chunkText,
            revisedText: chunkText,
            status: null
          });
        }
      }

      originalLine += actualLines;
      revisedLine += actualLines;
    }
  });

  if (pendingRemoved) {
    segments.push({
      id: uuidv4(),
      type: 'removed',
      originalLines: { start: pendingRemoved.startLine, end: pendingRemoved.endLine },
      revisedLines: { start: revisedLine, end: revisedLine - 1 },
      originalText: pendingRemoved.text,
      revisedText: '',
      status: null
    });
  }

  return segments;
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT });
});

io.on('connection', (socket: Socket) => {
  const userId = socket.id;
  const nickname = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
  const avatarColor = generateAvatarColor();

  connectedUsers.set(socket.id, { id: userId, nickname, avatarColor });

  console.log(`[Socket] User connected: ${userId} (${nickname})`);

  socket.emit('user_info', { userId, nickname, avatarColor });

  socket.on('calculate_diff', (data: { originalText: string; revisedText: string }) => {
    try {
      const segments = calculateDiff(data.originalText, data.revisedText);
      const payload: DiffResultPayload = {
        segments,
        originalText: data.originalText,
        revisedText: data.revisedText
      };
      socket.emit('diff_result', payload);
    } catch (err) {
      socket.emit('error', { message: '差异计算失败' });
    }
  });

  socket.on('update_status', (data: StatusUpdatePayload & { taskId?: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    if (data.taskId) {
      const segs = taskSegments.get(data.taskId);
      if (segs) {
        const seg = segs.get(data.segmentId);
        if (seg) {
          seg.status = data.status;
        }
      }
    }

    socket.broadcast.emit('status_updated', {
      ...data,
      userName: user.nickname,
      userId: user.id
    });
    socket.emit('status_updated', {
      ...data,
      userName: user.nickname,
      userId: user.id
    });

    socket.broadcast.emit('user_editing', {
      segmentId: data.segmentId,
      userName: user.nickname,
      action: data.status
    } as UserEditingPayload);
  });

  socket.on('add_comment', (data: { comment: Omit<Comment, 'id' | 'userId' | 'userNickname' | 'avatarColor' | 'timestamp'>; taskId?: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const comment: Comment = {
      id: uuidv4(),
      segmentId: data.comment.segmentId,
      userId: user.id,
      userNickname: user.nickname,
      avatarColor: user.avatarColor,
      content: data.comment.content,
      replyToNickname: data.comment.replyToNickname,
      timestamp: Date.now()
    };

    if (data.taskId) {
      const comments = taskComments.get(data.taskId);
      if (comments) {
        if (!comments.has(comment.segmentId)) {
          comments.set(comment.segmentId, []);
        }
        comments.get(comment.segmentId)!.push(comment);
      }
    }

    const payload: CommentPayload = { comment };
    socket.broadcast.emit('comment_added', payload);
    socket.emit('comment_added', payload);
  });

  socket.on('user_editing_event', (data: UserEditingPayload) => {
    const user = connectedUsers.get(socket.id);
    socket.broadcast.emit('user_editing', {
      ...data,
      userName: user?.nickname || data.userName
    });
  });

  socket.on('save_task', (data: SaveTaskPayload) => {
    try {
      const segMap = new Map<string, DiffSegment>();
      data.segments.forEach(s => segMap.set(s.id, s));
      taskSegments.set(data.taskId, segMap);

      const commentMap = new Map<string, Comment[]>();
      const groupedComments = new Map<string, Comment[]>();
      data.comments.forEach(c => {
        if (!groupedComments.has(c.segmentId)) {
          groupedComments.set(c.segmentId, []);
        }
        groupedComments.get(c.segmentId)!.push(c);
      });
      groupedComments.forEach((comments, segId) => commentMap.set(segId, comments));
      taskComments.set(data.taskId, commentMap);

      const task: ReviewTask = {
        id: data.taskId,
        originalText: data.originalText,
        revisedText: data.revisedText,
        segments: data.segments,
        comments: data.comments,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      tasks.set(data.taskId, task);

      socket.emit('task_saved', { taskId: data.taskId });
    } catch (err) {
      socket.emit('error', { message: '保存任务失败' });
    }
  });

  socket.on('load_task', (data: LoadTaskPayload) => {
    const task = tasks.get(data.taskId);
    if (task) {
      const payload: TaskLoadedPayload = { task };
      socket.emit('task_loaded', payload);
    } else {
      socket.emit('task_not_found', { taskId: data.taskId });
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log(`[Socket] User disconnected: ${userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`[Server] DiffReview server running on port ${PORT}`);
  console.log(`[Server] WebSocket ready on ws://localhost:${PORT}`);
});
