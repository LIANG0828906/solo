import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { announcements: [] };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据失败:', error);
    return { announcements: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入数据失败:', error);
    return false;
  }
}

app.get('/api/announcements', (req, res) => {
  const data = readData();
  const announcements = data.announcements || [];
  announcements.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ announcements });
});

app.post('/api/announcements', (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: '标题、内容和作者都是必填项' });
  }

  if (title.length > 30) {
    return res.status(400).json({ error: '标题不能超过30个字符' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: '内容不能超过500个字符' });
  }

  const newAnnouncement = {
    id: uuidv4(),
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    createdAt: Date.now(),
    votes: []
  };

  const data = readData();
  data.announcements = data.announcements || [];
  data.announcements.unshift(newAnnouncement);

  if (writeData(data)) {
    res.json({ announcement: newAnnouncement });
  } else {
    res.status(500).json({ error: '保存公告失败' });
  }
});

app.post('/api/votes', (req, res) => {
  const { announcementId, title, options } = req.body;

  if (!announcementId || !title || !options || !Array.isArray(options)) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (options.length < 2 || options.length > 4) {
    return res.status(400).json({ error: '选项数量必须在2到4个之间' });
  }

  const validOptions = options.filter(opt => typeof opt === 'string' && opt.trim() !== '');
  if (validOptions.length < 2) {
    return res.status(400).json({ error: '至少需要2个有效选项' });
  }

  const data = readData();
  const announcement = (data.announcements || []).find(a => a.id === announcementId);

  if (!announcement) {
    return res.status(404).json({ error: '公告不存在' });
  }

  const newVote = {
    id: uuidv4(),
    announcementId,
    title: title.trim(),
    options: validOptions.map(opt => ({
      id: uuidv4(),
      text: opt.trim(),
      votes: 0
    })),
    createdAt: Date.now()
  };

  announcement.votes = announcement.votes || [];
  announcement.votes.push(newVote);

  if (writeData(data)) {
    res.json({ vote: newVote });
  } else {
    res.status(500).json({ error: '创建投票失败' });
  }
});

app.post('/api/votes/:voteId/vote', (req, res) => {
  const { voteId } = req.params;
  const { optionId } = req.body;

  if (!optionId) {
    return res.status(400).json({ error: '缺少选项ID' });
  }

  const data = readData();
  const announcements = data.announcements || [];

  let foundVote = null;
  let foundAnnouncement = null;

  for (const announcement of announcements) {
    const votes = announcement.votes || [];
    const vote = votes.find(v => v.id === voteId);
    if (vote) {
      foundVote = vote;
      foundAnnouncement = announcement;
      break;
    }
  }

  if (!foundVote || !foundAnnouncement) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const option = foundVote.options.find(opt => opt.id === optionId);
  if (!option) {
    return res.status(404).json({ error: '选项不存在' });
  }

  option.votes += 1;

  if (writeData(data)) {
    res.json({ vote: foundVote });
  } else {
    res.status(500).json({ error: '投票失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
