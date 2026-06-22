import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TranslationEditor from '@/components/TranslationEditor';
import TermHighlight from '@/components/TermHighlight';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Project {
  id: string;
  name: string;
  sourceLang: Language;
  targetLang: Language;
  createdAt: number;
}

interface TranslationMemory {
  id: string;
  projectId: string;
  sourceText: string;
  translatedText: string;
  createdAt: number;
}

interface Term {
  id: string;
  term: string;
  definition: string;
  language: Language;
  createdAt: number;
}

const languageLabels: Record<Language, string> = {
  zh: '中文',
  en: '英文',
  ja: '日文',
  fr: '法文',
  de: '德文',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sentences, setSentences] = useState<string[]>([]);
  const [translations, setTranslations] = useState<TranslationMemory[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [editingSentence, setEditingSentence] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sentencesRes, termsRes] = await Promise.all([
        fetch(`/api/projects/${id}/sentences`),
        fetch('/api/terms'),
      ]);
      const sentencesData = await sentencesRes.json();
      const termsData = await termsRes.json();
      setProject(sentencesData.project);
      setSentences(sentencesData.sentences || []);
      setTranslations(sentencesData.translations || []);
      setTerms(termsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSaveTranslation = async (translatedText: string) => {
    if (!id || !editingSentence) return;
    try {
      const res = await fetch(`/api/projects/${id}/translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: editingSentence, translatedText }),
      });
      const saved = await res.json();
      setTranslations((prev) => {
        const existing = prev.findIndex((t) => t.sourceText === editingSentence);
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setTimeout(() => setEditingSentence(null), 500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTerm = async (term: string, definition: string, language: Language) => {
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition, language }),
      });
      const newTerm = await res.json();
      setTerms((prev) => [...prev, newTerm]);
    } catch (e) {
      console.error(e);
    }
  };

  const getTranslationFor = (text: string) => {
    const found = translations.find((t) => t.sourceText === text);
    return found?.translatedText;
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}/export`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'translation-memory'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>项目不存在</p>
        <Link
          to="/"
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent-primary)',
            borderRadius: 'var(--radius)',
            color: '#fff',
            display: 'inline-block',
          }}
        >
          返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <Link
            to="/"
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              display: 'inline-block',
            }}
          >
            ← 返回项目列表
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
            {project.name}
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 12px',
                backgroundColor: 'var(--accent-secondary)',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              {languageLabels[project.sourceLang]}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span
              style={{
                padding: '4px 12px',
                backgroundColor: 'var(--accent-secondary)',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              {languageLabels[project.targetLang]}
            </span>
            <span
              style={{
                marginLeft: '12px',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {translations.length}/{sentences.length} 已翻译
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/terms')}
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
            }}
          >
            术语库
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            导出 JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sentences.map((sentence, index) => {
          const existing = getTranslationFor(sentence);
          const isTranslated = !!existing;
          return (
            <div
              key={`${sentence}-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                border: `1px solid ${isTranslated ? 'rgba(76, 175, 80, 0.3)' : 'var(--border-color)'}`,
                alignItems: 'flex-start',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  #{index + 1} 源文本
                </div>
                <div style={{ fontSize: '15px', lineHeight: 1.7 }}>
                  <TermHighlight
                    text={sentence}
                    terms={terms.filter((t) => t.language === project.sourceLang)}
                  />
                </div>
                {existing && (
                  <div style={{ marginTop: '12px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      翻译
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: 'var(--text-success)',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(76, 175, 80, 0.06)',
                        borderRadius: '4px',
                        borderLeft: '3px solid var(--text-success)',
                      }}
                    >
                      <TermHighlight
                        text={existing}
                        terms={terms.filter((t) => t.language === project.targetLang)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditingSentence(sentence)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: isTranslated ? 'rgba(76, 175, 80, 0.12)' : 'var(--accent-secondary)',
                  color: isTranslated ? 'var(--text-success)' : '#fff',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  fontWeight: isTranslated ? 600 : 500,
                  border: isTranslated ? '1px solid rgba(76, 175, 80, 0.5)' : 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {isTranslated ? '✓ 已翻译' : '查看/编辑翻译'}
              </button>
            </div>
          );
        })}
      </div>

      {editingSentence && (
        <TranslationEditor
          sourceText={editingSentence}
          sourceLang={project.sourceLang}
          targetLang={project.targetLang}
          existingTranslation={getTranslationFor(editingSentence)}
          terms={terms}
          onSave={handleSaveTranslation}
          onClose={() => setEditingSentence(null)}
          onAddTerm={handleAddTerm}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
