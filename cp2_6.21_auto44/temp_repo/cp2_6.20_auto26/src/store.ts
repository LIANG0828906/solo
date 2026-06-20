import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Question, Answer, KnowledgeCard, Draft, AppState, AppActions } from './types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    title: '如何高效学习React Hooks？',
    description: '我是一名前端开发者，最近在学习React Hooks，但感觉有些概念难以理解。请问有什么好的学习方法和资源推荐吗？',
    tags: ['React', '前端', 'Hooks'],
    createdAt: '2024-01-15T10:30:00Z',
    status: 'answered'
  },
  {
    id: 'q2',
    title: 'TypeScript中泛型的最佳实践是什么？',
    description: '在大型项目中，如何合理使用TypeScript泛型来提高代码的可维护性和类型安全性？',
    tags: ['TypeScript', '前端', '最佳实践'],
    createdAt: '2024-01-14T15:20:00Z',
    status: 'pending'
  },
  {
    id: 'q3',
    title: 'FastAPI如何实现文件上传？',
    description: '我正在使用FastAPI开发后端服务，需要实现文件上传功能，请问有什么最佳实践吗？',
    tags: ['FastAPI', 'Python', '后端'],
    createdAt: '2024-01-13T09:15:00Z',
    status: 'resolved'
  },
  {
    id: 'q4',
    title: 'CSS Grid和Flexbox应该如何选择？',
    description: '在布局时，什么时候应该使用CSS Grid，什么时候使用Flexbox更合适？',
    tags: ['CSS', '前端', '布局'],
    createdAt: '2024-01-12T14:00:00Z',
    status: 'answered'
  },
  {
    id: 'q5',
    title: '状态管理方案Zustand vs Redux对比',
    description: '想了解Zustand和Redux各自的优缺点，以及在不同场景下应该如何选择。',
    tags: ['React', '状态管理', '前端'],
    createdAt: '2024-01-11T11:45:00Z',
    status: 'pending'
  }
];

const mockAnswers: Record<string, Answer[]> = {
  q1: [
    {
      id: 'a1',
      questionId: 'q1',
      content: '建议从官方文档开始学习，先掌握useState和useEffect这两个最基础的Hook。然后可以通过实际项目来练习，比如做一个Todo List应用。另外，Dan Abramov的博客文章《A Complete Guide to useEffect》非常值得一读。',
      parentId: null,
      upvotes: 42,
      downvotes: 2,
      isBest: true,
      createdAt: '2024-01-15T12:00:00Z',
      replies: [
        {
          id: 'a1-1',
          questionId: 'q1',
          content: '补充一下，useHooks网站有很多实用的自定义Hook示例，可以参考学习。',
          parentId: 'a1',
          upvotes: 15,
          downvotes: 0,
          isBest: false,
          createdAt: '2024-01-15T13:30:00Z'
        }
      ]
    },
    {
      id: 'a2',
      questionId: 'q1',
      content: '我觉得配合视频教程学习效果更好，B站上有很多优质的React Hooks教程。同时建议多写多练，遇到问题多查资料。',
      parentId: null,
      upvotes: 28,
      downvotes: 1,
      isBest: false,
      createdAt: '2024-01-15T14:00:00Z'
    }
  ]
};

