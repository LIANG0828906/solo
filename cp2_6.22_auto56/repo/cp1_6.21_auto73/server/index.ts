import express from 'express';
import cors from 'cors';
import { convertImage } from './convertLogic';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));

interface ConvertRequest {
  image: string;
  fineness: number;
}

app.post('/api/convert', async (req, res) => {
  try {
    const { image, fineness = 5 } = req.body as ConvertRequest;
    if (!image) {
      return res.status(400).json({ error: '请上传图片' });
    }
    const result = await convertImage(image, fineness);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('转绘错误:', error);
    res.status(500).json({ error: '转绘处理失败' });
  }
});

app.get('/api/export/:id', (req, res) => {
  const { id } = req.params;
  const { format } = req.query;
  res.json({
    success: true,
    exportId: id,
    format: format || 'svg',
    downloadUrl: `/downloads/${id}.${format || 'svg'}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
