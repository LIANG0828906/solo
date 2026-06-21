import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractTitle, extractDescription, extractSummary, extractKeywordsMeta } from '../utils/scraper';
import { generateTags } from '../utils/tagGenerator';
import { buildFaviconUrl, parseDomain, isValidUrl } from '../utils/helpers';

export const fetchRouter = Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

fetchRouter.post('/fetch', async (req: Request, res: Response) => {
  const timestamp = Date.now();
  try {
    const { url } = req.body as { url?: string };

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_URL', message: 'URL 格式非法，请输入有效的 http/https 链接' },
        timestamp
      });
    }

    const targetUrl = url!.trim();
    let html = '';

    try {
      const response = await axios.get(targetUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        maxRedirects: 5,
        responseType: 'arraybuffer',
        transformResponse: [
          (data) => {
            const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
            let enc = 'utf-8';
            const head = buf.slice(0, 1024).toString('ascii').toLowerCase();
            const m = head.match(/charset=["']?([a-z0-9_-]+)/i);
            if (m) enc = m[1];
            try {
              return buf.toString(enc as BufferEncoding);
            } catch {
              return buf.toString('utf-8');
            }
          }
        ]
      });
      html = response.data as string;
    } catch (err: any) {
      const code = err.code === 'ECONNABORTED' ? 'FETCH_TIMEOUT' : 'INVALID_URL';
      const msg = err.code === 'ECONNABORTED' ? '抓取超时（超过5秒）' : '无法访问该URL';
      const domain = parseDomain(targetUrl);
      return res.status(200).json({
        success: true,
        data: {
          url: targetUrl,
          domain,
          favicon: buildFaviconUrl(targetUrl),
          title: domain || '未知标题',
          description: '',
          summary: msg + '，但资源已记录',
          tags: [domain ? domain.split('.')[0] : '未分类', '待处理'].filter(Boolean).slice(0, 3)
        },
        timestamp
      });
    }

    if (!html || html.length < 50) {
      const domain = parseDomain(targetUrl);
      return res.status(200).json({
        success: true,
        data: {
          url: targetUrl,
          domain,
          favicon: buildFaviconUrl(targetUrl),
          title: domain || '未知标题',
          description: '',
          summary: '页面内容为空或无法解析',
          tags: [domain ? domain.split('.')[0] : '未分类'].filter(Boolean).slice(0, 3)
        },
        timestamp
      });
    }

    const $ = cheerio.load(html);
    const title = extractTitle($) || parseDomain(targetUrl) || '未知标题';
    const description = extractDescription($);
    const summary = extractSummary($, 300) || description || '';

    let tags = extractKeywordsMeta($);
    if (tags.length < 3) {
      tags = generateTags(title, description, summary, 5);
    } else {
      tags = [...tags, ...generateTags(title, description, summary, 3)].slice(0, 5);
    }

    const domain = parseDomain(targetUrl);
    if (domain && !tags.some(t => t.toLowerCase().includes(domain.split('.')[0].toLowerCase())) && tags.length < 5) {
      const domainTag = domain.split('.')[0];
      if (domainTag.length >= 2) tags.push(domainTag.charAt(0).toUpperCase() + domainTag.slice(1));
    }

    return res.status(200).json({
      success: true,
      data: {
        url: targetUrl,
        domain,
        favicon: buildFaviconUrl(targetUrl),
        title,
        description,
        summary: summary || description || '暂无摘要信息',
        tags
      },
      timestamp
    });

  } catch (err: any) {
    console.error('[FETCH ERROR]', err?.message || err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器内部错误: ' + (err?.message || 'unknown') },
      timestamp
    });
  }
});

fetchRouter.post('/tags', async (req: Request, res: Response) => {
  const timestamp = Date.now();
  try {
    const { url, tags } = req.body as { url?: string; tags?: string[] };
    if (!url || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '缺少必要参数 url 或 tags' },
        timestamp
      });
    }
    return res.status(200).json({ success: true, data: { received: true }, timestamp });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err?.message || 'unknown' },
      timestamp
    });
  }
});

fetchRouter.post('/screenshot', async (req: Request, res: Response) => {
  const timestamp = Date.now();
  try {
    const { url } = req.body as { url?: string };
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_URL', message: '无效的URL' },
        timestamp
      });
    }
    const domain = parseDomain(url!);
    const screenshotUrl = `https://image.thum.io/get/width/800/crop/1200/https://${domain}/`;
    return res.status(200).json({
      success: true,
      data: { screenshotUrl, url },
      timestamp
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err?.message || 'unknown' },
      timestamp
    });
  }
});
