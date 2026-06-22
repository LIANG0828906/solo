import { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  SearchX,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface SidebarProps {
  doc: Y.Doc;
  onTogglePanel: (panel: string) => void;
}

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  line: number;
  pos: number;
}

interface TreeNode {
  id: string;
  heading: HeadingItem | null;
  level: number;
  children: TreeNode[];
  startLine: number;
  endLine: number;
}

const TOOLS = [
  { id: 'outline', icon: FileText, label: '文档大纲' },
  { id: 'comments', icon: MessageSquare, label: '评论' },
  { id: 'tasks', icon: ListTodo, label: '任务' },
  { id: 'history', icon: History, label: '历史' },
  { id: 'settings', icon: Settings, label: '设置' },
] as const;

type ToolId = typeof TOOLS[number]['id'] | 'search';

const HIGHLIGHT_WRAP_LENGTH = 30;

function parseHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');
  let pos = 0;
  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        id: `h-${idx}-${pos}`,
        level: match[1].length,
        text: match[2].trim(),
        line: idx,
        pos,
      });
    }
    pos += line.length + 1;
  });
  return headings;
}

function buildTree(headings: HeadingItem[], totalLines: number): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  const makeNode = (heading: HeadingItem | null, level: number, startLine: number): TreeNode => ({
    id: heading ? heading.id : `root-${startLine}`,
    heading,
    level,
    children: [],
    startLine,
    endLine: startLine,
  });

  if (headings.length === 0) {
    return [];
  }

  headings.forEach((h) => {
    const node = makeNode(h, h.level, h.line);
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      const popped = stack.pop()!;
      popped.endLine = h.line - 1;
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  while (stack.length > 0) {
    const popped = stack.pop()!;
    popped.endLine = totalLines - 1;
  }

  return roots;
}

function collectAllNodeIds(tree: TreeNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: TreeNode[]) => {
    nodes.forEach((n) => {
      ids.add(n.id);
      if (n.children.length > 0) walk(n.children);
    });
  };
  walk(tree);
  return ids;
}

interface SearchMatch {
  line: number;
  pos: number;
  text: string;
  nodeId: string | null;
  matchStart: number;
  matchEnd: number;
}

function findMatches(content: string, query: string, tree: TreeNode[]): SearchMatch[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const lines = content.split('\n');
  const results: SearchMatch[] = [];
  let pos = 0;

  const findNodeForLine = (line: number): string | null => {
    let found: string | null = null;
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (line >= n.startLine && line <= n.endLine) {
          found = n.id;
          if (n.children.length > 0) walk(n.children);
          return;
        }
      }
    };
    walk(tree);
    return found;
  };

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    let startIdx = 0;
    while (true) {
      const m = lower.indexOf(q, startIdx);
      if (m === -1) break;
      results.push({
        line: idx,
        pos: pos + m,
        text: line,
        nodeId: findNodeForLine(idx),
        matchStart: m,
        matchEnd: m + q.length,
      });
      startIdx = m + 1;
      if (results.length >= 200) break;
    }
    pos += line.length + 1;
  });

  return results.slice(0, 200);
}

function collectAncestorIds(tree: TreeNode[], targetIds: Set<string>): Set<string> {
  const ancestors = new Set<string>();
  const walk = (nodes: TreeNode[], path: string[]): boolean => {
    let hasMatchInBranch = false;
    for (const n of nodes) {
      const nextPath = [...path, n.id];
      const childHas = walk(n.children, nextPath);
      const selfHas = targetIds.has(n.id);
      if (childHas || selfHas) {
        hasMatchInBranch = true;
        nextPath.forEach((pid) => ancestors.add(pid));
      }
    }
    return hasMatchInBranch;
  };
  walk(tree, []);
  return ancestors;
}

function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: Array<{ t: string; m: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push({ t: text.slice(i), m: false });
      break;
    }
    if (idx > i) parts.push({ t: text.slice(i, idx), m: false });
    parts.push({ t: text.slice(idx, idx + q.length), m: true });
    i = idx + q.length;
  }
  return (
    <span className={className}>
      {parts.map((p, idx) =>
        p.m ? (
          <mark
            key={idx}
            className={cn(
              'rounded px-0.5',
              'bg-accent/30 text-accent dark:bg-accent/40 dark:text-white',
              'font-medium'
            )}
          >
            {p.t}
          </mark>
        ) : (
          <span key={idx}>{p.t}</span>
        )
      )}
    </span>
  );
}

