import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const languages = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'go', 'rust', 'php', 'ruby', 'swift'
];

const languageColors = {
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  python: '#3776AB',
  java: '#ED8B00',
  cpp: '#00599C',
  go: '#00ADD8',
  rust: '#DEA584',
  php: '#777BB4',
  ruby: '#CC342D',
  swift: '#FA7343'
};

const mockUsers = [
  { id: 'user1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1' },
  { id: 'user2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' },
  { id: 'user3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3' },
  { id: 'current', name: '当前用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current' }
];

const snippets = [
  {
    id: 'snippet1',
    shareCode: 'ABC123',
    title: '快速排序算法',
    code: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log(quickSort(numbers));`,
    language: 'javascript',
    description: '经典的快速排序算法实现，使用递归方式',
    tags: ['算法', '排序', '递归'],
    authorId: 'user1',
    likes: 42,
    likedBy: [],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'snippet2',
    shareCode: 'DEF456',
    title: 'Python 装饰器示例',
    code: `import time
from functools import wraps

def timer_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 执行时间: {end_time - start_time:.4f}秒")
        return result
    return wrapper

@timer_decorator
def slow_function():
    time.sleep(1)
    return "完成"

slow_function()`,
    language: 'python',
    description: '一个实用的计时装饰器，用于测量函数执行时间',
    tags: ['装饰器', '性能', 'Python'],
    authorId: 'user2',
    likes: 28,
    likedBy: [],
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    id: 'snippet3',
    shareCode: 'GHI789',
    title: 'React Hook 自定义',
    code: `import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
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
}

export default useLocalStorage;`,
    language: 'typescript',
    description: '自定义 useLocalStorage Hook，持久化状态到本地存储',
    tags: ['React', 'Hook', 'TypeScript'],
    authorId: 'user3',
    likes: 56,
    likedBy: [],
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'snippet4',
    shareCode: 'JKL012',
    title: 'Java 单例模式',
    code: `public class Singleton {
    private static volatile Singleton instance;
    private static final Object lock = new Object();
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (lock) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
    
    public void doSomething() {
        System.out.println("Singleton is working!");
    }
}`,
    language: 'java',
    description: '双重检查锁定的单例模式实现，线程安全',
    tags: ['设计模式', '单例', 'Java'],
    authorId: 'user1',
    likes: 35,
    likedBy: [],
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-10').toISOString()
  },
  {
    id: 'snippet5',
    shareCode: 'MNO345',
    title: 'Go 并发通道',
    code: `package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("worker %d 开始任务 %d\n", id, j)
        time.Sleep(time.Second)
        fmt.Printf("worker %d 完成任务 %d\n", id, j)
        results <- j * 2
    }
}

func main() {
    const numJobs = 5
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    
    var wg sync.WaitGroup
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }
    
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)
    
    wg.Wait()
    close(results)
    
    for r := range results {
        fmt.Println("结果:", r)
    }
}`,
    language: 'go',
    description: 'Go 语言并发编程示例，使用通道和 WaitGroup',
    tags: ['Go', '并发', 'goroutine'],
    authorId: 'user2',
    likes: 47,
    likedBy: [],
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString()
  },
  {
    id: 'snippet6',
    shareCode: 'PQR678',
    title: 'Rust 所有权示例',
    code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    
    println!("{}", s2);
    
    let s3 = String::from("world");
    let s4 = s3.clone();
    
    println!("s3 = {}, s4 = {}", s3, s4);
    
    let x = 5;
    let y = x;
    println!("x = {}, y = {}", x, y);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len();
    (s, length)
}`,
    language: 'rust',
    description: 'Rust 所有权系统的基础示例',
    tags: ['Rust', '所有权', '内存安全'],
    authorId: 'user3',
    likes: 23,
    likedBy: [],
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString()
  }
];

let comments = [
  {
    id: 'comment1',
    snippetId: 'snippet1',
    authorId: 'user2',
    content: '很经典的实现！不过可以考虑使用原地排序来减少空间复杂度。',
    parentId: null,
    createdAt: new Date('2024-01-16').toISOString()
  },
  {
    id: 'comment2',
    snippetId: 'snippet1',
    authorId: 'user1',
    content: '说得对，原地版本的快排空间复杂度可以降到 O(log n)',
    parentId: 'comment1',
    createdAt: new Date('2024-01-17').toISOString()
  },
  {
    id: 'comment3',
    snippetId: 'snippet1',
    authorId: 'user3',
    content: '学习了，感谢分享！',
    parentId: null,
    createdAt: new Date('2024-01-18').toISOString()
  },
  {
    id: 'comment4',
    snippetId: 'snippet2',
    authorId: 'user1',
    content: '装饰器真的很实用，这个计时装饰器我经常用。',
    parentId: null,
    createdAt: new Date('2024-01-21').toISOString()
  },
  {
    id: 'comment5',
    snippetId: 'snippet3',
    authorId: 'user2',
    content: 'useCallback 的使用很到位，避免了不必要的重渲染。',
    parentId: null,
    createdAt: new Date('2024-02-02').toISOString()
  }
];

