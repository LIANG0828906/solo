import type { InspirationCard, PublicCardData, Comment } from '../src/types';

const ANONYMOUS_COLORS = [
  '#e94560',
  '#0f3460',
  '#533483',
  '#16c79a',
  '#e1d5c9',
  '#f9b208',
  '#1a1a40',
  '#9ba3ec',
  '#f98404',
  '#00b4d8',
];

export function getAnonymousColor(index: number): string {
  return ANONYMOUS_COLORS[index % ANONYMOUS_COLORS.length];
}

export function calculateAverageRating(ratings: { score: number }[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / ratings.length) * 100) / 100;
}

export function toPublicCardData(card: InspirationCard, clientIp?: string): PublicCardData {
  const hasRated = clientIp ? card.ratings.some((r) => r.ip === clientIp) : false;
  const visibleComments = card.comments.slice(-50).reverse();

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    imageUrl: card.imageUrl,
    averageRating: calculateAverageRating(card.ratings),
    ratingCount: card.ratings.length,
    commentCount: card.comments.length,
    createdAt: card.createdAt,
    comments: visibleComments,
    hasRated,
  };
}

export function getAllPublicCards(cards: InspirationCard[], clientIp?: string): PublicCardData[] {
  return cards.map((card) => toPublicCardData(card, clientIp));
}

export function createAnonymousComment(content: string, totalComments: number): Omit<Comment, 'id' | 'timestamp'> {
  const anonymousId = totalComments + 1;
  return {
    content,
    anonymousId,
    color: getAnonymousColor(anonymousId),
  };
}

export function validateTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: '标题不能为空' };
  if (trimmed.length > 50) return { valid: false, error: '标题最多50个字符' };
  return { valid: true };
}

export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (description.length > 200) return { valid: false, error: '描述最多200个字符' };
  return { valid: true };
}

export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  if (!url) return { valid: true };
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: '仅支持HTTP/HTTPS协议的图片URL' };
    }
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const pathname = parsed.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) => pathname.endsWith(ext));
    const hasQueryString = parsed.search.length > 0;
    if (!hasValidExtension && !hasQueryString) {
      return { valid: false, error: '图片格式不支持，请使用常见图片格式URL' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: '图片URL格式无效' };
  }
}

export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }
  if (req.ip) return req.ip;
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  return 'unknown';
}

export function getClientIpFromWs(ws: {
  _socket?: { remoteAddress?: string };
  upgradeReq?: {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
  };
}): string {
  if (ws.upgradeReq) {
    return getClientIp(ws.upgradeReq);
  }
  if (ws._socket?.remoteAddress) {
    return ws._socket.remoteAddress;
  }
  return 'unknown';
}
