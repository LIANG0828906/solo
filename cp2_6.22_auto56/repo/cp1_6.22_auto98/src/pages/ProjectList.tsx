import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Project {
  id: string;
  name: string;
  sourceLang: Language;
  targetLang: Language;
  createdAt: number;
}

const languageLabels: Record<Language, string> = {
  zh: '中文',
  en: '英文',
  ja: '日文',
  fr: '法文',
  de: '德文',
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sourceLang, targetLang }),
      });
      const data = await res.json();
      setName('');
      navigate(`/project/${data.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除该项目？')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    minWidth: '160px',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 700 }}>翻译项目</h1>

      <form
        onSubmit={handleCreate}
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
          alignItems: 'center',
          transition: 'transform 0.2s',
        }}
      >
        <input
          placeholder="项目名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value as Language)} style={inputStyle}>
          <option value="zh">中文</option>
          <option value="en">英文</option>
          <option value="ja">日文</option>
          <option value="fr">法文</option>
          <option value="de">德文</option>
        </select>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value as Language)} style={inputStyle}>
          <option value="zh">中文</option>
          <option value="en">英文</option>
          <option value="ja">日文</option>
          <option value="fr">法文</option>
          <option value="de">德文</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '创建中...' : '创建项目'}
        </button>
      </form>

      {projects.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
          }}
        >
          暂无项目，使用上方表单创建第一个翻译项目
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              style={{
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, flex: 1 }}>{p.name}</h3>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    borderRadius: '4px',
                    fontSize: '18px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--accent-secondary)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {languageLabels[p.sourceLang]}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--accent-secondary)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {languageLabels[p.targetLang]}
                </span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                创建于 {new Date(p.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
