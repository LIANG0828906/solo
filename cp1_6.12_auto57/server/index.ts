import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Recording {
  id: string;
  name: string;
  notes: any[];
  duration: number;
  createdAt: number;
  tag: string;
}

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let recordings: Recording[] = [];

app.post('/api/saveRecord', (req, res) => {
  try {
    const recording = req.body as Recording;

    if (!recording.notes || !Array.isArray(recording.notes)) {
      return res.status(400).json({ error: '无效的录音数据' });
    }

    const newRecording: Recording = {
      id: recording.id || uuidv4(),
      name: recording.name || '未命名录音',
      notes: recording.notes,
      duration: recording.duration || 0,
      createdAt: recording.createdAt || Date.now(),
      tag: recording.tag || ''
    };

    recordings.push(newRecording);

    console.log(`录音已保存: ${newRecording.id} (${newRecording.notes.length} 个音符)`);

    res.json({
      success: true,
      id: newRecording.id
    });
  } catch (error) {
    console.error('保存录音失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/listRecords', (req, res) => {
  try {
    const sortedRecordings = [...recordings].sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      recordings: sortedRecordings
    });
  } catch (error) {
    console.error('获取录音列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/record/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recording = recordings.find(r => r.id === id);

    if (!recording) {
      return res.status(404).json({ error: '录音不存在' });
    }

    res.json(recording);
  } catch (error) {
    console.error('获取录音失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 虚拟乐器后端服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 录音存储: 内存模式 (${recordings.length} 个录音)`);
});
