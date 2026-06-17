import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { PortfolioItem, BlogPost, Message, AppStats } from '@/types';
import { computeStats } from '@/utils/stats';

const STORAGE_KEYS = {
  portfolio: 'devportfolio_portfolio',
  blog: 'devportfolio_blog',
  messages: 'devportfolio_messages',
  theme: 'devportfolio_theme',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const SEED_PORTFOLIO: PortfolioItem[] = [
  {
    id: uuidv4(),
    title: 'AI Chat Platform',
    description: 'Real-time conversational AI platform with streaming responses and context management.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20AI%20chat%20interface%20dark%20blue%20neon&image_size=landscape_4_3',
    tags: ['AI', 'SaaS', 'Full-Stack'],
    techStack: ['React', 'TypeScript', 'Node.js', 'OpenAI'],
    link: '#',
  },
  {
    id: uuidv4(),
    title: 'Task Manager Pro',
    description: 'Kanban-style task management with drag-and-drop, labels, and team collaboration.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20task%20manager%20app%20kanban%20board%20minimal&image_size=landscape_4_3',
    tags: ['Productivity', 'Collaboration'],
    techStack: ['Vue', 'Node.js', 'MongoDB'],
    link: '#',
  },
  {
    id: uuidv4(),
    title: 'E-Commerce Dashboard',
    description: 'Analytics dashboard for online stores with real-time sales tracking and forecasting.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ecommerce%20analytics%20dashboard%20charts%20graphs%20modern&image_size=landscape_4_3',
    tags: ['Analytics', 'E-Commerce'],
    techStack: ['React', 'D3.js', 'PostgreSQL'],
    link: '#',
  },
  {
    id: uuidv4(),
    title: 'Music Streaming App',
    description: 'Cross-platform music streaming with playlist curation and social features.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20streaming%20app%20player%20interface%20vibrant&image_size=landscape_4_3',
    tags: ['Entertainment', 'Mobile'],
    techStack: ['React Native', 'Firebase'],
    link: '#',
  },
  {
    id: uuidv4(),
    title: 'Weather Forecast',
    description: 'AI-powered weather prediction with beautiful visualizations and location alerts.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weather%20forecast%20app%20gradient%20sky%20clouds&image_size=landscape_4_3',
    tags: ['AI', 'Utility'],
    techStack: ['Python', 'Flask', 'TensorFlow'],
    link: '#',
  },
  {
    id: uuidv4(),
    title: 'Code Editor',
    description: 'Browser-based code editor with syntax highlighting, autocomplete, and live collaboration.',
    thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=code%20editor%20dark%20theme%20syntax%20highlighting%20sleek&image_size=landscape_4_3',
    tags: ['Developer Tools', 'WebAssembly'],
    techStack: ['Rust', 'WebAssembly', 'TypeScript'],
    link: '#',
  },
];

const SEED_BLOG: BlogPost[] = [
  {
    id: uuidv4(),
    title: 'Building Scalable React Applications',
    content: `# Building Scalable React Applications

When building large-scale React applications, **architecture decisions** made early on can have a lasting impact on maintainability and performance.

## Component Architecture

The key to scalability is **component composition**. Break your UI into small, focused components that do one thing well.

\`\`\`tsx
const UserProfile = ({ user }) => (
  <Card>
    <Avatar src={user.avatar} />
    <UserInfo name={user.name} bio={user.bio} />
    <UserStats followers={user.followers} repos={user.repos} />
  </Card>
);
\`\`\`

## State Management

For complex applications, consider using **Zustand** for its simplicity and performance:

- Minimal boilerplate
- No providers needed
- Efficient re-renders with selectors

## Performance Optimization

1. Use **React.memo** for expensive components
2. Implement **virtualization** for long lists
3. Leverage **code splitting** with dynamic imports
4. Profile with React DevTools

> "Premature optimization is the root of all evil — but knowing where to optimize is the root of all performance." — Donald Knuth (adapted)

## Conclusion

Scalability is not just about handling more users — it's about handling more features, more developers, and more complexity without breaking down.`,
    summary: 'Key architectural patterns and best practices for building React apps that scale gracefully.',
    publishedAt: '2026-05-15T10:00:00Z',
    readingTime: 6,
  },
  {
    id: uuidv4(),
    title: 'TypeScript Best Practices for 2026',
    content: `# TypeScript Best Practices for 2026

TypeScript continues to evolve, and with it, the patterns we use to write type-safe code.

## Strict Mode is Non-Negotiable

Always enable \`strict: true\` in your \`tsconfig.json\`. This catches:

- Implicit \`any\` types
- Null/undefined access
- Unreachable code

## Use Discriminated Unions

\`\`\`typescript
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' };
\`\`\`

This pattern eliminates type narrowing issues and makes state management predictable.

## Template Literal Types

Leverage template literal types for string validation:

\`\`\`typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiRoute = \`/api/\${string}\`;
\`\`\`

## Branded Types for Domain Safety

Prevent mixing up similar primitive types:

\`\`\`typescript
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };
\`\`\`

## Conclusion

TypeScript is more than type checking — it's a design tool that shapes how we think about data flow and API boundaries.`,
    summary: 'Modern TypeScript patterns including discriminated unions, branded types, and strict configurations.',
    publishedAt: '2026-04-22T14:30:00Z',
    readingTime: 5,
  },
  {
    id: uuidv4(),
    title: 'WebAssembly: The Future of Web Performance',
    content: `# WebAssembly: The Future of Web Performance

WebAssembly (Wasm) has matured from an experimental technology to a production-ready platform.

## Why WebAssembly Matters

- **Near-native performance**: Run computation-heavy tasks at speeds close to native code
- **Language flexibility**: Compile Rust, C++, Go, and more to run in the browser
- **Security**: Sandboxed execution with memory safety guarantees

## Rust + Wasm: A Perfect Match

Rust's zero-cost abstractions and ownership model make it ideal for WebAssembly:

\`\`\`rust
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    if n <= 1 { return n as u64; }
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let temp = b;
        b = a + b;
        a = temp;
    }
    b
}
\`\`\`

## Real-World Applications

1. **Figma** — GPU-accelerated rendering via Wasm
2. **Photoshop Web** — Full image processing pipeline
3. **Google Earth** — 3D rendering in the browser

## Getting Started

\`\`\`bash
cargo install wasm-pack
wasm-pack new my-wasm-project
wasm-pack build --target web
\`\`\`

## Conclusion

WebAssembly isn't replacing JavaScript — it's **complementing** it. Use JS for UI orchestration and Wasm for performance-critical compute.`,
    summary: 'How WebAssembly is transforming web performance with Rust, real-world use cases, and getting started guides.',
    publishedAt: '2026-03-10T09:00:00Z',
    readingTime: 7,
  },
  {
    id: uuidv4(),
    title: 'Design Systems with Tailwind CSS',
    content: `# Design Systems with Tailwind CSS

Tailwind CSS has revolutionized how we approach styling in modern web applications.

## Why Tailwind for Design Systems?

- **Consistency**: Utility classes enforce design tokens
- **Maintainability**: No unused CSS in production
- **Speed**: Rapid prototyping without context-switching

## Building Your Token System

\`\`\`javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f0ff',
          500: '#6C63FF',
          900: '#1a1666',
        }
      },
      spacing: {
        '18': '4.5rem',
      }
    }
  }
}
\`\`\`

## Component Patterns

Use \`@apply\` sparingly. Prefer composition:

\`\`\`html
<button class="bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg transition-colors">
  Click me
</button>
\`\`\`

## Dark Mode

Tailwind makes dark mode trivial with the \`dark:\` variant:

\`\`\`html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Adapts to theme automatically
</div>
\`\`\`

## Conclusion

A well-crafted Tailwind config becomes the single source of truth for your entire design system.`,
    summary: 'Leveraging Tailwind CSS to build consistent, maintainable design systems with dark mode support.',
    publishedAt: '2026-02-28T16:00:00Z',
    readingTime: 4,
  },
];

const SEED_MESSAGES: Message[] = [
  {
    id: uuidv4(),
    nickname: 'Alice Chen',
    email: 'alice@example.com',
    content: 'Love your portfolio! The AI Chat Platform looks amazing. Would love to collaborate on something similar.',
    createdAt: '2026-05-20T08:30:00Z',
    isRead: true,
  },
  {
    id: uuidv4(),
    nickname: 'Bob Martinez',
    email: 'bob@example.com',
    content: 'Your TypeScript article was incredibly helpful. The discriminated unions pattern is now my go-to!',
    createdAt: '2026-04-25T12:15:00Z',
    isRead: true,
  },
  {
    id: uuidv4(),
    nickname: 'Carol Wang',
    email: 'carol@example.com',
    content: 'Hi! I found your blog through the WebAssembly article. Are you available for consulting work?',
    createdAt: '2026-06-01T18:45:00Z',
    isRead: false,
  },
];

interface AppState {
  portfolio: PortfolioItem[];
  blog: BlogPost[];
  messages: Message[];
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  initialized: boolean;
  stats: AppStats;
  init: () => void;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => void;
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void;
  addMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  portfolio: [],
  blog: [],
  messages: [],
  theme: 'light',
  sidebarOpen: false,
  initialized: false,
  stats: {
    monthlyPosts: [],
    monthlyMessages: [],
    techStackFreq: [],
  },

  init: () => {
    const state = get();
    if (state.initialized) return;
    const portfolio = loadFromStorage<PortfolioItem[]>(STORAGE_KEYS.portfolio, SEED_PORTFOLIO);
    const blog = loadFromStorage<BlogPost[]>(STORAGE_KEYS.blog, SEED_BLOG);
    const messages = loadFromStorage<Message[]>(STORAGE_KEYS.messages, SEED_MESSAGES);
    const theme = loadFromStorage<'light' | 'dark'>(STORAGE_KEYS.theme, 'light');
    const stats = computeStats(blog, messages, portfolio);
    set({ portfolio, blog, messages, theme, initialized: true, stats });
  },

  addPortfolioItem: (item) => {
    const newItem: PortfolioItem = { ...item, id: uuidv4() };
    const { portfolio, blog, messages } = get();
    const next = [...portfolio, newItem];
    set({
      portfolio: next,
      stats: computeStats(blog, messages, next),
    });
    saveToStorage(STORAGE_KEYS.portfolio, next);
  },

  addBlogPost: (post) => {
    const newPost: BlogPost = { ...post, id: uuidv4() };
    const { portfolio, blog, messages } = get();
    const next = [...blog, newPost];
    set({
      blog: next,
      stats: computeStats(next, messages, portfolio),
    });
    saveToStorage(STORAGE_KEYS.blog, next);
  },

  addMessage: (msg) => {
    const newMsg: Message = {
      ...msg,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const { portfolio, blog, messages } = get();
    const next = [...messages, newMsg];
    set({
      messages: next,
      stats: computeStats(blog, next, portfolio),
    });
    saveToStorage(STORAGE_KEYS.messages, next);
  },

  markMessageRead: (id) => {
    const { portfolio, blog, messages } = get();
    const next = messages.map((m) =>
      m.id === id ? { ...m, isRead: true } : m
    );
    set({
      messages: next,
      stats: computeStats(blog, next, portfolio),
    });
    saveToStorage(STORAGE_KEYS.messages, next);
  },

  deleteMessage: (id) => {
    const { portfolio, blog, messages } = get();
    const next = messages.filter((m) => m.id !== id);
    set({
      messages: next,
      stats: computeStats(blog, next, portfolio),
    });
    saveToStorage(STORAGE_KEYS.messages, next);
  },

  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme });
    saveToStorage(STORAGE_KEYS.theme, theme);
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
