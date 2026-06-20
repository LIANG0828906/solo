import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type {
  ClientMessage,
  ServerMessage,
  Comment,
  UserInfo,
  Version,
  EditOp,
} from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const userColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF'];
let colorIndex = 0;

interface DocumentData {
  content: string;
  comments: Comment[];
  versions: Version[];
  users: Map<string, UserInfo>;
}

const documents = new Map<string, DocumentData>();

const getDocument = (docId: string): DocumentData => {
  if (!documents.has(docId)) {
    const initialContent = `第一章 初遇

清晨的阳光透过薄纱窗帘，洒在木质书桌上，泛起一层金色的光芒。李明放下手中的钢笔，抬头望向窗外，远处的山峦在晨雾中若隐若现。

这是他来到这座小城的第三个月。作为一名年轻的编辑，他被派往这个独立出版社委以重任，负责一套系列小说的策划与编辑工作。

"叮铃铃——

电话铃声打破了宁静。李明伸手拿起听筒，里面传来主编熟悉的声音。

"李明，今天有位新作者要来，你去接待一下。"

"好的，主编。"

挂掉电话，李明整理了一下桌上的稿纸，站起身来。他看着镜子里的自己，深吸了一口气。

第二章 书稿

下午两点，门铃响了。

李明打开门，站在门口的是一位穿着米色风衣的年轻女子。她手里紧紧抱着一个牛皮纸信封，眼睛里带着一丝紧张和期待。

"请问...请问是李编辑吗？"

"我是，您是王小姐吧，请进。"

女子微微点头，走进了办公室。她环顾四周，目光落在了书架上那一排排整齐的书籍上，眼中闪过一丝憧憬。

"王小姐，请坐。"李明递过一杯热茶，"您的书稿我看过了，写得很好。"

"真的吗？"女子有些不敢相信自己的耳朵，"可是...可是这是我第一次写小说。"

"第一次就能写出这样的作品，很了不起。"李明真诚地说道，"您的文字很有灵气，只是在情节上还可以再打磨一下。"

女子低下头，手指轻轻摩挲着茶杯的边缘。过了一会儿，她抬起头，眼中带着坚定的光芒。

"李编辑，我想请您帮我修改。"

第三章 合作

从那天起，李明和王雨晴开始了他们的合作。

每天下午，王雨晴都会来到出版社，和李明一起讨论书稿的细节。他们逐字逐句地推敲，从人物性格到情节转折，每一个细节都不放过。

"这里，我觉得主角的反应应该更激烈一些。"李明指着一段文字说道。

王雨晴思考了一会儿，然后点了点头。"你说得对，他是一个冲动的人，不应该这么平静。"

日子一天天过去，书稿在两人的共同努力下逐渐成形。每一次修改，都让故事变得更加丰满。

"李明，谢谢你。"一天傍晚，王雨晴看着窗外的夕阳说道，"如果没有你，这本书不可能变成现在这样。"

李明笑了笑。"是你写得好，我只是提了些建议而已。"

夕阳的余晖洒在两人身上，将他们的影子拉得很长很长。

第四章 困难

然而，事情并不总是一帆风顺。

就在书稿即将完成的时候，问题出现了。

"这个结尾...我觉得不太好。"王雨晴皱着眉头说道。

"为什么？"李明有些意外，"这个结尾不是我们之前讨论过的，你当时也同意了。"

"我知道，可是..."王雨晴咬了咬嘴唇，"我总觉得缺少了什么。"

李明沉默了。他理解王雨晴的感受，作为作者对自己作品的那种苛刻，他见得太多了。

"那你想怎么改？"

王雨晴抬起头，眼中带着迷茫。"我不知道...我只是觉得，应该有更有力量的东西。"

那天的讨论没有结果不欢而散。

第五章 灵感

接下来的几天，两人都陷入了沉默。

李明独自坐在办公室里，看着桌上的书稿，心中有些烦躁。他知道，这个结尾很重要，它决定了整本书的高度。

一天晚上，李明加班到很晚。他站起身，走到窗边，看着城市的万家灯火。

突然，他想起了什么。

他立刻拿起电话，拨通了王雨晴的号码。

"雨晴，我想到了。"

电话那头沉默了一会儿，然后传来王雨晴的声音。"我也想到了。"

两人异口同声地说道：

"让主角应该做出选择。"

第六章 终章

三个月后，书出版了。

首发式上，王雨晴站在台上，看着台下的读者，心中充满感慨。

"这本书，"她看向站在角落的李明，"离不开一个人的帮助。"

李明微笑着，向她点了点头。

书的扉页上写着：献给那些在文字中相遇的人。

故事，才刚刚开始。
`;
    documents.set(docId, {
      content: initialContent,
      comments: [
        {
          id: uuidv4(),
          start: 50,
          end: 80,
          text: '这段环境描写很有画面感，建议再增加一些感官细节。',
          author: '张编辑',
          authorColor: '#4ECDC4',
          resolved: false,
          replies: [
            {
              id: uuidv4(),
              text: '好的，我会再润色一下这段。',
              author: '王作者',
              createdAt: Date.now() - 86400000,
            },
          ],
          createdAt: Date.now() - 172800000,
        },
        {
          id: uuidv4(),
          start: 300,
          end: 350,
          text: '对话部分很生动，人物性格鲜明。',
          author: '李编辑',
          authorColor: '#FF6B6B',
          resolved: true,
          replies: [],
          createdAt: Date.now() - 259200000,
        },
      ],
      versions: [
        {
          id: uuidv4(),
          content: initialContent,
          comments: [],
          wordCount: initialContent.trim().split(/\s+/).length,
          createdAt: Date.now() - 604800000,
        },
      ],
      users: new Map(),
    });
  }
  return documents.get(docId)!;
};

