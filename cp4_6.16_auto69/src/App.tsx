import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTimelineStore } from './hooks/useTimelineStore';
import { parseArticle } from './tools/parser';
import {
  saveArticle,
  saveNodes,
  deleteArticleData,
  getAllArticles,
  getAllEvents,
} from './tools/store';
import { Timeline } from './components/Timeline';
import { DetailPanel } from './components/DetailPanel';
import { ARTICLE_LABEL_COLORS } from './types';
import type { Article } from './types';
import {
  Upload,
  FileText,
  Trash2,
  Filter,
  Menu,
  X,
  ChevronDown,
  Plus,
} from 'lucide-react';

const MAX_ARTICLES = 5;

export const App: React.FC = () => {
  const {
    articles,
    eventNodes,
    activeArticleFilter,
    leftPanelCollapsed,
    addArticle,
    removeArticle,
    addEventNodes,
    removeEventNodesByArticle,
    setArticleFilter,
    setArticles,
    setEventNodes,
    toggleLeftPanel,
  } = useTimelineStore();

  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [savedArticles, savedNodes] = await Promise.all([
        getAllArticles(),
        getAllEvents(),
      ]);
      setArticles(savedArticles);
      setEventNodes(savedNodes);
    };
    loadData();
  }, [setArticles, setEventNodes]);

  const isMedium = windowWidth >= 768 && windowWidth < 1200;
  const isSmall = windowWidth < 768;

  const handleImport = useCallback(async () => {
    if (!importText.trim() || articles.length >= MAX_ARTICLES) return;
    setIsImporting(true);

    try {
      const titleMatch = importText.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : `文章 ${articles.length + 1}`;

      const article: Article = {
        id: uuidv4(),
        title,
        content: importText.trim(),
        createdAt: new Date().toISOString(),
      };

      const nodes = parseArticle(article);

      await saveArticle(article);
      await saveNodes(nodes);

      addArticle(article);
      addEventNodes(nodes);

      setImportText('');
      setShowImportModal(false);
    } finally {
      setIsImporting(false);
    }
  }, [importText, articles.length, addArticle, addEventNodes]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          setImportText(text);
          setShowImportModal(true);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteArticleData(id);
      removeArticle(id);
      removeEventNodesByArticle(id);
      if (activeArticleFilter === id) {
        setArticleFilter('all');
      }
    },
    [removeArticle, removeEventNodesByArticle, activeArticleFilter, setArticleFilter]
  );

  const panelVisible = !isSmall && !isMedium && !leftPanelCollapsed;

  return (
    <div className="app-root">
      {isSmall && (
        <div className="top-bar">
          <button className="top-menu-btn" onClick={toggleLeftPanel}>
            <Menu size={20} />
          </button>
          <span className="top-bar-title">Timeline Composer</span>
          <button
            className="top-import-btn"
            onClick={() => setShowImportModal(true)}
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {isMedium && (
        <div className="top-bar-medium">
          <div className="top-bar-left">
            <button className="top-menu-btn" onClick={toggleLeftPanel}>
              <Menu size={20} />
            </button>
            <span className="top-bar-title">Timeline Composer</span>
          </div>
          <div className="top-bar-right">
            <div className="filter-dropdown">
              <Filter size={14} />
              <select
                value={activeArticleFilter}
                onChange={(e) => setArticleFilter(e.target.value)}
              >
                <option value="all">全部文章</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} />
            </div>
            <button
              className="import-btn-top"
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={14} />
              <span>导入文章</span>
            </button>
          </div>
        </div>
      )}

      {panelVisible && (
        <aside className="left-panel">
          <div className="left-panel-header">
            <h2 className="left-panel-title">Timeline Composer</h2>
            <p className="left-panel-subtitle">交互式时间线文章工具</p>
          </div>

          <button
            className="import-btn"
            onClick={() => setShowImportModal(true)}
            disabled={articles.length >= MAX_ARTICLES}
          >
            <Upload size={16} />
            <span>导入文章</span>
            <div className="import-btn-shine" />
          </button>

          <div className="left-panel-section">
            <div className="section-header">
              <Filter size={14} />
              <span>筛选文章</span>
            </div>
            <select
              className="filter-select"
              value={activeArticleFilter}
              onChange={(e) => setArticleFilter(e.target.value)}
            >
              <option value="all">全部文章</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div className="left-panel-section">
            <div className="section-header">
              <FileText size={14} />
              <span>
                已导入文章 ({articles.length}/{MAX_ARTICLES})
              </span>
            </div>
            <div className="article-list">
              {articles.length === 0 ? (
                <p className="article-list-empty">
                  暂无文章，点击上方按钮导入
                </p>
              ) : (
                articles.map((article, i) => (
                  <div key={article.id} className="article-item">
                    <div
                      className="article-color-bar"
                      style={{
                        backgroundColor:
                          ARTICLE_LABEL_COLORS[i % ARTICLE_LABEL_COLORS.length],
                      }}
                    />
                    <div className="article-item-content">
                      <span className="article-item-title">
                        {article.title}
                      </span>
                      <span className="article-item-date">
                        {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <button
                      className="article-delete-btn"
                      onClick={() => handleDelete(article.id)}
                      title="删除文章"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="left-panel-section stats-section">
            <div className="stats-row">
              <span className="stats-label">事件节点</span>
              <span className="stats-value">{eventNodes.length}</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </aside>
      )}

      <main className="main-area">
        <Timeline />
        <DetailPanel />
      </main>

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>导入Markdown文章</h3>
              <button
                className="modal-close"
                onClick={() => setShowImportModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-tabs">
                <button
                  className={`import-tab active`}
                >
                  粘贴文本
                </button>
                <button
                  className="import-tab"
                  onClick={() => fileInputRef.current?.click()}
                >
                  上传文件
                </button>
              </div>
              <textarea
                className="import-textarea"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="在此粘贴Markdown文本...&#10;&#10;提示：文本中包含日期标记（如 2024-03-15）和关键词（如 发布、达成、里程碑）将被自动识别为事件节点"
                rows={12}
              />
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowImportModal(false)}
              >
                取消
              </button>
              <button
                className="modal-confirm-btn"
                onClick={handleImport}
                disabled={!importText.trim() || isImporting}
              >
                {isImporting ? '解析中...' : '导入并解析'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSmall || isMedium) && !leftPanelCollapsed && (
        <div className="mobile-overlay" onClick={toggleLeftPanel}>
          <div
            className="mobile-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-panel-header">
              <span>菜单</span>
              <button onClick={toggleLeftPanel}>
                <X size={18} />
              </button>
            </div>
            <div className="mobile-panel-body">
              <button
                className="import-btn"
                onClick={() => {
                  setShowImportModal(true);
                  toggleLeftPanel();
                }}
                disabled={articles.length >= MAX_ARTICLES}
              >
                <Upload size={16} />
                <span>导入文章</span>
                <div className="import-btn-shine" />
              </button>

              <div className="filter-section-mobile">
                <label>筛选文章</label>
                <select
                  value={activeArticleFilter}
                  onChange={(e) => setArticleFilter(e.target.value)}
                >
                  <option value="all">全部文章</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="article-list">
                {articles.map((article, i) => (
                  <div key={article.id} className="article-item">
                    <div
                      className="article-color-bar"
                      style={{
                        backgroundColor:
                          ARTICLE_LABEL_COLORS[
                            i % ARTICLE_LABEL_COLORS.length
                          ],
                      }}
                    />
                    <div className="article-item-content">
                      <span className="article-item-title">
                        {article.title}
                      </span>
                    </div>
                    <button
                      className="article-delete-btn"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
