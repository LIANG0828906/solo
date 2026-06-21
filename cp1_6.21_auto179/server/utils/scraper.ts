import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export function extractTitle($: CheerioAPI): string {
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) return ogTitle.trim();
  const title = $('title').text();
  return title ? title.trim() : '';
}

export function extractDescription($: CheerioAPI): string {
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) return ogDesc.trim();
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) return metaDesc.trim();
  const twitterDesc = $('meta[name="twitter:description"]').attr('content');
  return twitterDesc ? twitterDesc.trim() : '';
}

export function extractSummary($: CheerioAPI, maxLen = 300): string {
  $('script, style, nav, footer, header, aside, noscript, iframe').remove();
  const pTexts: string[] = [];
  $('article p, main p, section p, p').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length >= 20) pTexts.push(t);
  });
  if (pTexts.length === 0) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    return truncate(bodyText, maxLen);
  }
  let combined = pTexts.join(' ').replace(/\s+/g, ' ').trim();
  return truncate(combined, maxLen);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).replace(/\s[^\s]*$/, '') + '...';
}

export function extractKeywordsMeta($: CheerioAPI): string[] {
  const kw = $('meta[name="keywords"]').attr('content');
  if (!kw) return [];
  return kw.split(/[,，]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
}
