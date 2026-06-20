import express from 'express';
import cors from 'cors';
import { generateTonalPalette, buildColorGroup, isValidHex } from './colorUtils';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/tonal-palette', (req, res) => {
  try {
    const { hex } = req.body as { hex?: string };

    if (!hex || typeof hex !== 'string') {
      return res.status(400).json({ error: '请提供hex颜色参数' });
    }

    if (!isValidHex(hex)) {
      return res.status(400).json({ error: '请输入有效的十六进制颜色' });
    }

    const palettes = generateTonalPalette(hex);
    const colorGroup = buildColorGroup(palettes);

    return res.json(colorGroup);
  } catch (err) {
    console.error('Tonal palette error:', err);
    return res.status(500).json({ error: '色彩处理发生错误' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[server] M3 配色服务运行于 http://localhost:${PORT}`);
});