app.get('/api/document/:id', (req, res) => {
  const doc = getDocument(req.params.id);
  res.json({
    content: doc.content,
    comments: doc.comments,
  });
});

app.put('/api/document/:id', (req, res) => {
  const doc = getDocument(req.params.id);
  const { content, comments } = req.body;
  if (content !== undefined) doc.content = content;
  if (comments !== undefined) doc.comments = comments;
  res.json({ success: true });
});

app.get('/api/document/:id/versions', (req, res) => {
  const doc = getDocument(req.params.id);
  res.json(doc.versions);
});

app.post('/api/document/:id/versions', (req, res) => {
  const doc = getDocument(req.params.id);
  const version: Version = {
    id: uuidv4(),
    content: doc.content,
    comments: JSON.parse(JSON.stringify(doc.comments)),
    wordCount: doc.content.trim().split(/\s+/).length,
    createdAt: Date.now(),
  };
  doc.versions.unshift(version);
  res.json(version);
});

app.get('/api/document/:id/versions/:versionId', (req, res) => {
  const doc = getDocument(req.params.id);
  const version = doc.versions.find((v) => v.id === req.params.versionId);
  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  res.json(version);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

interface WSClientData {
  userId: string;
  userName: string;
  documentId: string;
  color: string;
}

const clients = new Map<WebSocket, WSClientData>();

const getNextColor = (): string => {
  const color = userColors[colorIndex % userColors.length];
  colorIndex++;
  return color;
};

const broadcastToDocument = (docId: string, message: ServerMessage, excludeWs?: WebSocket): void => {
  const msgStr = JSON.stringify(message);
  clients.forEach((data, ws) => {
    if (ws !== excludeWs && data.documentId === docId && ws.readyState === WebSocket.OPEN) {
      ws.send(msgStr);
    }
  });
};

const getUserList = (docId: string): UserInfo[] => {
  const users: UserInfo[] = [];
  clients.forEach((data) => {
    if (data.documentId === docId) {
      const doc = getDocument(docId);
      const userData = doc.users.get(data.userId);
      if (userData) {
        users.push(userData);
      }
    }
  });
  return users;
};

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);
    if (clientData) {
      const { userId, documentId } = clientData;
      const doc = getDocument(documentId);
      doc.users.delete(userId);
      clients.delete(ws);

      broadcastToDocument(documentId, {
        type: 'userLeave',
        userId,
      });

      broadcastToDocument(documentId, {
        type: 'users',
        users: getUserList(documentId),
      });
    }
    console.log('WebSocket disconnected');
  });
});