const getAuthor = (authorId) => {
  const user = mockUsers.find(u => u.id === authorId);
  return user || { id: 'anonymous', name: '匿名用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anon' };
};

const formatSnippet = (snippet) => {
  return {
    id: snippet.id,
    shareCode: snippet.shareCode,
    title: snippet.title,
    code: snippet.code,
    language: snippet.language,
    description: snippet.description,
    tags: snippet.tags,
    author: getAuthor(snippet.authorId),
    likes: snippet.likes,
    likedByMe: snippet.likedBy.includes('current'),
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt
  };
};

const formatComment = (comment) => {
  return {
    id: comment.id,
    snippetId: comment.snippetId,
    author: getAuthor(comment.authorId),
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt
  };
};

app.get('/api/languages', (req, res) => {
  res.json(languages.map(lang => ({
    name: lang,
    color: languageColors[lang]
  })));
});

app.get('/api/snippets', (req, res) => {
  const { language, tag, search } = req.query;
  
  let filtered = [...snippets];
  
  if (language && language !== 'all') {
    filtered = filtered.filter(s => s.language === language);
  }
  
  if (tag && tag !== 'all') {
    filtered = filtered.filter(s => s.tags.includes(tag));
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(s => 
      s.title.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.code.toLowerCase().includes(searchLower)
    );
  }
  
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(filtered.map(formatSnippet));
});

app.get('/api/snippets/:id', (req, res) => {
  const snippet = snippets.find(s => s.id === req.params.id || s.shareCode === req.params.id);
  
  if (!snippet) {
    return res.status(404).json({ error: '代码片段不存在' });
  }
  
  res.json(formatSnippet(snippet));
});

app.post('/api/snippets', (req, res) => {
  const { code, language, description, tags, title } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ error: '代码和语言是必填项' });
  }
  
  if (!languages.includes(language)) {
    return res.status(400).json({ error: '不支持的编程语言' });
  }
  
  const newSnippet = {
    id: uuidv4(),
    shareCode: generateShareCode(),
    title: title || '未命名代码片段',
    code,
    language,
    description: description || '',
    tags: tags || [],
    authorId: 'current',
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  snippets.unshift(newSnippet);
  
  res.status(201).json(formatSnippet(newSnippet));
});

app.post('/api/snippets/:id/like', (req, res) => {
  const snippet = snippets.find(s => s.id === req.params.id);
  
  if (!snippet) {
    return res.status(404).json({ error: '代码片段不存在' });
  }
  
  const userId = 'current';
  const likeIndex = snippet.likedBy.indexOf(userId);
  
  let liked;
  if (likeIndex === -1) {
    snippet.likedBy.push(userId);
    snippet.likes++;
    liked = true;
  } else {
    snippet.likedBy.splice(likeIndex, 1);
    snippet.likes--;
    liked = false;
  }
  
  res.json({ likes: snippet.likes, liked });
});

app.get('/api/snippets/:id/comments', (req, res) => {
  const snippetComments = comments
    .filter(c => c.snippetId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(snippetComments.map(formatComment));
});

app.post('/api/snippets/:id/comments', (req, res) => {
  const { content, parentId } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  const snippet = snippets.find(s => s.id === req.params.id);
  
  if (!snippet) {
    return res.status(404).json({ error: '代码片段不存在' });
  }
  
  const newComment = {
    id: uuidv4(),
    snippetId: req.params.id,
    authorId: 'current',
    content: content.trim(),
    parentId: parentId || null,
    createdAt: new Date().toISOString()
  };
  
  comments.push(newComment);
  
  res.status(201).json(formatComment(newComment));
});

app.get('/api/tags', (req, res) => {
  const allTags = new Set();
  snippets.forEach(s => s.tags.forEach(t => allTags.add(t)));
  res.json(Array.from(allTags));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
