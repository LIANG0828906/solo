/**
 * WebSocket 处理器
 * 负责协同编辑的实时通信，包括：
 * - 房间（文档）的加入/离开管理
 * - 文本变更实时广播
 * - 光标位置同步
 * - 冲突检测与自动合并
 * - 版本保存与历史记录
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import db, { Document } from './db';

// ==================== 类型定义 ====================

/**
 * WebSocket 客户端扩展类型，携带鉴权与房间信息
 */
export interface ClientSocket extends WebSocket {
  userId?: string;
  username?: string;
  documentId?: string;
}

/**
 * 光标位置信息
 */
export interface CursorPosition {
  line: number;
  column: number;
  selectionStart?: number;
  selectionEnd?: number;
}

/**
 * 文本变更操作（简化版 OT 操作）
 */
export interface TextChange {
  start: number;
  end: number;
  text: string;
}

/**
 * WebSocket 消息基础结构
 */
export interface WSMessage<T = unknown> {
  type: 'join' | 'leave' | 'editor' | 'change' | 'cursor' | 'save' | 'version' | 'error' | 'info';
  payload: T;
  timestamp: number;
  userId?: string;
  username?: string;
}

/**
 * 房间信息：维护每个文档的连接客户端与实时状态
 */
interface RoomState {
  clients: Set<ClientSocket>;
  cursors: Map<string, { username: string; position: CursorPosition }>;
  pendingChanges: TextChange[];
  lastSavedVersion: number;
}

// ==================== 常量配置 ====================

const JWT_SECRET = process.env.JWT_SECRET || 'auto4-secret-key-change-in-production';
const AUTO_SAVE_INTERVAL_MS = 30_000; // 30秒自动保存

// ==================== 全局状态 ====================

/**
 * 房间映射表：documentId -> RoomState
 */
const rooms = new Map<string, RoomState>();

// ==================== 工具函数 ====================

/**
 * 从 HTTP 请求头中解析并验证 JWT Token
 */
