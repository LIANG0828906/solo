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
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_EXTENSIONS = ['.txt', '.md'];

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const tasks = new Map<string, ReviewTask>();
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

const validateFile = (fileName: string, content: string): { valid: boolean; error?: string } => {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `不支持的文件格式，仅支持 ${ALLOWED_EXTENSIONS.join('、')}` };
  }
  const size = Buffer.byteLength(content, 'utf8');
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件大小超过限制，最大支持 1MB（当前 ${(size / 1024 / 1024).toFixed(2)}MB）` };
  }
  return { valid: true };
};

const calculateDiff = (originalText: string, revisedText: string): DiffSegment[] => {
  const changes = diffLines(originalText, revisedText, {
    ignoreWhitespace: false,
    newlineIsToken: false
  });

  type PendingRemoved = { text: string; startLine: number; endLine: number };

  const segments: DiffSegment[] = [];
  let originalLine = 1;
  let revisedLine = 1;
  let pendingRemoved: PendingRemoved | null = null;

  for (const change of changes) {
    const actualLines = change.value ? change.value.split('\n').length - (change.value.endsWith('\n') ? 1 : 0) : 0;

    if (change.removed) {
      const startLine = originalLine;
      const endLine = originalLine + actualLines - 1;
      pendingRemoved = { text: change.value, startLine, endLine };
      originalLine += actualLines;
    } else if (change.added) {
      const startLine = revisedLine;
      const endLine = revisedLine + actualLines - 1;

      const prev: PendingRemoved | null = pendingRemoved;
      if (prev) {
        segments.push({
          id: uuidv4(),
          type: 'modified',
          originalLines: { start: prev.startLine, end: prev.endLine },
          revisedLines: { start: startLine, end: endLine },
          originalText: prev.text,
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
      const prev: PendingRemoved | null = pendingRemoved;
      if (prev) {
        segments.push({
          id: uuidv4(),
          type: 'removed',
          originalLines: { start: prev.startLine, end: prev.endLine },
          revisedLines: { start: revisedLine, end: revisedLine - 1 },
          originalText: prev.text,
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
        const chunkText = lines.slice(i, i + chunkLines).join('\n') + (i + chunkLines < lines.length ? '\n' : '');

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
  }

  const lastPending: PendingRemoved | null = pendingRemoved;
  if (lastPending) {
    segments.push({
      id: uuidv4(),
      type: 'removed',
      originalLines: { start: lastPending.startLine, end: lastPending.endLine },
      revisedLines: { start: revisedLine, end: revisedLine - 1 },
      originalText: lastPending.text,
      revisedText: '',
      status: null
    });
  }

  return segments;
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.post('/api/upload', (req, res) => {
  try {
    const { originalFile, originalContent, revisedFile, revisedContent } = req.body;

    if (originalFile && originalContent) {
      const validation = validateFile(originalFile, originalContent);
      if (!validation.valid) {
        return res.status(400).json({ error: `原版文件：${validation.error}` });
      }
    }

    if (revisedFile && revisedContent) {
      const validation = validateFile(revisedFile, revisedContent);
      if (!validation.valid) {
        return res.status(400).json({ error: `修订文件：${validation.error}` });
      }
    }

    const origText = originalContent || '';
    const revText = revisedContent || '';

    if (!origText || !revText) {
      return res.status(400).json({ error: '请提供两份文档内容' });
    }

    const segments = calculateDiff(origText, revText);

    res.json({
      success: true,
      segments,
      originalText: origText,
      revisedText: revText
    });
  } catch (err) {
    res.status(500).json({ error: '上传处理失败' });
  }
});

app.post('/api/save-task', (req, res) => {
  try {
    const data: SaveTaskPayload = req.body;
    if (!data.taskId || !/^[A-Za-z0-9]{6}$/.test(data.taskId)) {
      return res.status(400).json({ error: '任务ID必须是6位数字字母组合' });
    }

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
      createdAt: tasks.get(data.taskId)?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    tasks.set(data.taskId, task);

    res.json({ success: true, taskId: data.taskId, savedAt: task.updatedAt });
  } catch (err) {
    res.status(500).json({ error: '保存任务失败' });
  }
});

app.get('/api/load-task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ error: '任务不存在或已过期' });
    }

    res.json({
      success: true,
      task
    });
  } catch (err) {
    res.status(500).json({ error: '加载任务失败' });
  }
});

io.on('connection', (socket: Socket) => {
  const userId = socket.id;
  const nickname = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
  const avatarColor = generateAvatarColor();

  connectedUsers.set(socket.id, { id: userId, nickname, avatarColor });

  console.log(`[Socket] User connected: ${userId} (${nickname})`);

  socket.emit('user_info', { userId, nickname, avatarColor });

  socket.on('calculate_diff', (data: { originalText: string; revisedText: string; originalFileName?: string; revisedFileName?: string }) => {
    try {
      if (data.originalFileName) {
        const v = validateFile(data.originalFileName, data.originalText);
        if (!v.valid) {
          socket.emit('error', { message: `原版文件：${v.error}` });
          return;
        }
      }
      if (data.revisedFileName) {
        const v = validateFile(data.revisedFileName, data.revisedText);
        if (!v.valid) {
          socket.emit('error', { message: `修订文件：${v.error}` });
          return;
        }
      }

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
      const task = tasks.get(data.taskId);
      if (task) {
        const idx = task.segments.findIndex(s => s.id === data.segmentId);
        if (idx >= 0) task.segments[idx].status = data.status;
        task.updatedAt = Date.now();
      }
    }

    io.emit('status_updated', {
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
      const task = tasks.get(data.taskId);
      if (task) {
        task.comments.push(comment);
        task.updatedAt = Date.now();
      }
    }

    const payload: CommentPayload = { comment };
    io.emit('comment_added', payload);
  });

  socket.on('user_editing_event', (data: UserEditingPayload) => {
    const user = connectedUsers.get(socket.id);
    socket.broadcast.emit('user_editing', {
      ...data,
      userName: user?.nickname || data.userName
    });
  });

  socket.on('segment_selected', (data: { segmentId: string | null }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    socket.broadcast.emit('segment_selected', {
      segmentId: data.segmentId,
      userId: user.id,
      userName: user.nickname
    });
  });

  socket.on('save_task', (data: SaveTaskPayload) => {
    try {
      if (!data.taskId || !/^[A-Za-z0-9]{6}$/.test(data.taskId)) {
        socket.emit('error', { message: '任务ID必须是6位数字字母组合' });
        return;
      }

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
        createdAt: tasks.get(data.taskId)?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      tasks.set(data.taskId, task);

      socket.emit('task_saved', { taskId: data.taskId, savedAt: task.updatedAt });
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
  console.log(`[Server] HTTP endpoints ready on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket ready on ws://localhost:${PORT}`);
});
