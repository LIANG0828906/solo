import { useState, useRef, useEffect, useCallback } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { translateText } from '../api/translate';
import CommentBubble from './CommentBubble';

export default function TranslationPanel() {
  const { paragraphs, translations, setTranslation } = useDocumentStore();
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, number>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const updateDebounced = useCallback(
    (id: string, value: string) => {
      setTranslation(id, value);
      if (debounceTimers.current[id]) {
        window.clearTimeout(debounceTimers.current[id]);
      }
      debounceTimers.current[id] = window.setTimeout(() => {
        // 模拟实时保存（可在此处调用后端 API）
        delete debounceTimers.current[id];
      }, 180);
    },
    [setTranslation]
  );

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const handleAutoTranslate = async (id: string, text: string) => {
    if (translatingId) return;
    setTranslatingId(id);
    try {
      const result = await translateText(text, 'zh');
      setTranslation(id, result);
    } finally {
      setTranslatingId(null);
    }
  };

  if (paragraphs.length === 0) {
    return (
      <section className="panel panel-translation">
        <div className="panel-header">
          <h2 className="panel-title">✍️ 译文</h2>
        </div>
        <div className="panel-body panel-empty">
          <div className="empty-hint">
            <div className="empty-icon">📑</div>
            <h3>等待上传文档</h3>
            <p>上传 TXT 或 PDF 后，每个段落将在此处提供翻译输入框</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel-translation" ref={panelRef}>
      <div className="panel-header sticky">
        <h2 className="panel-title">✍️ 译文</h2>
        <div className="panel-actions">
          <span className="panel-count">{paragraphs.length} 段待翻译</span>
        </div>
      </div>

      <div className="panel-body">
        <div className="translation-list">
          {paragraphs.map((p, idx) => {
            const translated = translations[p.id]?.trim();
            const isTranslated = !!translated;
            const isTranslating = translatingId === p.id;
            return (
              <div
                key={p.id}
                className={`translation-row ${isTranslated ? 'translated' : ''}`}
              >
                <div className="translation-row-index">{idx + 1}</div>
                <div className="translation-main">
                  <div className="original-preview">{p.text}</div>
                  <div className="translation-toolbar">
                    <span className="row-label">译文：</span>
                    <div className="toolbar-spacer" />
                    <button
                      className="btn btn-mini"
                      onClick={() => handleAutoTranslate(p.id, p.text)}
                      disabled={isTranslating}
                      title="调用机器翻译（模拟）"
                    >
                      {isTranslating ? (
                        <>
                          <span className="mini-spinner" /> 翻译中
                        </>
                      ) : (
                        <>🤖 机器翻译</>
                      )}
                    </button>
                    {translated && (
                      <button
                        className="btn btn-mini btn-outline"
                        onClick={() => setTranslation(p.id, '')}
                        title="清空译文"
                      >
                        🗑 清空
                      </button>
                    )}
                  </div>
                  <textarea
                    className="translation-input"
                    placeholder="请在此处输入译文…"
                    rows={3}
                    value={translations[p.id] || ''}
                    onChange={(e) => updateDebounced(p.id, e.target.value)}
                  />
                  <div className="translation-footer">
                    <span className="save-indicator">
                      {debounceTimers.current[p.id] ? (
                        <span className="saving">⏳ 保存中…</span>
                      ) : translated ? (
                        <span className="saved">✓ 已自动保存</span>
                      ) : (
                        <span className="unsaved">待翻译</span>
                      )}
                    </span>
                  </div>
                </div>
                <CommentBubble paragraphId={p.id} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