const handleMessage = (ws: WebSocket, message: ClientMessage): void => {
  switch (message.type) {
    case 'join': {
      const color = getNextColor();
      const clientData: WSClientData = {
        userId: message.userId,
        userName: message.userName,
        documentId: message.documentId,
        color,
      };
      clients.set(ws, clientData);

      const doc = getDocument(message.documentId);
      const userInfo: UserInfo = {
        id: message.userId,
        name: message.userName,
        color,
        cursorPosition: 0,
      };
      doc.users.set(message.userId, userInfo);

      ws.send(JSON.stringify({
        type: 'init',
        content: doc.content,
        comments: doc.comments,
        users: getUserList(message.documentId),
      } as ServerMessage));

      broadcastToDocument(message.documentId, {
        type: 'userJoin',
        user: userInfo,
      } as ServerMessage, ws);

      broadcastToDocument(message.documentId, {
        type: 'users',
        users: getUserList(message.documentId),
      } as ServerMessage);

      break;
    }
    case 'leave': {
      const clientData = clients.get(ws);
      if (clientData) {
        const doc = getDocument(message.documentId);
        doc.users.delete(message.userId);

        broadcastToDocument(message.documentId, {
          type: 'userLeave',
          userId: message.userId,
        } as ServerMessage);

        broadcastToDocument(message.documentId, {
          type: 'users',
          users: getUserList(message.documentId),
        } as ServerMessage);
      }
      break;
    }
    case 'edit': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);

      if (message.op.type === 'insert' && message.op.text) {
        doc.content = doc.content.slice(0, message.op.position) +
          message.op.text +
          doc.content.slice(message.op.position);
      } else if (message.op.type === 'delete' && message.op.length) {
        doc.content = doc.content.slice(0, message.op.position) +
          doc.content.slice(message.op.position + message.op.length);
      }

      shiftComments(doc, message.op);

      broadcastToDocument(message.documentId, {
        type: 'edit',
        userId: message.userId,
        op: message.op,
      } as ServerMessage, ws);

      break;
    }
    case 'cursor': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);
      const user = doc.users.get(message.userId);
      if (user) {
        user.cursorPosition = message.position;
        user.selectionStart = message.position;
        user.selectionEnd = message.position;
      }

      broadcastToDocument(message.documentId, {
        type: 'cursor',
        userId: message.userId,
        position: message.position,
        color: clientData.color,
      } as ServerMessage, ws);

      break;
    }
    case 'selection': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);
      const user = doc.users.get(message.userId);
      if (user) {
        user.selectionStart = message.start;
        user.selectionEnd = message.end;
        user.cursorPosition = message.end;
      }

      broadcastToDocument(message.documentId, {
        type: 'selection',
        userId: message.userId,
        start: message.start,
        end: message.end,
        color: clientData.color,
      } as ServerMessage, ws);

      break;
    }
    case 'comment': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);
      doc.comments.push(message.comment);

      broadcastToDocument(message.documentId, {
        type: 'comment',
        comment: message.comment,
      } as ServerMessage, ws);

      break;
    }
    case 'resolveComment': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);
      const comment = doc.comments.find((c) => c.id === message.commentId);
      if (comment) {
        comment.resolved = message.resolved;
      }

      broadcastToDocument(message.documentId, {
        type: 'resolveComment',
        commentId: message.commentId,
        resolved: message.resolved,
      } as ServerMessage, ws);

      break;
    }
    case 'replyComment': {
      const clientData = clients.get(ws);
      if (!clientData) return;

      const doc = getDocument(message.documentId);
      const comment = doc.comments.find((c) => c.id === message.commentId);
      if (comment) {
        comment.replies.push(message.reply);
      }

      broadcastToDocument(message.documentId, {
        type: 'replyComment',
        commentId: message.commentId,
        reply: message.reply,
      } as ServerMessage, ws);

      break;
    }
  }
};

const shiftComments = (doc: DocumentData, op: EditOp): void => {
  if (op.type === 'insert' && op.text) {
    const length = op.text.length;
    doc.comments.forEach((comment) => {
      if (comment.start >= op.position) {
        comment.start += length;
        comment.end += length;
      } else if (comment.end >= op.position) {
        comment.end += length;
      }
    });
  } else if (op.type === 'delete' && op.length) {
    const length = op.length;
    doc.comments.forEach((comment) => {
      if (comment.start >= op.position + length) {
        comment.start -= length;
        comment.end -= length;
      } else if (comment.end <= op.position + length && comment.end >= op.position) {
        comment.end = op.position;
      } else if (comment.start < op.position && comment.end > op.position + length) {
        comment.end -= length;
      }
    });
    doc.comments = doc.comments.filter((c) => c.start < c.end);
  }
};

export default app;
