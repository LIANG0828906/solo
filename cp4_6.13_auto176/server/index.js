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

app.post('/api/upload', upload.single('image'), async (req, res) => {
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

    if (data.words && data.words.length > 0) {
      for (const word of data.words) {
        const blockId = uuidv4();
        const { x0, y0, x1, y1 } = word.bbox;
        textBlocks.push({
          id: blockId,
          document_id: docId,
          text: word.text,
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
        });
      }
    }

    insertMany(textBlocks);

    res.json({
      document: { id: docId, filename, created_at: createdAt },
      textBlocks,
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
    const { documentId, annotations, imageFilename } = req.body;

    if (!documentId || !imageFilename) {
      return res.status(400).json({ error: 'Missing documentId or imageFilename' });
    }

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
            pdf.setFillColor(255, 255, 0);
            pdf.setGState(new pdf.GState({ opacity: 0.3 }));
            pdf.rect(x, y, w, h, 'F');
            pdf.setGState(new pdf.GState({ opacity: 1 }));
            break;
          case 'underline':
            pdf.setDrawColor(255, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(x, y + h, x + w, y + h);
            break;
          case 'strikethrough':
            pdf.setDrawColor(255, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(x, y + h / 2, x + w, y + h / 2);
            break;
          case 'comment':
            pdf.setFillColor(0, 120, 255);
            pdf.circle(x + w, y, 3, 'F');
            if (ann.comment) {
              pdf.setFontSize(8);
              pdf.setTextColor(0, 0, 0);
              pdf.text(ann.comment, x + w + 4, y + 3);
            }
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
