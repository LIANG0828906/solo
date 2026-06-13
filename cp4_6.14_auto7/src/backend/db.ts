import { v4 as uuidv4 } from 'uuid';

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

class Database {
  private snippets: Map<string, CodeSnippet> = new Map();
  private shortLinkMap: Map<string, string> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const seedSnippets: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'JavaScript 防抖函数',
        description: '一个实用的防抖函数，用于限制函数执行频率',
        code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
        language: 'JavaScript',
        tags: ['JavaScript', '工具函数'],
        favorites: 42,
      },
      {
        title: 'Python 快速排序',
        description: '经典的快速排序算法实现',
        code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
        language: 'Python',
        tags: ['Python', '算法'],
        favorites: 28,
      },
      {
        title: 'React useHook 示例',
        description: '常用的自定义 Hook 集合',
        code: `import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  return [storedValue, setValue];
}`,
        language: 'JavaScript',
        tags: ['React', 'JavaScript', 'Hook'],
        favorites: 56,
      },
      {
        title: 'TypeScript 泛型工具类型',
        description: '常用的 TypeScript 泛型工具类型',
        code: `type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Record<K extends keyof any, T> = {
  [P in K]: T;
};`,
        language: 'TypeScript',
        tags: ['TypeScript', '泛型'],
        favorites: 35,
      },
      {
        title: 'CSS Flexbox 布局',
        description: 'Flexbox 布局常用属性汇总',
        code: `.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.flex-item {
  flex: 1 1 auto;
  min-width: 200px;
}`,
        language: 'CSS',
        tags: ['CSS', '布局'],
        favorites: 48,
      },
      {
        title: 'Node.js Express 中间件',
        description: '自定义 Express 中间件示例',
        code: `const express = require('express');
const app = express();

function loggerMiddleware(req, res, next) {
  console.log(\`[\${new Date().toISOString()}]\` +
    \` \${req.method} \${req.url}\`);
  next();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      error: '未授权'
    });
  }
  next();
}

app.use(loggerMiddleware);
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: '受保护的内容' });
});`,
        language: 'JavaScript',
        tags: ['Node.js', 'Express', '后端'],
        favorites: 32,
      },
      {
        title: 'Go 并发编程',
        description: 'Go 语言 goroutine 和 channel 示例',
        code: `package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("worker %d processing job %d\\n", id, j)
        time.Sleep(time.Second)
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)

    for a := 1; a <= 9; a++ {
        <-results
    }
}`,
        language: 'Go',
        tags: ['Go', '并发'],
        favorites: 19,
      },
      {
        title: 'SQL 查询优化技巧',
        description: '常用的 SQL 查询优化方法',
        code: `-- 使用索引
CREATE INDEX idx_user_email ON users(email);

-- 避免 SELECT *
SELECT id, name, email FROM users WHERE status = 'active';

-- 使用 JOIN 代替子查询
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2024-01-01';

-- 分页优化
SELECT * FROM orders
WHERE id > last_id
ORDER BY id
LIMIT 20;`,
        language: 'SQL',
        tags: ['SQL', '数据库', '优化'],
        favorites: 27,
      },
      {
        title: 'Vue 3 Composition API',
        description: 'Vue 3 Composition API 使用示例',
        code: `import { ref, computed, onMounted } from 'vue';

export default {
  name: 'TodoList',
  setup() {
    const todos = ref([]);
    const newTodo = ref('');

    const completedCount = computed(() => {
      return todos.value.filter(t => t.completed).length;
    });

    function addTodo() {
      if (newTodo.value.trim()) {
        todos.value.push({
          id: Date.now(),
          text: newTodo.value,
          completed: false
        });
        newTodo.value = '';
      }
    }

    onMounted(() => {
      console.log('组件已挂载');
    });

    return {
      todos,
      newTodo,
      completedCount,
      addTodo
    };
  }
};`,
        language: 'JavaScript',
        tags: ['Vue', 'JavaScript', '前端'],
        favorites: 41,
      },
      {
        title: 'Rust 所有权系统',
        description: 'Rust 所有权与借用示例',
        code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1;

    println!("{}, world!", s1);

    let s3 = String::from("hello");
    let len = calculate_length(&s3);

    println!("长度: {}", len);

    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

fn change(s: &mut String) {
    s.push_str(", world");
}`,
        language: 'Rust',
        tags: ['Rust', '所有权'],
        favorites: 15,
      },
      {
        title: 'Docker Compose 配置',
        description: '常用的 Docker Compose 配置模板',
        code: `version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pg_data:`,
        language: 'YAML',
        tags: ['Docker', 'DevOps'],
        favorites: 38,
      },
      {
        title: 'Git 常用命令',
        description: '日常开发中常用的 Git 命令',
        code: `# 创建新分支并切换
git checkout -b feature/new-feature

# 暂存所有改动
git add .

# 提交改动
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin feature/new-feature

# 拉取最新代码
git pull origin main

# 合并分支
git merge feature/new-feature

# 查看提交历史
git log --oneline --graph --all

# 撤销工作区改动
git checkout -- .

# 储藏改动
git stash
git stash pop`,
        language: 'Shell',
        tags: ['Git', '工具'],
        favorites: 52,
      },
      {
        title: 'Java 8 Stream API',
        description: 'Java 8 Stream API 常用操作',
        code: `import java.util.*;
import java.util.stream.*;

public class StreamExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        int sum = numbers.stream()
            .filter(n -> n % 2 == 0)
            .mapToInt(Integer::intValue)
            .sum();

        List<String> names = Arrays.asList("alice", "bob", "charlie");
        List<String> upperNames = names.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());

        Optional<Integer> max = numbers.stream()
            .reduce(Integer::max);

        System.out.println("Sum: " + sum);
        System.out.println("Names: " + upperNames);
    }
}`,
        language: 'Java',
        tags: ['Java', 'Stream'],
        favorites: 23,
      },
      {
        title: 'PHP Laravel 查询构造器',
        description: 'Laravel 查询构造器使用示例',
        code: `<?php

