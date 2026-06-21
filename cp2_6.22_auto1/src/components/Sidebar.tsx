import { useState, useMemo } from 'react';
import * as Y from 'yjs';
import {
  FileText,
  Search,
  MessageSquare,
  ListTodo,
  History,
  Settings,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface SidebarProps {
  doc: Y.Doc;
  onTogglePanel: (panel: string) => void;
}

interface HeadingItem {
  level: number;
  text: string;
  line: number;
}

const TOOLS = [
  { id: 'outline', icon: FileText, label: '文档大纲' },
  { id: 'search', icon: Search, label: '搜索' },
  { id: 'comments', icon: MessageSquare, label: '评论' },
  { id: 'tasks', icon: ListTodo, label: '任务' },
  { id: 'history', icon: History, label: '历史' },
  { id: 'settings', icon: Settings, label: '设置' },
] as const;

function parseHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2], line: idx });
    }
  });
  return headings;
}

export default function Sidebar({ doc, onTogglePanel }: SidebarProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  const content = useMemo(() => {
    const fragment = doc.getXmlFragment('content');
    const text = fragment.toString();
    return text;
  }, [doc]);

  const headings = useMemo(() => parseHeadings(content), [content]);

  const handleToolClick = (id: string) => {
    if (activeTool === id) {
      setActiveTool(null);
      setPanelOpen(false);
    } else {
      setActiveTool(id);
      setPanelOpen(true);
      if (id === 'comments' || id === 'tasks' || id === 'history' || id === 'settings') {
        onTogglePanel(id);
      }
    }
  };

  const handleHeadingClick = (line: number) => {
    const fragment = doc.getXmlFragment('content');
    const text = fragment.toString();
    let pos = 0;
    const lines = text.split('\n');
    for (let i = 0; i < line && i < lines.length; i++) {
      pos += lines[i].length + 1;
    }
    window.dispatchEvent(new CustomEvent('editor-scroll-to', { detail: pos }));
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lines = content.split('\n');
    const results: { line: number; text: string }[] = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ line: idx, text: line });
      }
    });
    return results;
  }, [content, searchQuery]);

  return (
    <div className="flex h-full">
      <div
        className={cn(
          'flex flex-col items-center py-3 gap-1 shrink-0',
          'w-12 h-full',
          'bg-white/70 dark:bg-surface-dark/70',
          'backdrop-blur-xl border-r border-border-light dark:border-border-dark'
        )}
      >
        {TOOLS.map((tool) => (
          <div key={tool.id} className="relative group">
            <button
              onClick={() => handleToolClick(tool.id)}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300',
                activeTool === tool.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-light dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <tool.icon size={18} />
            </button>
            <div
              className={cn(
                'absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs whitespace-nowrap',
                'bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark',
                'shadow-lg border border-border-light dark:border-border-dark',
                'opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200'
              )}
            >
              {tool.label}
            </div>
          </div>
        ))}

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300',
            'text-muted-light dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
          )}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => {
            setPanelOpen((p) => !p);
            if (!panelOpen && !activeTool) setActiveTool('outline');
          }}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300',
            'text-muted-light dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
          )}
        >
          {panelOpen ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      {panelOpen && (
        <div
          className={cn(
            'w-[200px] h-full shrink-0 overflow-y-auto',
            'bg-white/60 dark:bg-surface-dark/60',
            'backdrop-blur-xl border-r border-border-light dark:border-border-dark',
            'animate-slide-in-left'
          )}
        >
          {activeTool === 'outline' && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase mb-2">
                文档大纲
              </h3>
              {headings.length === 0 ? (
                <p className="text-xs text-muted-light dark:text-muted-dark">暂无标题</p>
              ) : (
                <div className="space-y-0.5">
                  {headings.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleHeadingClick(h.line)}
                      className={cn(
                        'block w-full text-left text-xs rounded px-1.5 py-1 transition-colors duration-200',
                        'hover:bg-accent/10 text-text-light dark:text-text-dark',
                        h.level === 1 && 'font-semibold',
                        h.level === 2 && 'pl-3',
                        h.level === 3 && 'pl-5',
                        h.level >= 4 && 'pl-7'
                      )}
                    >
                      {h.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'search' && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase mb-2">
                搜索
              </h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档内容..."
                className={cn(
                  'w-full px-2 py-1.5 rounded-md text-xs border outline-none',
                  'bg-white/50 dark:bg-surface-dark/50',
                  'border-border-light dark:border-border-dark',
                  'text-text-light dark:text-text-dark',
                  'placeholder:text-muted-light dark:placeholder:text-muted-dark',
                  'focus:ring-1 focus:ring-accent/50'
                )}
              />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleHeadingClick(r.line)}
                      className="block w-full text-left text-xs rounded px-1.5 py-1 hover:bg-accent/10 text-text-light dark:text-text-dark truncate"
                    >
                      <span className="text-muted-light dark:text-muted-dark mr-1">
                        {r.line + 1}:
                      </span>
                      {r.text}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-muted-light dark:text-muted-dark mt-2">未找到结果</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
