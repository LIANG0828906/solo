import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { getSurveyStats } from '../api';

export default function Share() {
  const { id } = useParams();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/s/${id}`;

  useEffect(() => {
    loadData();
    generateQR();
  }, [id]);

  async function loadData() {
    try {
      const data = await getSurveyStats(id!);
      setTitle(data.survey.title);
      setCount(data.count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateQR() {
    try {
      const url = await QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#546E7A',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('QR error:', e);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return <div className="page-container"><div className="card" style={{ textAlign: 'center', padding: 48 }}>加载中...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">分享问卷</h1>
          <p className="page-subtitle">{title}</p>
        </div>
        <div className="header-actions">
          <Link to={`/admin/responses/${id}`} className="btn">查看数据统计</Link>
          <Link to="/admin/surveys" className="btn btn-secondary">返回列表</Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <div className="card fade-in" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 20, fontSize: 16 }}>扫码作答</h3>
          {qrDataUrl ? (
            <div
              style={{
                display: 'inline-block',
                padding: 16,
                background: 'white',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <img src={qrDataUrl} alt="QR Code" style={{ display: 'block', width: 240, height: 240 }} />
            </div>
          ) : (
            <div style={{ width: 240, height: 240, margin: '0 auto', background: 'rgba(0,0,0,0.04)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              生成中...
            </div>
          )}
          <p style={{ marginTop: 16, color: 'var(--text-light)', fontSize: 13 }}>使用手机扫描二维码即可参与问卷</p>
        </div>

        <div className="card fade-in" style={{ animationDelay: '100ms' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 20, fontSize: 16 }}>问卷链接</h3>
          <div
            onClick={copyLink}
            style={{
              padding: '14px 16px',
              background: 'rgba(0, 188, 212, 0.06)',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--primary)',
              wordBreak: 'break-all',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 12
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 188, 212, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 188, 212, 0.06)'; }}
          >
            {shareUrl}
          </div>
          <button className="btn" onClick={copyLink} style={{ width: '100%', marginBottom: 24 }}>
            {copied ? '✓ 已复制' : '📋 复制链接'}
          </button>

          <div style={{ padding: '16px', background: 'rgba(84, 110, 122, 0.06)', borderRadius: 12 }}>
            <h4 style={{ color: 'var(--primary)', fontSize: 14, marginBottom: 12 }}>参与情况</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{count}</span>
              <span style={{ color: 'var(--text-light)', fontSize: 14 }}>人已参与</span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexDirection: 'column' }}>
            <Link to={`/s/${id}`} target="_blank" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🔗 在新窗口打开问卷
            </Link>
            <Link to={`/admin/editor/${id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              ✏️ 继续编辑问卷
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
