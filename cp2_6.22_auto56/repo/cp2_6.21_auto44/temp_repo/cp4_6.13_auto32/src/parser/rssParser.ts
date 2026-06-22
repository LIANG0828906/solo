import Parser from 'rss-parser';
import { ParsedFeed } from '../types';
import { sanitizeHtml } from '../utils/htmlSanitizer';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1'
  }
});

const PROXY_URLS = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchWithFallback(url: string): Promise<string> {
  for (const getProxyUrl of PROXY_URLS) {
    try {
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    } catch (e) {
      console.warn('Proxy failed, trying next...', e);
    }
  }
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (e) {
    console.warn('Direct fetch failed:', e);
    throw e;
  }
}

function extractContent(item: Parser.Item): string {
  const content = 
    item['content:encoded'] || 
    item.content || 
    item.summary || 
    item.description || 
    '';
  
  if (typeof content === 'string') {
    return sanitizeHtml(content);
  }
  
  if (content && typeof content === 'object' && '$value' in content) {
    return sanitizeHtml(String(content['$value']));
  }
  
  return '';
}

function extractAuthor(item: Parser.Item): string {
  if (item.creator) return String(item.creator);
  if (item.author) return String(item.author);
  if (item['dc:creator']) return String(item['dc:creator']);
  return '';
}

function extractPubDate(item: Parser.Item): string {
  const pubDate = item.pubDate || item.isoDate || item.date;
  if (!pubDate) return new Date().toISOString();
  
  try {
    const date = new Date(pubDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.warn('Date parse error:', pubDate);
  }
  
  return new Date().toISOString();
}

export async function parseRssFeed(url: string): Promise<ParsedFeed> {
  const startTime = performance.now();
  
  try {
    const xmlText = await fetchWithFallback(url);
    const feed = await parser.parseString(xmlText);
    
    const articles = feed.items.map((item) => ({
      title: item.title || '无标题',
      link: item.link || '',
      author: extractAuthor(item),
      pubDate: extractPubDate(item),
      content: extractContent(item)
    }));
    
    const elapsed = performance.now() - startTime;
    console.debug(`RSS parsed ${articles.length} articles in ${elapsed.toFixed(0)}ms`);
    
    if (elapsed > 300) {
      console.warn(`RSS parsing exceeded 300ms: ${elapsed.toFixed(0)}ms`);
    }
    
    return {
      title: feed.title || url,
      articles
    };
  } catch (error) {
    console.error('RSS parse error:', error);
    throw new Error('无效地址或网络错误');
  }
}
