import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSurveys } from '../api';

export default function SurveyList() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    try {
      const data = await getAllSurveys();
      setSurveys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">问卷管理</h1>
          <p className="page-subtitle">管理您创建的所有问卷</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/editor" className="btn">
            ＋ 创建问卷
          </Link>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            加载中...
          </div>
        ) : surveys.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>还没有问卷</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>
              点击上方按钮创建您的第一个问卷
            </p>
            <Link to="/admin/editor" className="btn btn-large">
              创建第一个问卷
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {surveys.map((s, idx) => (
              <div
                key={s.id}
                className="card fade-in"
                style={{ cursor: 'pointer', animationDelay: `${idx * 50}ms` }}
              >
                <h3 style={{ color: 'var(--primary)', marginBottom: 8, fontSize: 18 }}>
                  {s.title}
                </h3>
                {s.description && (
                  <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 16, minHeight: 36 }}>
                    {s.description.slice(0, 60)}{s.description.length > 60 ? '...' : ''}
                  </p>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 16 }}>
                  创建于 {new Date(s.created_at).toLocaleString('zh-CN')}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/admin/editor/${s.id}`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                    编辑
                  </Link>
                  <Link to={`/admin/responses/${s.id}`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                    数据
                  </Link>
                  <Link to={`/admin/share/${s.id}`} className="btn" style={{ padding: '6px 14px', fontSize: 13 }}>
                    分享
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