use Illuminate\\Support\\Facades\\DB;

$users = DB::table('users')
    ->where('status', '=', 'active')
    ->whereNotNull('email_verified_at')
    ->orderBy('created_at', 'desc')
    ->paginate(15);

$count = DB::table('orders')
    ->where('user_id', auth()->id())
    ->count();

$avgPrice = DB::table('products')
    ->where('category', 'electronics')
    ->avg('price');

DB::table('users')
    ->where('id', 1)
    ->update(['name' => 'New Name']);

$user = DB::table('users')
    ->select('users.*', 'profiles.bio')
    ->join('profiles', 'users.id', '=', 'profiles.user_id')
    ->where('users.id', 1)
    ->first();`,
        language: 'PHP',
        tags: ['PHP', 'Laravel', '数据库'],
        favorites: 18,
      },
    ];

    seedSnippets.forEach((snippet) => {
      const id = uuidv4();
      const now = new Date();
      this.snippets.set(id, {
        ...snippet,
        id,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  getAll(page: number = 1, pageSize: number = 12): PaginationResult<CodeSnippet> {
    const allSnippets = Array.from(this.snippets.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = allSnippets.slice(start, end);

    return {
      items,
      total: allSnippets.length,
      page,
      pageSize,
      hasMore: end < allSnippets.length,
    };
  }

  getById(id: string): CodeSnippet | undefined {
    return this.snippets.get(id);
  }

  create(data: {
    title: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
  }): CodeSnippet {
    const id = uuidv4();
    const now = new Date();
    const snippet: CodeSnippet = {
      id,
      title: data.title,
      description: data.description,
      code: data.code,
      language: data.language,
      tags: data.tags,
      favorites: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.snippets.set(id, snippet);
    return snippet;
  }

  update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      code: string;
      language: string;
      tags: string[];
    }>
  ): CodeSnippet | undefined {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;

    const updated: CodeSnippet = {
      ...snippet,
      ...data,
      updatedAt: new Date(),
    };
    this.snippets.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.snippets.delete(id);
  }

  toggleFavorite(id: string): { snippet: CodeSnippet; favorited: boolean } | undefined {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;

    snippet.favorites = snippet.favorites + 1;
    snippet.updatedAt = new Date();
    this.snippets.set(id, snippet);

    return { snippet, favorited: true };
  }

  search(
    keyword: string = '',
    tags: string[] = [],
    page: number = 1,
    pageSize: number = 12
  ): PaginationResult<CodeSnippet> {
    const keywordLower = keyword.toLowerCase();

    let filtered = Array.from(this.snippets.values()).filter((snippet) => {
      const matchesKeyword =
        !keywordLower ||
        snippet.title.toLowerCase().includes(keywordLower) ||
        snippet.description.toLowerCase().includes(keywordLower);

      const matchesTags =
        tags.length === 0 || tags.some((tag) => snippet.tags.includes(tag));

      return matchesKeyword && matchesTags;
    });

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      hasMore: end < filtered.length,
    };
  }

  getAvailableTags(): string[] {
    const tagSet = new Set<string>();
    this.snippets.forEach((snippet) => {
      snippet.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  generateShortLink(snippetId: string): string | undefined {
    if (!this.snippets.has(snippetId)) return undefined;

    const shortCode = Buffer.from(snippetId).toString('base64url').slice(0, 12);
    this.shortLinkMap.set(shortCode, snippetId);
    return shortCode;
  }

  getSnippetByShortCode(shortCode: string): CodeSnippet | undefined {
    const snippetId = this.shortLinkMap.get(shortCode);
    if (!snippetId) return undefined;
    return this.snippets.get(snippetId);
  }
}

const db = new Database();
export default db;
