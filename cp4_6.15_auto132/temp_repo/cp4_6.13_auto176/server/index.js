import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS text_blocks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    text TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id)
  );
`);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const docId = uuidv4();
    const filename = req.file.filename;
    const filePath = req.file.path;
    const createdAt = new Date().toISOString();

    db.prepare(
      'INSERT INTO documents (id, filename, created_at) VALUES (?, ?, ?)'
    ).run(docId, filename, createdAt);

    const worker = await createWorker('eng+chi_sim', 1, {
      logger: (m) => console.log(m),
    });

    const { data } = await worker.recognize(filePath);
    await worker.terminate();

    const textBlocks = [];
    const insertBlock = db.prepare(
      'INSERT INTO text_blocks (id, document_id, text, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((blocks) => {
      for (const block of blocks) {
        insertBlock.run(
          block.id,
          block.document_id,
          block.text,
          block.x,
          block.y,
          block.width,
          block.height
        );
      }
    });

    const extractLineText = (line) => {
      if (line.text && typeof line.text === 'string' && line.text.trim().length > 0) {
        return line.text.trim();
      }
      if (line.words && Array.isArray(line.words) && line.words.length > 0) {
        return line.words.map((w) => w.text || '').join(' ').trim();
      }
      return '';
    };

    const getLineConfidence = (line) => {
      if (typeof line.confidence === 'number') return line.confidence;
      if (line.words && Array.isArray(line.words) && line.words.length > 0) {
        const valid = line.words.filter((w) => typeof w.confidence === 'number');
        if (valid.length > 0) {
          return valid.reduce((sum, w) => sum + w.confidence, 0) / valid.length;
        }
      }
      return 0;
    };

    const MIN_CONFIDENCE = 50;

    if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
      for (const line of data.lines) {
        if (!line || !line.bbox) continue;
        const confidence = getLineConfidence(line);
        if (confidence < MIN_CONFIDENCE) continue;

        const text = extractLineText(line);
        if (text.length === 0) continue;

        const { x0, y0, x1, y1 } = line.bbox;
        if (typeof x0 !== 'number' || typeof y0 !== 'number' ||
            typeof x1 !== 'number' || typeof y1 !== 'number') continue;
        if (x1 <= x0 || y1 <= y0) continue;

        const blockId = uuidv4();
        textBlocks.push({
          id: blockId,
          document_id: docId,
          text,
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
        });
      }
    }

    if (textBlocks.length === 0 && data.words && Array.isArray(data.words) && data.words.length > 0) {
      console.warn('No valid lines found, falling back to merged words by y-coordinate proximity');
      const MIN_WORD_CONFIDENCE = 45;
      const LINE_Y_GAP_THRESHOLD = 10;

      const validWords = data.words.filter(
        (w) => w && w.bbox &&
               typeof w.confidence === 'number' && w.confidence >= MIN_WORD_CONFIDENCE &&
               typeof w.text === 'string' && w.text.trim().length > 0
      );

      if (validWords.length > 0) {
        validWords.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

        const lines = [];
        let currentLine = null;
        for (const word of validWords) {
          const wordMidY = (word.bbox.y0 + word.bbox.y1) / 2;
          if (!currentLine || wordMidY - currentLine.midY > LINE_Y_GAP_THRESHOLD) {
            currentLine = {
              words: [word],
              midY: wordMidY,
              minY: word.bbox.y0,
              maxY: word.bbox.y1,
              minX: word.bbox.x0,
              maxX: word.bbox.x1,
            };
            lines.push(currentLine);
          } else {
            currentLine.words.push(word);
            currentLine.midY = (currentLine.midY * (currentLine.words.length - 1) + wordMidY) / currentLine.words.length;
            currentLine.minY = Math.min(currentLine.minY, word.bbox.y0);
            currentLine.maxY = Math.max(currentLine.maxY, word.bbox.y1);
            currentLine.maxX = Math.max(currentLine.maxX, word.bbox.x1);
            currentLine.minX = Math.min(currentLine.minX, word.bbox.x0);
          }
        }

        for (const line of lines) {
          const text = line.words.map((w) => w.text).join(' ').trim();
          if (text.length === 0) continue;
          const blockId = uuidv4();
          textBlocks.push({
            id: blockId,
            document_id: docId,
            text,
            x: line.minX,
            y: line.minY,
            width: line.maxX - line.minX,
            height: line.maxY - line.minY,
          });
        }
      }
    }

    insertMany(textBlocks);

    const responseTextBlocks = textBlocks.map((block) => ({
      id: block.id,
      text: block.text,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
    }));

    res.json({
      documentId: docId,
      textBlocks: responseTextBlocks,
      imageUrl: `/uploads/${filename}`,
      imageWidth: data.imageWidth,
      imageHeight: data.imageHeight,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { documentId, annotations } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Missing documentId' });
    }

    const doc = db.prepare('SELECT filename FROM documents WHERE id = ?').get(documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const imageFilename = doc.filename;
    const imagePath = path.join(uploadsDir, imageFilename);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    const imageBuffer = await sharp(imagePath).png().toBuffer();
    const imageDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const metadata = await sharp(imagePath).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imageDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

    if (annotations && annotations.length > 0) {
      const scaleX = pageWidth / imgWidth;
      const scaleY = pageHeight / imgHeight;

      for (const ann of annotations) {
        const x = ann.x * scaleX;
        const y = ann.y * scaleY;
        const w = ann.width * scaleX;
        const h = ann.height * scaleY;

        switch (ann.type) {
          case 'highlight':
            pdf.setFillColor(255, 235, 59);
            pdf.setDrawColor(255, 235, 59);
            pdf.setLineWidth(0.1);
            const highlightLines = 8;
            for (let i = 0; i < highlightLines; i++) {
              const lineY = y + (h * i) / highlightLines;
              const lineH = h / highlightLines * 0.5;
              pdf.rect(x, lineY, w, lineH, 'FD');
            }
            break;
          case 'underline':
            pdf.setDrawColor(33, 150, 243);
            pdf.setLineWidth(0.4);
            const waveAmp = 0.8;
            const waveLen = 3;
            let prevX = x;
            let prevY = y + h;
            for (let px = waveLen; px <= w; px += waveLen / 4) {
              const py = y + h + Math.sin((px / waveLen) * Math.PI * 2) * waveAmp;
              pdf.line(prevX, prevY, x + px, py);
              prevX = x + px;
              prevY = py;
            }
            if (prevX < x + w) {
              pdf.line(prevX, prevY, x + w, y + h);
            }
            break;
          case 'strikethrough':
            pdf.setDrawColor(229, 57, 53);
            pdf.setLineWidth(0.6);
            pdf.line(x, y + h / 2, x + w, y + h / 2);
            break;
          case 'comment':
            const bubbleR = 3;
            const bubbleX = x + w + bubbleR * 0.5;
            const bubbleY = y - bubbleR * 0.3;
            pdf.setFillColor(229, 57, 53);
            pdf.setDrawColor(229, 57, 53);
            pdf.circle(bubbleX, bubbleY, bubbleR, 'FD');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(6);
            pdf.setFont(undefined, 'bold');
            pdf.text(String(ann.commentNumber || 1), bubbleX, bubbleY + 1, { align: 'center', baseline: 'middle' });
            pdf.setFont(undefined, 'normal');
            break;
        }
      }
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const pdfFilename = `${uuidv4()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    res.json({ downloadUrl: `/uploads/${pdfFilename}` });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
