import { useState, useEffect, useRef } from 'react';
import TermHighlight from './TermHighlight';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Term {
  id: string;
  term: string;
  definition: string;
  language: Language;
}

interface TranslationEditorProps {
  sourceText: string;
  sourceLang: Language;
  targetLang: Language;
  existingTranslation?: string;
  terms: Term[];
  onSave: (translatedText: string) => void;
  onClose: () => void;
  onAddTerm: (term: string, definition: string, language: Language) => void;
}

export default function TranslationEditor({
  sourceText,
  sourceLang,
  targetLang,
  existingTranslation,
  terms,
  onSave,
  onClose,
  onAddTerm,
}: TranslationEditorProps) {
  const [suggestion, setSuggestion] = useState('');
  const [translation, setTranslation] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [termPopup, setTermPopup] = useState<{
    visible: boolean;
    selectedText: string;
    x: number;
    y: number;
    definition: string;
    language: Language;
  } | null>(null);
  const [addingTerm, setAddingTerm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestion = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          text: sourceText,
          sourceLang,
          targetLang,
        });
        const res = await fetch(`/api/translate?${params}`);
        const data = await res.json();
        setSuggestion(data.translation);
        if (!existingTranslation) {
          setTranslation(data.translation);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestion();
  }, [sourceText, sourceLang, targetLang]);

  useEffect(() => {
    if (existingTranslation) {
      setTranslation(existingTranslation);
    }
  }, [existingTranslation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (termPopup && !(e.target as HTMLElement).closest('.term-popup')) {
        setTermPopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [termPopup]);

  const handleSave = async () => {
    if (!translation.trim()) return;
    setSaving(true);
    onSave(translation);
    setTimeout(() => setSaving(false), 400);
  };

  const handleSelection = (selected: string, rect: DOMRect, language: Language) => {
    setTermPopup({
      visible: true,
      selectedText: selected,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
      definition: '',
      language,
    });
  };

  const handleAddTerm = async () => {
    if (!termPopup || !termPopup.selectedText || !termPopup.definition.trim()) return;
    setAddingTerm(true);
    onAddTerm(termPopup.selectedText, termPopup.definition, termPopup.language);
    setTimeout(() => {
      setAddingTerm(false);
      setTermPopup(null);
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        ref={editorRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          backgroundColor: 'rgba(26, 26, 46, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>翻译编辑</h3>
          <button
            onClick={onClose}
            style={{
              padding: '6px 10px',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              fontSize: '18px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            源文本
          </div>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-color)',
              lineHeight: 1.7,
              fontSize: '14px',
              userSelect: 'text',
            }}
          >
            <TermHighlight
              text={sourceText}
              terms={terms.filter((t) => t.language === sourceLang)}
              onSelection={(sel, rect) => handleSelection(sel, rect, sourceLang)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🤖</span>
            <span>机器翻译建议</span>
            {loading && <span style={{ fontSize: '11px' }}>生成中...</span>}
          </div>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-success)',
              lineHeight: 1.7,
              fontSize: '14px',
              minHeight: '50px',
            }}
          >
            {loading ? '...' : suggestion}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            您的翻译
          </div>
          <textarea
            ref={textareaRef}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            onMouseUp={(e) => {
              const selection = window.getSelection();
              if (!selection || selection.isCollapsed) return;
              const selected = selection.toString().trim();
              if (!selected) return;
              const rect = selection.getRangeAt(0).getBoundingClientRect();
              handleSelection(selected, rect, targetLang);
            }}
            style={{
              flex: 1,
              minHeight: '120px',
              padding: '14px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: 1.7,
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            placeholder="输入您的翻译..."
          />
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '6px',
            }}
          >
            提示：在上方或此处选中文本可添加为术语
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !translation.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: '14px',
            opacity: saving || !translation.trim() ? 0.6 : 1,
            cursor: saving || !translation.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '已保存 ✓' : '保存翻译'}
        </button>

        {termPopup && termPopup.visible && (
          <div
            className="term-popup"
            style={{
              position: 'fixed',
              left: Math.min(Math.max(termPopup.x, 150), window.innerWidth - 150),
              top: Math.min(termPopup.y, window.innerHeight - 220),
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              width: '280px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 1001,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              添加术语
            </div>
            <div
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(255,235,59,0.1)',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '13px',
                color: '#ffd700',
                fontWeight: 500,
              }}
            >
              {termPopup.selectedText}
            </div>
            <input
              autoFocus
              value={termPopup.definition}
              onChange={(e) => setTermPopup({ ...termPopup, definition: e.target.value })}
              placeholder="输入术语释义..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTerm();
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setTermPopup(null)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddTerm}
                disabled={addingTerm || !termPopup.definition.trim()}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: addingTerm || !termPopup.definition.trim() ? 0.6 : 1,
                }}
              >
                {addingTerm ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 400px"] {
            width: 100vw !important;
          }
        }
      `}</style>
    </div>
  );
}