function authenticateRequest(req: IncomingMessage): { userId: string; username: string } | null {
  try {
    // 从 URL query 或 Authorization header 获取 token
    const url = new URL(req.url || '/', 'http://localhost');
    const tokenFromQuery = url.searchParams.get('token');
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = tokenFromQuery || tokenFromHeader;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
}

/**
 * 向指定客户端发送 JSON 消息
 */
function send<T>(ws: ClientSocket, message: WSMessage<T>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * 向房间内除发送者外的所有客户端广播消息
 */
function broadcastToRoom<T>(
  documentId: string,
  message: WSMessage<T>,
  excludeWs?: ClientSocket,
): void {
  const room = rooms.get(documentId);
  if (!room) return;

  for (const client of room.clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

/**
 * 获取或创建房间状态对象
 */
function getOrCreateRoom(documentId: string): RoomState {
  let room = rooms.get(documentId);
  if (!room) {
    room = {
      clients: new Set(),
      cursors: new Map(),
      pendingChanges: [],
      lastSavedVersion: 0,
    };
    rooms.set(documentId, room);
  }
  return room;
}

/**
 * 基于简单转换操作的冲突合并
 * 将新变更基于已应用的变更进行位置偏移调整
 */
function mergeChange(change: TextChange, appliedChanges: TextChange[]): TextChange {
  let { start, end, text } = change;

  for (const applied of appliedChanges) {
    // 已应用变更删除的文本长度
    const removedLen = applied.end - applied.start;
    // 已应用变更新增的文本长度
    const insertedLen = applied.text.length;
    // 净长度变化
    const delta = insertedLen - removedLen;

    // 当前变更完全在已应用变更之后
    if (start >= applied.end) {
      start += delta;
      end += delta;
    }
    // 当前变更完全在已应用变更之前，无需调整
    else if (end <= applied.start) {
      continue;
    }
    // 重叠情况：保守地调整到已应用变更之后，避免文本丢失
    else {
      const overlapStart = Math.max(0, applied.end - start);
      start = applied.end + delta;
      end = start + Math.max(0, end - applied.start - overlapStart);
    }
  }

  return { start, end, text };
}

/**
 * 将变更应用到文档内容字符串
 */
function applyChange(content: string, change: TextChange): string {
  return content.slice(0, change.start) + change.text + content.slice(change.end);
}

/**
 * 将房间的当前变更持久化到数据库
 */
async function saveRoomToDatabase(documentId: string): Promise<Document | null> {
  const room = rooms.get(documentId);
  if (!room) return null;

  await db.read();
  const doc = db.data!.documents.find((d) => d.id === documentId);
  if (!doc) return null;

  if (room.pendingChanges.length === 0) return doc;

  // 依次应用所有待保存的变更
  let newContent = doc.content;
  for (const change of room.pendingChanges) {
    newContent = applyChange(newContent, change);
  }

  // 递增版本并保存历史
  const newVersion = doc.version + 1;
  doc.content = newContent;
  doc.version = newVersion;
  doc.updatedAt = new Date().toISOString();
  doc.history.push({
    version: newVersion,
    content: newContent,
    timestamp: new Date().toISOString(),
  });

  room.pendingChanges = [];
  room.lastSavedVersion = newVersion;

  await db.write();

  // 广播新版本通知
  broadcastToRoom(documentId, {
    type: 'version',
    payload: { version: newVersion, content: newContent },
    timestamp: Date.now(),
  });

  return doc;
}

// ==================== 消息处理器 ====================

/**
 * 加入文档房间
 */
function handleJoin(ws: ClientSocket, documentId: string): void {
  if (!ws.userId) return;

  ws.documentId = documentId;
  const room = getOrCreateRoom(documentId);
  room.clients.add(ws);

  // 通知房间中其他用户
  broadcastToRoom(
    documentId,
    {
      type: 'join',
      payload: { userId: ws.userId, username: ws.username, documentId },
      timestamp: Date.now(),
      userId: ws.userId,
      username: ws.username,
    },
    ws,
  );

  // 将当前在线用户列表发送给新加入者
  const userList = Array.from(room.clients)
    .filter((c) => c.userId)
    .map((c) => ({ userId: c.userId, username: c.username }));

  send(ws, {
    type: 'info',
    payload: {
      users: userList,
      cursors: Object.fromEntries(
        Array.from(room.cursors.entries()).map(([uid, data]) => [uid, data]),
      ),
    },
    timestamp: Date.now(),
  });
}

/**
 * 离开文档房间
 */
function handleLeave(ws: ClientSocket): void {
  if (!ws.documentId || !ws.userId) return;

  const room = rooms.get(ws.documentId);
  if (!room) return;

  room.clients.delete(ws);
  room.cursors.delete(ws.userId);

  // 如果房间已清空，触发一次保存并清理房间
  if (room.clients.size === 0) {
    saveRoomToDatabase(ws.documentId).finally(() => {
      rooms.delete(ws.documentId!);
    });
  } else {
    // 通知其他用户该用户已离开
    broadcastToRoom(ws.documentId, {
      type: 'leave',
      payload: { userId: ws.userId, username: ws.username },
      timestamp: Date.now(),
      userId: ws.userId,
      username: ws.username,
    });
  }

  ws.documentId = undefined;
}

/**
 * 处理文本变更（带冲突合并）
 */
function handleChange(ws: ClientSocket, change: TextChange): void {
  if (!ws.documentId || !ws.userId) return;

  const room = rooms.get(ws.documentId);
  if (!room) return;

  // 合并冲突：基于房间内尚未保存的变更进行位置转换
  const mergedChange = mergeChange(change, room.pendingChanges);

  // 记录到待保存队列
  room.pendingChanges.push(mergedChange);

  // 广播合并后的变更给房间内其他用户
  broadcastToRoom(
    ws.documentId,
    {
      type: 'change',
      payload: mergedChange,
      timestamp: Date.now(),
      userId: ws.userId,
      username: ws.username,
    },
    ws,
  );
}

/**
 * 处理光标位置同步
 */
function handleCursor(ws: ClientSocket, position: CursorPosition): void {
  if (!ws.documentId || !ws.userId) return;

  const room = rooms.get(ws.documentId);
  if (!room) return;

  // 更新房间内该用户的光标记录
  room.cursors.set(ws.userId, {
    username: ws.username || '未知用户',
    position,
  });

  // 广播给其他用户
  broadcastToRoom(
    ws.documentId,
    {
      type: 'cursor',
      payload: { userId: ws.userId, username: ws.username, position },
      timestamp: Date.now(),
      userId: ws.userId,
      username: ws.username,
    },
    ws,
  );
}

/**
 * 处理显式保存请求
 */
async function handleSave(ws: ClientSocket): Promise<void> {
  if (!ws.documentId) return;

  try {
    const doc = await saveRoomToDatabase(ws.documentId);
    if (doc) {
      send(ws, {
        type: 'save',
        payload: { success: true, version: doc.version, updatedAt: doc.updatedAt },
        timestamp: Date.now(),
      });
    } else {
      send(ws, {
        type: 'error',
        payload: { message: '文档不存在' },
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    send(ws, {
      type: 'error',
      payload: { message: '保存失败', error: String(err) },
      timestamp: Date.now(),
    });
  }
}

// ==================== 对外接口 ====================

/**
 * 挂载 WebSocket 服务器到 HTTP 服务
 */
export function setupWebSocketServer(wss: WebSocketServer): void {
  // 定时自动保存所有房间
  const autoSaveTimer = setInterval(() => {
    const documentIds = Array.from(rooms.keys());
    for (const docId of documentIds) {
      saveRoomToDatabase(docId).catch((err) => {
        console.error(`自动保存文档 ${docId} 失败:`, err);
      });
    }
  }, AUTO_SAVE_INTERVAL_MS);

  wss.on('connection', (ws: ClientSocket, req: IncomingMessage) => {
    // 连接建立时先鉴权
    const auth = authenticateRequest(req);
    if (!auth) {
      send(ws, {
        type: 'error',
        payload: { message: '未授权的连接，请提供有效 Token' },
        timestamp: Date.now(),
      });
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.userId = auth.userId;
    ws.username = auth.username;

    send(ws, {
      type: 'info',
      payload: { message: '连接成功', userId: ws.userId, username: ws.username },
      timestamp: Date.now(),
    });

    // 处理收到的消息
    ws.on('message', async (rawData) => {
      try {
        const message: WSMessage = JSON.parse(rawData.toString());

        switch (message.type) {
          case 'join':
            handleJoin(ws, message.payload as string);
            break;
          case 'leave':
            handleLeave(ws);
            break;
          case 'change':
            handleChange(ws, message.payload as TextChange);
            break;
          case 'cursor':
            handleCursor(ws, message.payload as CursorPosition);
            break;
          case 'save':
            await handleSave(ws);
            break;
          default:
            send(ws, {
              type: 'error',
              payload: { message: `未知的消息类型: ${message.type}` },
              timestamp: Date.now(),
            });
        }
      } catch (err) {
        send(ws, {
          type: 'error',
          payload: { message: '消息格式错误', error: String(err) },
          timestamp: Date.now(),
        });
      }
    });

    // 连接断开时自动清理
    ws.on('close', () => {
      handleLeave(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket 错误:', err);
      handleLeave(ws);
    });
  });

  // 服务器关闭时清理
  wss.on('close', () => {
    clearInterval(autoSaveTimer);
    // 关闭前保存所有房间
    const savePromises = Array.from(rooms.keys()).map((docId) => saveRoomToDatabase(docId));
    Promise.all(savePromises).catch((err) => {
      console.error('服务器关闭时保存失败:', err);
    });
  });
}

export default setupWebSocketServer;
