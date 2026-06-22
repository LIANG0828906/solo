import puppeteer, { Browser, Page } from 'puppeteer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ScrapedResult {
  url: string;
  title: string;
  description: string;
  techStack: string[];
  screenshotUrl: string;
  error?: boolean;
}

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'screenshots');

function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

function urlToHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

async function detectTechStack(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const stack: string[] = [];

    const html = document.documentElement.outerHTML;

    if (
      document.querySelector('[data-reactroot]') ||
      document.querySelector('[data-reactid]') ||
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      /react\.production\.min\.js|react-dom/i.test(html)
    ) {
      stack.push('React');
    }

    if (
      document.querySelector('[data-v-]') ||
      document.querySelector('[data-server-rendered]') ||
      (window as any).__VUE__ ||
      /vue\./i.test(html)
    ) {
      stack.push('Vue');
    }

    if ((window as any).jQuery || (window as any).$?.fn?.jquery || /jquery/i.test(html)) {
      stack.push('jQuery');
    }

    if (document.querySelector('[ng-version]') || /angular/i.test(html)) {
      stack.push('Angular');
    }

    if ((window as any).__NEXT_DATA__ || /_next\//i.test(html)) {
      stack.push('Next.js');
    }

    if ((window as any).__NUXT__ || /_nuxt\//i.test(html)) {
      stack.push('Nuxt.js');
    }

    if ((window as any).__SVELTE_HMR || /svelte/i.test(html)) {
      stack.push('Svelte');
    }

    if (/bootstrap/i.test(html)) {
      stack.push('Bootstrap');
    }

    if (/tailwindcss|tailwind/i.test(html)) {
      stack.push('Tailwind');
    }

    if (/wordpress|wp-content/i.test(html)) {
      stack.push('WordPress');
    }

    if (/shopify/i.test(html)) {
      stack.push('Shopify');
    }

    if (stack.length === 0) {
      stack.push('Unknown');
    }

    return stack;
  });
}

export async function scrapeUrl(browser: Browser, url: string): Promise<ScrapedResult> {
  ensureScreenshotsDir();
  const hash = urlToHash(url);
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${hash}.png`);
  const screenshotUrl = `/screenshots/${hash}.png`;

  let page: Page | null = null;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    const title = await page.title();

    const description = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta ? (meta as HTMLMetaElement).content || '' : '';
    });

    const techStack = await detectTechStack(page);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: 'png',
    });

    await page.close();

    return { url, title, description, techStack, screenshotUrl };
  } catch (err) {
    if (page) {
      try { await page.close(); } catch (_) {}
    }
    return {
      url,
      title: '',
      description: '',
      techStack: [],
      screenshotUrl: '',
      error: true,
    };
  }
}
