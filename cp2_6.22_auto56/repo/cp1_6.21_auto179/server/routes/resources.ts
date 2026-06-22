import { Router, Request, Response } from 'express';
import { generateId } from '../utils/helpers';

export interface Resource {
  id: string;
  url: string;
  domain: string;
  favicon: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  screenshotUrl?: string;
  notes?: string;
  createdAt: number;
}

export const resourcesRouter = Router();

const store: Resource[] = [];
const searchCache = new Map<string, { data: Resource[]; expire: number }>();
const CACHE_TTL = 10000;

resourcesRouter.get('/resources', (_req: Request, res: Response) => {
  const timestamp = Date.now();
  const sorted = [...store].sort((a, b) => b.createdAt - a.createdAt);
  return res.status(200).json({ success: true, data: sorted, timestamp });
});

resourcesRouter.post('/resources', (req: Request, res: Response) => {
  const timestamp = Date.now();
  try {
    const body = req.body as Partial<Resource>;
    if (!body.url || !body.title) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '缺少必填字段 url 或 title' },
        timestamp
      });
    }
    const exists = store.find(r => r.url === body.url);
    if (exists) {
      return res.status(200).json({ success: true, data: exists, timestamp });
    }
    const resource: Resource = {
      id: generateId(),
      url: body.url!,
      domain: body.domain || '',
      favicon: body.favicon || '',
      title: body.title!,
      description: body.description || '',
      summary: body.summary || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      screenshotUrl: body.screenshotUrl,
      notes: body.notes || '',
      createdAt: timestamp
    };
    store.unshift(resource);
    searchCache.clear();
    return res.status(201).json({ success: true, data: resource, timestamp });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err?.message || 'unknown' },
      timestamp
    });
  }
});

