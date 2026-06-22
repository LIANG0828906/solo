import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { Pool } from 'pg';

const router = Router();

let pool: Pool | null = null;
let io: SocketServer | null = null;

const mockMessages: Array<{
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}> = [];

export function setPool(p: Pool | null) {
  pool = p;
}

export function setupSocket(socketServer: SocketServer) {
  io = socketServer;

  io.on('connection', (socket) => {
    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
    });

    socket.on('send_message', async (data: { chat_id: string; sender_id: string; receiver_id: string; content: string }) => {
      try {
        let message;
        if (pool) {
          const result = await pool.query(
            `INSERT INTO chats (chat_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
            [data.chat_id, data.sender_id, data.receiver_id, data.content]
          );
          message = result.rows[0];
        } else {
          message = {
            id: crypto.randomUUID(),
            chat_id: data.chat_id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            content: data.content,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          mockMessages.push(message);
        }
        io!.to(data.chat_id).emit('new_message', message);
      } catch (err) {
        console.error('保存消息失败:', err);
      }
    });

    socket.on('mark_read', async (data: { chat_id: string; sender_id: string; receiver_id: string }) => {
      try {
        if (pool) {
          await pool.query(
            'UPDATE chats SET is_read = TRUE WHERE chat_id = $1 AND sender_id = $2 AND receiver_id = $3',
            [data.chat_id, data.sender_id, data.receiver_id]
          );
        } else {
          for (const msg of mockMessages) {
            if (msg.chat_id === data.chat_id && msg.sender_id === data.sender_id && msg.receiver_id === data.receiver_id) {
              msg.is_read = true;
            }
          }
        }
        io!.to(data.chat_id).emit('read_receipt', { chat_id: data.chat_id, sender_id: data.sender_id, receiver_id: data.receiver_id });
      } catch (err) {
        console.error('标记已读失败:', err);
      }
    });
  });
}

router.get('/:chatId/messages', async (req: Request, res: Response) => {
  const { chatId } = req.params;

  try {
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM chats WHERE chat_id = $1 ORDER BY created_at ASC',
        [chatId]
      );
      res.json(result.rows);
    } else {
      const messages = mockMessages
        .filter((m) => m.chat_id === chatId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      res.json(messages);
    }
  } catch (err) {
    console.error('获取聊天记录失败:', err);
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

router.post('/:chatId/messages', async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { sender_id, receiver_id, content } = req.body;

  if (!sender_id || !receiver_id || !content) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  try {
    let message;
    if (pool) {
      const result = await pool.query(
        'INSERT INTO chats (chat_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [chatId, sender_id, receiver_id, content]
      );
      message = result.rows[0];
    } else {
      message = {
        id: crypto.randomUUID(),
        chat_id: chatId,
        sender_id,
        receiver_id,
        content,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      mockMessages.push(message);
    }

    if (io) {
      io.to(chatId).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('发送消息失败:', err);
    res.status(500).json({ error: '发送消息失败' });
  }
});

export default router;
