import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { exportMix, EXPORT_DIR } from '../services/fileService.js';
import fs from 'fs';

const router = Router();

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

router.post('/export', (req, res) => {
  try {
    const { tracks } = req.body;
    
    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ error: '没有轨道数据' });
    }
    
    const validTracks = tracks.filter(t => t.sampleId);
    
    if (validTracks.length === 0) {
      return res.status(400).json({ error: '没有有效的采样轨道' });
    }
    
    const filename = `mix_${uuidv4()}.wav`;
    const result = exportMix(validTracks, filename);
    
    setTimeout(() => {
      res.json({ 
        data: {
          url: `/api/mixer/download/${filename}`,
          filename
        }
      });
    }, 500);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/:filename', (req, res) => {
  try {
    const filePath = `${EXPORT_DIR}/${req.params.filename}`;
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