resourcesRouter.get('/search', (req: Request, res: Response) => {
  const timestamp = Date.now();
  try {
    const searchTerm = String(req.query.searchTerm || req.query.term || '').trim();
    const filterTagsRaw = req.query.filterTags || req.query.tags;
    const filterTags: string[] = Array.isArray(filterTagsRaw)
      ? filterTagsRaw.map(String)
      : typeof filterTagsRaw === 'string'
        ? filterTagsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const cacheKey = `${searchTerm}::${filterTags.sort().join('|')}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expire > timestamp) {
      return res.status(200).json({ success: true, data: cached.data, timestamp, cached: true });
    }

    const termLower = searchTerm.toLowerCase();
    let results = [...store];

    if (filterTags.length > 0) {
      const tagSet = new Set(filterTags.map(t => t.toLowerCase()));
      results = results.filter(r => {
        const rTags = new Set(r.tags.map(t => t.toLowerCase()));
        for (const t of tagSet) if (!rTags.has(t)) return false;
        return true;
      });
    }

    if (termLower) {
      results = results.filter(r =>
        r.title.toLowerCase().includes(termLower) ||
        r.summary.toLowerCase().includes(termLower) ||
        r.description.toLowerCase().includes(termLower) ||
        r.url.toLowerCase().includes(termLower) ||
        r.tags.some(t => t.toLowerCase().includes(termLower))
      );
    }

    results.sort((a, b) => b.createdAt - a.createdAt);
    if (results.length > 500) results = results.slice(0, 500);

    searchCache.set(cacheKey, { data: results, expire: timestamp + CACHE_TTL });
    return res.status(200).json({ success: true, data: results, timestamp });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err?.message || 'unknown' },
      timestamp
    });
  }
});

resourcesRouter.delete('/resources/:id', (req: Request, res: Response) => {
  const timestamp = Date.now();
  const { id } = req.params;
  const idx = store.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'RESOURCE_NOT_FOUND', message: `资源 ${id} 不存在` },
      timestamp
    });
  }
  store.splice(idx, 1);
  searchCache.clear();
  return res.status(200).json({ success: true, data: { deleted: true, id }, timestamp });
});

resourcesRouter.patch('/resources/:id', (req: Request, res: Response) => {
  const timestamp = Date.now();
  const { id } = req.params;
  const updates = req.body as Partial<Resource>;
  const idx = store.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'RESOURCE_NOT_FOUND', message: `资源 ${id} 不存在` },
      timestamp
    });
  }
  store[idx] = { ...store[idx], ...updates, id: store[idx].id, createdAt: store[idx].createdAt };
  searchCache.clear();
  return res.status(200).json({ success: true, data: store[idx], timestamp });
});

resourcesRouter.get('/stats', (_req: Request, res: Response) => {
  const timestamp = Date.now();
  const tagCounts = new Map<string, number>();
  const domainCounts = new Map<string, number>();
  for (const r of store) {
    for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    if (r.domain) domainCounts.set(r.domain, (domainCounts.get(r.domain) || 0) + 1);
  }
  return res.status(200).json({
    success: true,
    data: {
      total: store.length,
      tags: Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50),
      domains: Array.from(domainCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30)
    },
    timestamp
  });
});

export function populateDemoData() {
  const now = Date.now();
  const demos: Array<Partial<Resource> & { url: string; title: string; tags: string[] }> = [
    {
      url: 'https://react.dev',
      domain: 'react.dev',
      favicon: 'https://www.google.com/s2/favicons?domain=react.dev&sz=64',
      title: 'React 官方文档 - 用户界面构建库',
      description: '学习如何使用 React 构建交互式用户界面',
      summary: 'React 是用于构建用户界面的 JavaScript 库。本官方文档涵盖了 React 的基础概念、Hooks、组件设计模式、性能优化以及最新特性如 Server Components 和 Actions 等。',
      tags: ['React', '前端开发', '文档', 'JavaScript'],
      notes: 'Hooks 章节需要重点阅读'
    },
    {
      url: 'https://nodejs.org',
      domain: 'nodejs.org',
      favicon: 'https://www.google.com/s2/favicons?domain=nodejs.org&sz=64',
      title: 'Node.js — 在任何地方运行 JavaScript',
      description: 'Node.js 是一个基于 Chrome V8 的 JavaScript 运行时',
      summary: 'Node.js 是一个开源跨平台的 JavaScript 运行时环境，让开发者能够在服务器端执行 JavaScript 代码。Node.js 采用事件驱动、非阻塞 I/O 模型，轻量高效，非常适合构建数据密集型实时应用。',
      tags: ['NodeJs', '后端', 'JavaScript', '运行时']
    },
    {
      url: 'https://www.typescriptlang.org',
      domain: 'typescriptlang.org',
      favicon: 'https://www.google.com/s2/favicons?domain=typescriptlang.org&sz=64',
      title: 'TypeScript: JavaScript With Syntax For Types',
      description: 'TypeScript 是 JavaScript 的超集，添加了类型系统',
      summary: 'TypeScript 通过为 JavaScript 添加静态类型检查，帮助开发者在编译期捕获错误、增强代码可维护性。支持泛型、接口、枚举、装饰器等高级特性，并可编译为兼容多平台的纯 JavaScript。',
      tags: ['Typescript', '类型系统', '前端']
    },
    {
      url: 'https://vitejs.dev',
      domain: 'vitejs.dev',
      favicon: 'https://www.google.com/s2/favicons?domain=vitejs.dev&sz=64',
      title: 'Vite | 下一代前端构建工具',
      description: 'Vite 提供极速的开发服务器启动和闪电般的 HMR',
      summary: 'Vite 是新一代前端构建工具，利用浏览器原生 ES Modules 支持实现秒级冷启动，内置 Rollup 打包，支持 Vue、React、Svelte 等框架。显著提升开发体验与构建效率。',
      tags: ['Vite', '构建工具', '前端工程']
    },
    {
      url: 'https://developer.mozilla.org',
      domain: 'developer.mozilla.org',
      favicon: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64',
      title: 'MDN Web Docs - Web 开发者资源',
      description: 'Mozilla 官方的 Web 开发权威文档',
      summary: 'MDN Web Docs 是包含 HTML、CSS、JavaScript、Web API 等完整 Web 技术参考的权威文档平台，提供教程、指南、浏览器兼容性表格以及最佳实践推荐。',
      tags: ['文档', 'HTML', 'CSS', 'Web Api', 'Mdn']
    },
    {
      url: 'https://tailwindcss.com',
      domain: 'tailwindcss.com',
      favicon: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64',
      title: 'Tailwind CSS - 实用优先的 CSS 框架',
      description: '快速构建现代网站，无需离开 HTML',
      summary: 'Tailwind CSS 是一个原子化的 CSS 框架，提供丰富的工具类（Utility Classes），让开发者直接在 HTML 中组合样式，大大提升开发速度，并支持 JIT 编译、主题定制、响应式系统。',
      tags: ['Tailwind', 'CSS', '样式框架']
    },
    {
      url: 'https://nextjs.org',
      domain: 'nextjs.org',
      favicon: 'https://www.google.com/s2/favicons?domain=nextjs.org&sz=64',
      title: 'Next.js - React 框架用于生产环境',
      description: 'Vercel 出品的 React 全栈框架',
      summary: 'Next.js 提供服务端渲染、静态生成、增量静态再生、API Routes 等全栈能力。App Router 支持 Server Components 和流式渲染，是构建生产级 React 应用的首选方案。',
      tags: ['Nextjs', 'React', 'SSR', '全栈']
    },
    {
      url: 'https://github.com',
      domain: 'github.com',
      favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
      title: 'GitHub: Let\'s build from here',
      description: '全球最大的代码托管与协作平台',
      summary: 'GitHub 是基于 Git 的代码托管平台，提供仓库管理、Pull Request、Issues、Actions CI/CD、Codespaces、Copilot AI 编程助手等完整的开发协作工具链。',
      tags: ['Github', 'Git', '协作', 'DevOps']
    },
    {
      url: 'https://expressjs.com',
      domain: 'expressjs.com',
      favicon: 'https://www.google.com/s2/favicons?domain=expressjs.com&sz=64',
      title: 'Express - Node.js Web 应用框架',
      description: '极简灵活的 Node.js Web 框架',
      summary: 'Express 是 Node.js 生态中最流行的 Web 框架，提供路由、中间件、模板引擎等基础能力，学习曲线平缓，社区生态丰富，非常适合快速搭建 RESTful API 和 Web 应用。',
      tags: ['Express', '后端', 'NodeJs', '框架']
    },
    {
      url: 'https://cheerio.js.org',
      domain: 'cheerio.js.org',
      favicon: 'https://www.google.com/s2/favicons?domain=cheerio.js.org&sz=64',
      title: 'Cheerio - 快速灵活的 jQuery 式 HTML 解析',
      description: '为服务器设计的轻量 jQuery 实现',
      summary: 'Cheerio 是一个用于 Node.js 的 HTML/XML 解析库，实现了 jQuery 核心 API，适合 Web 爬虫、DOM 操作等场景，性能远超 JSDOM，无需完整浏览器环境。',
      tags: ['Cheerio', '爬虫', '数据抓取', 'NodeJs']
    }
  ];
  demos.forEach((d, i) => {
    store.push({
      id: generateId(),
      url: d.url,
      domain: d.domain || '',
      favicon: d.favicon || '',
      title: d.title,
      description: d.description || '',
      summary: d.summary || '',
      tags: d.tags,
      notes: d.notes,
      createdAt: now - i * 3600_000
    });
  });
}