const mockCards: KnowledgeCard[] = [
  {
    id: 'c1',
    title: 'React useEffect 完全指南',
    summary: '深入理解useEffect的依赖数组、清理函数和常见陷阱，掌握副作用管理的最佳实践。',
    category: '前端开发',
    tags: ['React', 'Hooks', '副作用'],
    content: '# React useEffect 完全指南\n\n## 基本用法\n\nuseEffect是React中处理副作用的主要Hook。\n\n```javascript\nuseEffect(() => {\n  // 副作用逻辑\n  document.title = `点击了${count}次`;\n  \n  // 清理函数\n  return () => {\n    // 清理逻辑\n  };\n}, [count]); // 依赖数组\n```\n\n## 依赖数组\n\n- 空数组`[]`：只在组件挂载和卸载时执行\n- 有依赖项：依赖项变化时执行\n- 不写依赖数组：每次渲染都执行\n\n## 常见陷阱\n\n1. **忘记依赖**：导致闭包陷阱\n2. **过度依赖**：导致不必要的重渲染\n3. **无限循环**：依赖项在effect内部被修改',
    isFavorited: false,
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'c2',
    title: 'TypeScript 高级类型技巧',
    summary: '掌握条件类型、映射类型、模板字面量类型等高级特性，提升类型编程能力。',
    category: '前端开发',
    tags: ['TypeScript', '类型系统', '高级技巧'],
    content: '# TypeScript 高级类型技巧\n\n## 条件类型\n\n```typescript\ntype IsString<T> = T extends string ? true : false;\n```\n\n## 映射类型\n\n```typescript\ntype Readonly<T> = {\n  readonly [P in keyof T]: T[P];\n};\n```\n\n## 实用工具类型\n\n- `Partial<T>`：所有属性变为可选\n- `Required<T>`：所有属性变为必填\n- `Pick<T, K>`：选取部分属性\n- `Omit<T, K>`：排除部分属性',
    isFavorited: true,
    createdAt: '2024-01-09T14:30:00Z'
  },
  {
    id: 'c3',
    title: 'CSS Flexbox 布局速查',
    summary: 'Flexbox核心属性速查表，包含容器属性和项目属性的详细说明与示例。',
    category: '前端开发',
    tags: ['CSS', 'Flexbox', '布局'],
    content: '# CSS Flexbox 布局速查\n\n## 容器属性\n\n| 属性 | 说明 |\n|------|------|\n| display: flex | 启用弹性布局 |\n| flex-direction | 主轴方向 |\n| justify-content | 主轴对齐方式 |\n| align-items | 交叉轴对齐方式 |\n\n## 项目属性\n\n- `flex-grow`：放大比例\n- `flex-shrink`：缩小比例\n- `flex-basis`：初始大小\n- `align-self`：单独对齐',
    isFavorited: false,
    createdAt: '2024-01-08T09:20:00Z'
  },
  {
    id: 'c4',
    title: 'FastAPI 性能优化指南',
    summary: '从数据库查询、异步处理到缓存策略，全面提升FastAPI应用性能。',
    category: '后端开发',
    tags: ['FastAPI', 'Python', '性能优化'],
    content: '# FastAPI 性能优化指南\n\n## 异步编程\n\n```python\n@app.get("/items/")\nasync def read_items():\n    result = await some_async_operation()\n    return result\n```\n\n## 数据库优化\n\n1. 使用连接池\n2. 添加适当的索引\n3. 使用select_related和prefetch_related\n\n## 缓存策略\n\n- Redis缓存热点数据\n- HTTP缓存头设置',
    isFavorited: false,
    createdAt: '2024-01-07T16:45:00Z'
  },
  {
    id: 'c5',
    title: 'Git 分支管理策略',
    summary: '介绍Git Flow、GitHub Flow等主流分支管理策略，帮助团队协作更高效。',
    category: '开发工具',
    tags: ['Git', '版本控制', '团队协作'],
    content: '# Git 分支管理策略\n\n## Git Flow\n\n- main/master：生产分支\n- develop：开发分支\n- feature/*：功能分支\n- release/*：发布分支\n- hotfix/*：热修复分支\n\n## GitHub Flow\n\n1. 从main创建分支\n2. 提交更改\n3. 创建Pull Request\n4. 代码审查\n5. 合并到main\n6. 部署',
    isFavorited: true,
    createdAt: '2024-01-06T11:10:00Z'
  },
  {
    id: 'c6',
    title: 'JavaScript 异步编程模式',
    summary: '从回调到Promise到async/await，全面了解JavaScript异步编程的演进。',
    category: '前端开发',
    tags: ['JavaScript', '异步', 'Promise'],
    content: '# JavaScript 异步编程模式\n\n## Promise\n\n```javascript\nconst promise = new Promise((resolve, reject) => {\n  setTimeout(() => resolve("完成"), 1000);\n});\n```\n\n## async/await\n\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}\n```',
    isFavorited: false,
    createdAt: '2024-01-05T13:25:00Z'
  }
];

