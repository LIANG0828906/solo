import express from 'express';
import cors from 'cors';
import puppeteer, { Browser } from 'puppeteer';
import path from 'path';
import { scrapeUrl, ScrapedResult } from './scraper.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/screenshots', express.static(path.resolve(process.cwd(), 'screenshots')));

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
      ],
    });
  }
  return browser;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post('/api/compare', async (req, res) => {
  const { urls } = req.body as { urls: string[] };

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: '请提供至少一个URL' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let b: Browser;
  try {
    b = await getBrowser();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: '浏览器启动失败' })}\n\n`);
    res.end();
    return;
  }

  const results: ScrapedResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await scrapeUrl(b, urls[i]);
      results.push(result);
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          index: i,
          total: urls.length,
          url: urls[i],
          result,
        })}\n\n`
      );
    } catch (err) {
      const failResult: ScrapedResult = {
        url: urls[i],
        title: '',
        description: '',
        techStack: [],
        screenshotUrl: '',
        error: true,
      };
      results.push(failResult);
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          index: i,
          total: urls.length,
          url: urls[i],
          result: failResult,
        })}\n\n`
      );
    }

    if (i < urls.length - 1) {
      await delay(1000);
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'complete', results })}\n\n`);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