function truncateWithMatch(
  text: string,
  matchStart: number,
  matchEnd: number,
  maxLen: number
): { display: string; offset: number } {
  if (text.length <= maxLen) {
    return { display: text, offset: 0 };
  }
  const matchLen = matchEnd - matchStart;
  const pad = Math.floor((maxLen - matchLen) / 2);
  let start = Math.max(0, matchStart - pad);
  let end = Math.min(text.length, start + maxLen);
  if (end - start < maxLen) start = Math.max(0, end - maxLen);
  const display =
    (start > 0 ? '…' : '') +
    text.slice(start, end) +
    (end < text.length ? '…' : '');
  const offset = start > 0 ? 1 : 0;
  return { display, offset };
}

function TreeNodeRow({
  node,
  depth,
  expandedSet,
  onToggle,
  onClick,
  query,
  activeLine,
}: {
  node: TreeNode;
  depth: number;
  expandedSet: Set<string>;
  onToggle: (id: string) => void;
  onClick: (pos: number) => void;
  query: string;
  activeLine: number | null;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(0);
  const hasChildren = node.children.length > 0;
  const isActive = activeLine !== null && activeLine >= node.startLine && activeLine <= node.endLine;
  const expanded = expandedSet.has(node.id);

  useEffect(() => {
    if (!contentRef.current) return;
    if (expanded) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      const t = setTimeout(() => setHeight('auto'), 320);
      return () => clearTimeout(t);
    } else {
      setHeight(contentRef.current.scrollHeight);
      const t = setTimeout(() => setHeight(0), 10);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  const textMatchesQuery =
    query.trim() !== '' &&
    node.heading?.text.toLowerCase().includes(query.toLowerCase());

  const IndentGuides = () => (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'absolute top-0 bottom-0 w-px',
            'bg-border-light/60 dark:bg-border-dark/60'
          )}
          style={{ left: i * 12 + 4 }}
        />
      ))}
      {depth > 0 && (
        <span
          className={cn(
            'absolute top-0 h-1/2 w-px',
            'bg-border-light/60 dark:bg-border-dark/60'
          )}
          style={{ left: depth * 12 + 4 }}
        />
      )}
      {depth > 0 && (
        <span
          className={cn(
            'absolute h-px',
            'bg-border-light/60 dark:bg-border-dark/60'
          )}
          style={{ left: depth * 12 + 4, top: '0.8rem', width: 8 }}
        />
      )}
    </>
  );

  return (
    <div className="relative">
      <div className="relative">
        <IndentGuides />
        <div
          className={cn(
            'flex items-center gap-1 pr-1 py-1 rounded transition-all duration-300 cursor-pointer',
            'hover:bg-accent/10 dark:hover:bg-accent/15',
            isActive && 'bg-accent/15 dark:bg-accent/20'
          )}
          style={{ paddingLeft: depth * 12 + 4 }}
          onClick={() => {
            if (hasChildren) onToggle(node.id);
            if (node.heading) onClick(node.heading.pos);
          }}
        >
          <span
            className={cn(
              'w-4 h-4 flex items-center justify-center shrink-0 transition-transform duration-300',
              !hasChildren && 'opacity-0 pointer-events-none'
            )}
          >
            {expanded ? (
              <ChevronDown size={12} className="text-muted-light dark:text-muted-dark" />
            ) : (
              <ChevronRight
                size={12}
                className={cn(
                  'text-muted-light dark:text-muted-dark transition-transform duration-300'
                )}
              />
            )}
          </span>

          <span className="shrink-0 text-accent/80">
            {hasChildren ? (
              expanded ? (
                <FolderOpen size={14} className="text-accent" />
              ) : (
                <Folder size={14} className="text-warning/80" />
              )
            ) : (
              <File size={13} className="text-muted-light dark:text-muted-dark" />
            )}
          </span>

          <HighlightText
            text={node.heading?.text ?? '(根)'}
            query={query}
            className={cn(
              'flex-1 text-xs truncate text-left min-w-0',
              'text-text-light dark:text-text-dark',
              node.level === 1 && 'font-semibold',
              textMatchesQuery && 'text-accent font-medium'
            )}
          />
        </div>
      </div>

      {hasChildren && (
        <div
          ref={contentRef}
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            expanded ? '' : ''
          )}
          style={{
            height,
            opacity: expanded ? 1 : 0,
          }}
        >
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedSet={expandedSet}
              onToggle={onToggle}
              onClick={onClick}
              query={query}
              activeLine={activeLine}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ doc, onTogglePanel }: SidebarProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>('outline');
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDark, toggleTheme } = useTheme();

  const content = useMemo(() => {
    try {
      const ytext = doc.getText('content');
      return ytext.toString();
    } catch {
      return '';
    }
  }, [doc]);

  const headings = useMemo(() => parseHeadings(content), [content]);
  const totalLines = useMemo(() => content.split('\n').length, [content]);
  const tree = useMemo(() => buildTree(headings, totalLines), [headings, totalLines]);

  const matches = useMemo(() => findMatches(content, searchQuery, tree), [content, searchQuery, tree]);

  const matchedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    matches.forEach((m) => {
      if (m.nodeId) ids.add(m.nodeId);
    });
    return ids;
  }, [matches]);

  const autoExpandIds = useMemo(() => {
    if (searchQuery.trim() === '') return new Set<string>();
    const ancestors = collectAncestorIds(tree, matchedNodeIds);
    const union = new Set<string>([...ancestors, ...matchedNodeIds]);
    return union;
  }, [tree, matchedNodeIds, searchQuery]);

  const effectiveExpanded = useMemo(() => {
    if (searchQuery.trim() === '' && !searchFocused) return expanded;
    const union = new Set<string>([...expanded, ...autoExpandIds]);
    if (searchFocused && searchQuery.trim() !== '') {
      collectAllNodeIds(tree).forEach((id) => {
        if (matchedNodeIds.size > 0) {
          // only expand the matched path
        }
      });
    }
    return union;
  }, [expanded, autoExpandIds, searchQuery, searchFocused, tree, matchedNodeIds]);

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClickPos = (pos: number) => {
    window.dispatchEvent(new CustomEvent('editor-scroll-to', { detail: { pos } }));
  };

  const handleMatchClick = (pos: number) => {
    window.dispatchEvent(new CustomEvent('editor-scroll-to', { detail: { pos } }));
    window.dispatchEvent(
      new CustomEvent('editor-highlight-range', {
        detail: { from: pos, to: pos + Math.max(1, searchQuery.length) },
      })
    );
  };

  const handleToolClick = (id: string) => {
    const toolId = id as ToolId;
    if (activeTool === toolId) {
      setActiveTool(null);
      setPanelOpen(false);
    } else {
      setActiveTool(toolId);
      setPanelOpen(true);
      if (toolId === 'comments' || toolId === 'tasks' || toolId === 'history' || toolId === 'settings') {
        onTogglePanel(toolId);
      }
      if (toolId === 'outline') {
        // nothing extra
      }
    }
  };

  useEffect(() => {
    if (panelOpen && activeTool === 'outline' && tree.length > 0) {
      setExpanded((prev) => {
        if (prev.size > 0) return prev;
        const firstLevel = new Set<string>();
        tree.forEach((n) => firstLevel.add(n.id));
        return firstLevel;
      });
    }
  }, [panelOpen, activeTool, tree]);

  useEffect(() => {
    if (panelOpen && activeTool === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [panelOpen, activeTool]);

  const showOutlineContent = activeTool === 'outline' || activeTool === 'search';

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
        <div className="relative group mb-1">
          <button
            onClick={() => {
              if (activeTool === 'search') {
                setActiveTool(null);
                setPanelOpen(false);
                setSearchQuery('');
              } else {
                setActiveTool('search');
                setPanelOpen(true);
              }
            }}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300',
              activeTool === 'search'
                ? 'bg-accent/20 text-accent'
                : 'text-muted-light dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Search size={18} />
          </button>
          <div
            className={cn(
              'absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs whitespace-nowrap',
              'bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark',
              'shadow-lg border border-border-light dark:border-border-dark',
              'opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200'
            )}
          >
            搜索
          </div>
        </div>

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
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
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

      {panelOpen && showOutlineContent && (
        <div
          className={cn(
            'w-[240px] h-full shrink-0 flex flex-col overflow-hidden',
            'bg-white/60 dark:bg-surface-dark/60',
            'backdrop-blur-xl border-r border-border-light dark:border-border-dark',
            'animate-slide-in-left'
          )}
        >
          <div
            className={cn(
              'p-2 shrink-0',
              'border-b border-border-light/50 dark:border-border-dark/50',
              'bg-white/40 dark:bg-surface-dark/40'
            )}
          >
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="搜索全文或标题..."
                className={cn(
                  'w-full pl-7 pr-7 py-1.5 rounded-md text-xs border outline-none transition-all duration-300',
                  'bg-white/70 dark:bg-surface-dark/70',
                  'border-border-light dark:border-border-dark',
                  'text-text-light dark:text-text-dark',
                  'placeholder:text-muted-light/70 dark:placeholder:text-muted-dark/70',
                  'focus:ring-2 focus:ring-accent/30 focus:border-accent/50'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={cn(
                    'absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded',
                    'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark',
                    'hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200'
                  )}
                >
                  <SearchX size={12} />
                </button>
              )}
            </div>
          </div>

          {searchQuery.trim() !== '' && matches.length > 0 && (
            <div
              className={cn(
                'px-3 py-1.5 shrink-0',
                'border-b border-border-light/30 dark:border-border-dark/30',
                'bg-accent/5 dark:bg-accent/10'
              )}
            >
              <span className="text-[10px] text-accent font-medium">
                找到 {matches.length} 处匹配
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() !== '' && matches.length > 0 && (
              <div className="p-2">
                <div className="space-y-1">
                  {matches.map((m, idx) => {
                    const { display, offset } = truncateWithMatch(
                      m.text,
                      m.matchStart,
                      m.matchEnd,
                      48
                    );
                    const newMatchStart = Math.max(0, m.matchStart - (m.matchStart - offset > 0 ? m.matchStart - offset : 0));
                    const q = searchQuery;
                    return (
                      <button
                        key={`${m.line}-${idx}`}
                        onClick={() => handleMatchClick(m.pos)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded transition-all duration-200',
                          'hover:bg-accent/10 dark:hover:bg-accent/15',
                          'border border-transparent hover:border-accent/20'
                        )}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px] text-muted-light dark:text-muted-dark font-mono">
                            Ln {m.line + 1}
                          </span>
                        </div>
                        <div className="text-xs text-text-light dark:text-text-dark leading-relaxed truncate">
                          <HighlightText
                            text={display}
                            query={q}
                            className=""
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {searchQuery.trim() !== '' && matches.length === 0 && (
              <div className="p-4 flex flex-col items-center justify-center gap-2">
                <SearchX
                  size={24}
                  className="text-muted-light dark:text-muted-dark opacity-40"
                />
                <p className="text-xs text-muted-light dark:text-muted-dark text-center">
                  未找到匹配内容
                </p>
              </div>
            )}

            {searchQuery.trim() === '' && tree.length === 0 && (
              <div className="p-4 flex flex-col items-center justify-center gap-2">
                <FileText
                  size={24}
                  className="text-muted-light dark:text-muted-dark opacity-40"
                />
                <p className="text-xs text-muted-light dark:text-muted-dark text-center">
                  暂无标题
                </p>
                <p className="text-[10px] text-muted-light/70 dark:text-muted-dark/70 text-center">
                  使用 # 标题 语法创建大纲
                </p>
              </div>
            )}

            {searchQuery.trim() === '' && tree.length > 0 && (
              <div className="p-2">
                {tree.map((node) => (
                  <TreeNodeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedSet={effectiveExpanded}
                    onToggle={toggleNode}
                    onClick={handleClickPos}
                    query=""
                    activeLine={null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {panelOpen && (activeTool === 'comments' || activeTool === 'tasks' || activeTool === 'history' || activeTool === 'settings') && (
        <div
          className={cn(
            'w-[200px] h-full shrink-0 flex flex-col',
            'bg-white/60 dark:bg-surface-dark/60',
            'backdrop-blur-xl border-r border-border-light dark:border-border-dark',
            'animate-slide-in-left'
          )}
        >
          <div className="p-3 border-b border-border-light/50 dark:border-border-dark/50">
            <h3 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase">
              {activeTool === 'comments' && '评论管理'}
              {activeTool === 'tasks' && '任务看板'}
              {activeTool === 'history' && '版本历史'}
              {activeTool === 'settings' && '设置'}
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-xs text-muted-light dark:text-muted-dark text-center">
              请点击右上角按钮打开详细面板
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