const DRAFT_KEY = 'knowledge_community_draft';
const FAVORITES_KEY = 'knowledge_community_favorites';

type Store = AppState & AppActions;

export const useStore = create<Store>((set, get) => ({
  questions: mockQuestions,
  answers: mockAnswers,
  cards: mockCards,
  draft: null,
  favorites: JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'),

  addQuestion: (question: Question) => {
    set(state => ({
      questions: [question, ...state.questions]
    }));
  },

  getQuestion: (id: string) => {
    return get().questions.find(q => q.id === id);
  },

  getSimilarQuestions: (tags: string[]) => {
    if (tags.length === 0) return [];
    return get().questions
      .map(q => ({
        question: q,
        matchCount: q.tags.filter(t => tags.includes(t)).length
      }))
      .filter(q => q.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5)
      .map(q => q.question);
  },

  addAnswer: (questionId: string, answer: Answer) => {
    set(state => {
      const existingAnswers = state.answers[questionId] || [];
      let newAnswers: Answer[];
      
      if (answer.parentId) {
        newAnswers = existingAnswers.map(a => {
          if (a.id === answer.parentId) {
            return {
              ...a,
              replies: [...(a.replies || []), answer]
            };
          }
          return a;
        });
      } else {
        newAnswers = [...existingAnswers, answer];
      }
      
      return {
        answers: {
          ...state.answers,
          [questionId]: newAnswers
        }
      };
    });
  },

  getAnswers: (questionId: string) => {
    return get().answers[questionId] || [];
  },

  voteAnswer: (questionId: string, answerId: string, type: 'up' | 'down') => {
    set(state => {
      const answers = state.answers[questionId] || [];
      
      const updateAnswerVotes = (ans: Answer): Answer => {
        if (ans.id === answerId) {
          return {
            ...ans,
            upvotes: type === 'up' ? ans.upvotes + 1 : ans.upvotes,
            downvotes: type === 'down' ? ans.downvotes + 1 : ans.downvotes
          };
        }
        if (ans.replies) {
          return {
            ...ans,
            replies: ans.replies.map(updateAnswerVotes)
          };
        }
        return ans;
      };
      
      return {
        answers: {
          ...state.answers,
          [questionId]: answers.map(updateAnswerVotes)
        }
      };
    });
  },

  setBestAnswer: (questionId: string, answerId: string) => {
    set(state => {
      const answers = state.answers[questionId] || [];
      
      const updateBestAnswer = (ans: Answer): Answer => {
        if (ans.id === answerId) {
          return { ...ans, isBest: true };
        }
        if (ans.replies) {
          return {
            ...ans,
            isBest: false,
            replies: ans.replies.map(updateBestAnswer)
          };
        }
        return { ...ans, isBest: false };
      };
      
      return {
        answers: {
          ...state.answers,
          [questionId]: answers.map(updateBestAnswer)
        },
        questions: state.questions.map(q => 
          q.id === questionId ? { ...q, status: 'resolved' as const } : q
        )
      };
    });
  },

  addCard: (card: KnowledgeCard) => {
    set(state => ({
      cards: [card, ...state.cards]
    }));
  },

  toggleFavorite: (cardId: string) => {
    set(state => {
      const favorites = state.favorites.includes(cardId)
        ? state.favorites.filter(id => id !== cardId)
        : [...state.favorites, cardId];
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      
      return {
        favorites,
        cards: state.cards.map(c => 
          c.id === cardId ? { ...c, isFavorited: !c.isFavorited } : c
        )
      };
    });
  },

  saveDraft: (draft: Draft) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    set({ draft });
  },

  loadDraft: () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const draft = JSON.parse(saved) as Draft;
      set({ draft });
      return draft;
    }
    return null;
  },

  clearDraft: () => {
    localStorage.removeItem(DRAFT_KEY);
    set({ draft: null });
  }
}));

export const generateId = () => uuidv4();
