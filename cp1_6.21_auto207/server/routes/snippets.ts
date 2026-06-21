import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Snippet, CreateSnippetRequest, SnippetQuery } from '../../src/types';

const router = Router();

export let snippets: Snippet[] = [
  {
    id: uuidv4(),
    title: 'React 18 新特性概览',
    tags: ['React', '前端', '技术'],
    sourceUrl: 'https://example.com/react-18',
    contentType: 'text',
    html: '<div style="font-family: system-ui;"><h3 style="color: #1D4ED8;">React 18 核心新特性</h3><p><strong>并发渲染：</strong>React 18 引入了并发特性，使 React 能够同时准备多个版本的 UI。</p><p><strong>自动批处理：</strong>所有的状态更新都会自动批处理，无论它们发生在哪里。</p><ul><li>useId - 用于生成唯一 ID</li><li>useTransition - 标记非紧急更新</li><li>useDeferredValue - 延迟更新某些值</li></ul></div>',
    plainText: 'React 18 核心新特性 并发渲染：React 18 引入了并发特性，使 React 能够同时准备多个版本的 UI。 自动批处理：所有的状态更新都会自动批处理，无论它们发生在哪里。 useId - 用于生成唯一 ID useTransition - 标记非紧急更新 useDeferredValue - 延迟更新某些值',
    createdAt: Date.now() - 3 * 60 * 1000,
  },
  {
    id: uuidv4(),
    title: '产品设计灵感图',
    tags: ['设计', '灵感'],
    sourceUrl: 'https://example.com/design',
    contentType: 'image',
    html: '<div style="text-align: center;"><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop" alt="设计灵感" style="width: 100%; border-radius: 8px;" /><p style="color: #6B7280; font-size: 14px; margin-top: 8px;">几何渐变设计灵感</p></div>',
    plainText: '几何渐变设计灵感',
    createdAt: Date.now() - 30 * 60 * 1000,
  },
  {
    id: uuidv4(),
    title: '2024 年度报告数据',
    tags: ['数据', '报告', '2024'],
    sourceUrl: 'https://example.com/report-2024',
    contentType: 'mixed',
    html: '<div style="font-family: system-ui;"><h4 style="color: #8B5CF6;">2024 核心数据</h4><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop" alt="数据图表" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" /><table style="width: 100%; border-collapse: collapse; font-size: 14px;"><thead><tr style="background: #E0E7FF;"><th style="padding: 8px; border: 1px solid #D1D5DB; text-align: left;">季度</th><th style="padding: 8px; border: 1px solid #D1D5DB; text-align: left;">营收</th><th style="padding: 8px; border: 1px solid #D1D5DB; text-align: left;">增长</th></tr></thead><tbody><tr><td style="padding: 8px; border: 1px solid #D1D5DB;">Q1</td><td style="padding: 8px; border: 1px solid #D1D5DB;">￥1.2M</td><td style="padding: 8px; border: 1px solid #D1D5DB; color: #10B981;">+15%</td></tr><tr><td style="padding: 8px; border: 1px solid #D1D5DB;">Q2</td><td style="padding: 8px; border: 1px solid #D1D5DB;">￥1.5M</td><td style="padding: 8px; border: 1px solid #D1D5DB; color: #10B981;">+25%</td></tr></tbody></table></div>',
    plainText: '2024 核心数据 季度 营收 增长 Q1 ￥1.2M +15% Q2 ￥1.5M +25%',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: uuidv4(),
    title: 'TypeScript 高级类型技巧',
    tags: ['TypeScript', '前端'],
    sourceUrl: 'https://example.com/ts-tips',
    contentType: 'text',
    html: '<div style="font-family: system-ui; line-height: 1.6;"><h4 style="color: #1D4ED8; margin-bottom: 12px;">TypeScript 类型体操</h4><p>掌握以下高级类型，可以写出更健壮的类型定义：</p><pre style="background: #F3F4F6; padding: 12px; border-radius: 8px; font-size: 13px; overflow-x: auto;"><code>// 条件类型<br/>type IsString<T> = T extends string ? true : false;<br/><br/>// 映射类型<br/>type Readonly<T> = { readonly [P in keyof T]: T[P] };<br/><br/>// 模板字面量类型<br/>type Greeting<T extends string> = `Hello, ${T}!`;</code></pre></div>',
    plainText: 'TypeScript 类型体操 掌握以下高级类型，可以写出更健壮的类型定义： 条件类型 映射类型 模板字面量类型',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
];

const extractTextFromHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

router.get('/', (req: Request<{}, {}, {}, SnippetQuery>, res: Response) => {
  try {
    let result = [...snippets];
    const { search, tags, sort } = req.query;

    if (search && typeof search === 'string') {
      const keyword = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.plainText.toLowerCase().includes(keyword)
      );
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      result = result.filter((s) =>
        tagList.every((t) => s.tags.includes(t))
      );
    }

    switch (sort) {
      case 'createdAt_asc':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'createdAt_desc':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json(result);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req: Request<{}, {}, CreateSnippetRequest>, res: Response) => {
  try {
    const { title, tags, sourceUrl, contentType, html } = req.body;

    if (!title || !html) {
      res.status(400).json({ error: '标题和内容不能为空' });
      return;
    }

    const plainText = req.body.plainText || extractTextFromHtml(html);

    const snippet: Snippet = {
      id: uuidv4(),
      title: String(title).slice(0, 50),
      tags: Array.isArray(tags) ? tags.filter((t) => t.trim()) : [],
      sourceUrl: sourceUrl || '',
      contentType,
      html,
      plainText,
      createdAt: Date.now(),
    };

    snippets.unshift(snippet);
    res.status(201).json(snippet);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const snippet = snippets.find((s) => s.id === req.params.id);
  if (!snippet) {
    res.status(404).json({ error: '片段不存在' });
    return;
  }
  res.json(snippet);
});

router.put('/:id', (req: Request<{ id: string }, {}, Partial<CreateSnippetRequest>>, res: Response) => {
  const idx = snippets.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '片段不存在' });
    return;
  }

  const { title, tags, contentType, html } = req.body;

  if (title !== undefined) snippets[idx].title = String(title).slice(0, 50);
  if (tags !== undefined) snippets[idx].tags = Array.isArray(tags) ? tags : [];
  if (contentType !== undefined) snippets[idx].contentType = contentType;
  if (html !== undefined) {
    snippets[idx].html = html;
    snippets[idx].plainText = extractTextFromHtml(html);
  }

  res.json(snippets[idx]);
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const idx = snippets.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '片段不存在' });
    return;
  }

  snippets.splice(idx, 1);
  res.status(204).send();
});

export default router;
