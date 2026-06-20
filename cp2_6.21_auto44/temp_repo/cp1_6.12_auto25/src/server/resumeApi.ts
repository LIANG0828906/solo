import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import type { ResumeData, TemplateType } from '../client/types.js';
import { renderTemplate } from './templateEngine.js';

const resumeStore = new Map<string, ResumeData>();

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    cb(null, name + ext);
  }
});

const upload = multer({ storage });

const router = Router();

router.post('/resume', (req: Request, res: Response) => {
  const resume = req.body as ResumeData;
  if (!resume || !resume.id) {
    res.status(400).json({ error: 'Invalid resume data' });
    return;
  }
  resume.updatedAt = new Date().toISOString();
  resumeStore.set(resume.id, resume);
  res.json({ id: resume.id, updatedAt: resume.updatedAt });
});

router.get('/resume/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const resume = resumeStore.get(id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }
  res.json(resume);
});

router.get('/resumes', (_req: Request, res: Response) => {
  const list = Array.from(resumeStore.values());
  res.json(list);
});

router.post('/upload-avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const inputPath = req.file.path;
    const compressedName = 'compressed_' + req.file.filename.replace(path.extname(req.file.filename), '.jpg');
    const outputPath = path.join(uploadDir, compressedName);

    let quality = 80;
    let buffer = await sharp(inputPath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality })
      .toBuffer();

    while (buffer.length > 200 * 1024 && quality > 10) {
      quality -= 10;
      buffer = await sharp(inputPath)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality })
        .toBuffer();
    }

    fs.writeFileSync(outputPath, buffer);

    if (inputPath !== outputPath) {
      try { fs.unlinkSync(inputPath); } catch {}
    }

    const url = `/uploads/${compressedName}`;
    res.json({ url, size: buffer.length });
  } catch (err) {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

router.post('/export-pdf', async (req: Request, res: Response) => {
  const { template, resume } = req.body as { template: TemplateType; resume: ResumeData };
  if (!template || !resume) {
    res.status(400).json({ error: 'Missing template or resume data' });
    return;
  }

  let browser;
  try {
    const html = renderTemplate(template, resume);
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

router.post('/export-png', async (req: Request, res: Response) => {
  const { template, resume } = req.body as { template: TemplateType; resume: ResumeData };
  if (!template || !resume) {
    res.status(400).json({ error: 'Missing template or resume data' });
    return;
  }

  let browser;
  try {
    const html = renderTemplate(template, resume);
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 800, height: 1200 });
    const pngBuffer = await page.screenshot({ type: 'png', fullPage: true });
    await browser.close();

    res.contentType('image/png');
    res.send(pngBuffer);
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'PNG generation failed' });
  }
});

export default router;
