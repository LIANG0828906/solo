import { v4 as uuidv4 } from 'uuid';
import type { Snippet, RelationGraph, GraphNode, GraphEdge, Language } from '../types';

let snippets: Snippet[] = [];

const mockSnippets: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    filename: 'App.tsx',
    language: 'TypeScript',
    content: `import React from 'react';
import { SnippetPanel } from './components/SnippetPanel';
import { CodeEditor } from './components/CodeEditor';
import { RelationGraph } from './components/RelationGraph';
import { AppProvider } from './context/AppContext';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="app-layout">
        <SnippetPanel />
        <main className="main-content">
          <CodeEditor />
          <RelationGraph />
        </main>
      </div>
    </AppProvider>
  );
};`,
    module: '核心模块',
    dependencies: ['./components/SnippetPanel', './components/CodeEditor', './components/RelationGraph', './context/AppContext'],
  },
  {
    filename: 'SnippetPanel.tsx',
    language: 'TypeScript',
    content: `import React from 'react';
import { useAppContext } from '../context/AppContext';

export const SnippetPanel: React.FC = () => {
  const { snippets, selectedId, setSelectedId, searchKeyword, setSearchKeyword } = useAppContext();

  const filtered = snippets.filter(s => 
    s.filename.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <aside className="snippet-panel">
      <input
        type="text"
        placeholder="搜索片段..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
      />
      <div className="snippet-list">
        {filtered.map((snippet) => (
          <div
            key={snippet.id}
            className={\`snippet-card \${snippet.id === selectedId ? 'active' : ''}\`}
            onClick={() => setSelectedId(snippet.id)}
          >
            <span className="filename">{snippet.filename}</span>
            <span className="language-tag">{snippet.language}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};`,
    module: '组件模块',
    dependencies: ['../context/AppContext'],
  },
  {
    filename: 'CodeEditor.tsx',
    language: 'TypeScript',
    content: `import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { useAppContext } from '../context/AppContext';

export const CodeEditor: React.FC = () => {
  const { selectedSnippet, updateSnippet } = useAppContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || !selectedSnippet) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    viewRef.current = new EditorView({
      doc: selectedSnippet.content,
      extensions: [basicSetup, javascript()],
      parent: editorRef.current,
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [selectedSnippet?.id]);

  if (!selectedSnippet) {
    return <div className="code-editor empty">请选择一个代码片段</div>;
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <span className="language-tag">{selectedSnippet.language}</span>
        <div className="editor-actions">
          <button>编辑</button>
          <button>保存</button>
          <button>删除</button>
        </div>
      </div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
};`,
    module: '组件模块',
    dependencies: ['../context/AppContext'],
  },
  {
    filename: 'AppContext.tsx',
    language: 'TypeScript',
    content: `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Snippet, RelationGraph } from '../types';
import { getSnippets, addSnippet as apiAdd, updateSnippet as apiUpdate, deleteSnippet as apiDelete, generateRelationGraph } from '../api/snippetApi';

interface AppContextType {
  snippets: Snippet[];
  selectedId: string | null;
  selectedSnippet: Snippet | undefined;
  searchKeyword: string;
  relationGraph: RelationGraph | null;
  setSelectedId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  generateGraph: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [relationGraph, setRelationGraph] = useState<RelationGraph | null>(null);

  useEffect(() => {
    setSnippets(getSnippets());
  }, []);

  const selectedSnippet = snippets.find(s => s.id === selectedId);

  const addSnippet = useCallback((snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSnippet = apiAdd(snippet);
    setSnippets(getSnippets());
    return newSnippet;
  }, []);

  const updateSnippet = useCallback((id: string, updates: Partial<Snippet>) => {
    apiUpdate(id, updates);
    setSnippets(getSnippets());
  }, []);

  const deleteSnippet = useCallback((id: string) => {
    apiDelete(id);
    setSnippets(getSnippets());
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const generateGraph = useCallback(() => {
    const graph = generateRelationGraph();
    setRelationGraph(graph);
  }, []);

  return (
    <AppContext.Provider value={{
      snippets,
      selectedId,
      selectedSnippet,
      searchKeyword,
      relationGraph,
      setSelectedId,
      setSearchKeyword,
      addSnippet,
      updateSnippet,
      deleteSnippet,
      generateGraph,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};`,
    module: '状态模块',
    dependencies: ['../types', '../api/snippetApi'],
  },
  {
    filename: 'utils.ts',
    language: 'TypeScript',
    content: `export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    CSS: '#2965F1',
    HTML: '#E34F26',
  };
  return colors[language] || '#64748B';
};

export const generateModuleColor = (moduleName: string): string => {
  let hash = 0;
  for (let i = 0; i < moduleName.length; i++) {
    hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return \`hsl(\${hue}, 60%, 50%)\`;
};`,
    module: '工具模块',
    dependencies: [],
  },
  {
    filename: 'styles.css',
    language: 'CSS',
    content: `:root {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-gradient: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
  --accent: #3B82F6;
  --accent-hover: #2563EB;
  --border-color: #475569;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-gradient);
  color: var(--text-primary);
  min-height: 100vh;
}

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}`,
    module: '样式模块',
    dependencies: [],
  },
  {
    filename: 'index.html',
    language: 'HTML',
    content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>代码织网</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="main.tsx"></script>
</body>
</html>`,
    module: '入口模块',
    dependencies: [],
  },
];

export const initMockData = (): void => {
  if (snippets.length > 0) return;
  
  const now = new Date().toISOString();
  snippets = mockSnippets.map((s) => ({
    ...s,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }));
};

export const getSnippets = (): Snippet[] => {
  if (snippets.length === 0) {
    initMockData();
  }
  return [...snippets];
};

export const getSnippetById = (id: string): Snippet | undefined => {
  return snippets.find((s) => s.id === id);
};

export const addSnippet = (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Snippet => {
  const now = new Date().toISOString();
  const newSnippet: Snippet = {
    ...snippet,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  snippets.push(newSnippet);
  return newSnippet;
};

export const updateSnippet = (id: string, updates: Partial<Snippet>): Snippet | undefined => {
  const index = snippets.findIndex((s) => s.id === id);
  if (index === -1) return undefined;
  
  snippets[index] = {
    ...snippets[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return snippets[index];
};

export const deleteSnippet = (id: string): boolean => {
  const index = snippets.findIndex((s) => s.id === id);
  if (index === -1) return false;
  snippets.splice(index, 1);
  return true;
};

export const generateRelationGraph = (): RelationGraph => {
  if (snippets.length === 0) {
    initMockData();
  }

  const referenceCountMap = new Map<string, number>();
  
  snippets.forEach((s) => {
    referenceCountMap.set(s.id, 0);
  });

  const edges: GraphEdge[] = [];
  
  snippets.forEach((snippet) => {
    snippet.dependencies.forEach((dep) => {
      const depFilename = dep.split('/').pop()?.replace(/\.(ts|tsx|js|jsx|css|html)$/, '') || dep;
      const targetSnippet = snippets.find((s) => {
        const sBase = s.filename.replace(/\.(ts|tsx|js|jsx|css|html)$/, '');
        return sBase === depFilename || s.filename === depFilename + '.tsx' || s.filename === depFilename + '.ts';
      });
      
      if (targetSnippet && targetSnippet.id !== snippet.id) {
        edges.push({
          source: snippet.id,
          target: targetSnippet.id,
        });
        const count = referenceCountMap.get(targetSnippet.id) || 0;
        referenceCountMap.set(targetSnippet.id, count + 1);
      }
    });
  });

  const nodes: GraphNode[] = snippets.map((s) => ({
    id: s.id,
    filename: s.filename,
    module: s.module,
    language: s.language as Language,
    referenceCount: referenceCountMap.get(s.id) || 0,
  }));

  return { nodes, edges };
};

initMockData();
