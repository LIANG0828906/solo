import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookManager } from '@/books/BookManager';
import { BookMetadata } from '@/types';
import { useStore } from '@/store';

const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { addBook } = useStore();
  const [inputMode, setInputMode] = useState<'isbn' | 'scan'>('isbn');
  const [isbn, setIsbn] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);
  const [preview, setPreview] = useState<BookMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<'reading' | 'finished' | 'wishlist'>('wishlist');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supportedISBNs = [
    '9787020002207',
    '9787544270878',
    '9787532748167',
    '9787544253994',
    '9787020024759',
    '9787559600790',
  ];

  const startScan = async () => {
    setScanning(true);
    setError(null);
    try {
      if (!BookManager.isBarcodeDetectorSupported()) {
        throw new Error('当前浏览器不支持条形码扫描，请使用手动输入方式');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      let found = false;
      let attempts = 0;
      const interval = setInterval(async () => {
        if (found || attempts > 60 || !videoRef.current) {
          clearInterval(interval);
          stopScan();
          if (!found) {
            setError('扫描超时，请重试或手动输入ISBN');
          }
          return;
        }
        attempts++;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(videoRef.current, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = await BookManager.detectBarcode(imageData);
          if (result) {
            found = true;
            clearInterval(interval);
            setScanResult(result);
            setIsbn(result);
            stopScan();
            handleFetch(result);
          }
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || '无法访问摄像头');
      setScanning(false);
    }
  };

  const stopScan = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const handleFetch = async (customIsbn?: string) => {
    const targetIsbn = (customIsbn || isbn).replace(/[-\s]/g, '').trim();
    if (!targetIsbn) {
      setError('请输入ISBN号');
      return;
    }
    if (!/^\d{8,15}$/.test(targetIsbn)) {
      setError('ISBN格式不正确，请输入8-15位数字');
      return;
    }
    setError(null);
    setFetching(true);
    setProgress({ percent: 5, message: '开始查询...' });
    try {
      const result = await BookManager.fetchMetadataByISBN(targetIsbn, (p) => setProgress(p));
      setPreview(result);
      setProgress({ percent: 100, message: '获取成功！' });
    } catch (err: any) {
      setError(err.message || '获取书籍信息失败');
      setProgress(null);
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async () => {
    if (!preview) return;
    setAdding(true);
    try {
      const book = await addBook({
        isbn: preview.isbn,
        title: preview.title,
        authors: preview.authors,
        coverUrl: preview.coverUrl,
        description: preview.description,
        status,
        totalPages: preview.pageCount || 0,
        pagesRead: 0,
        tags: [],
      });
      navigate(`/book/${book.id}`);
    } catch (err: any) {
      setError(err.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost"
        style={{ marginBottom: 24, padding: '8px 18px', fontSize: 13 }}
      >
        ← 返回
      </button>

      <div className="slide-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>➕ 添加书籍</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          通过ISBN或扫描条形码快速将书籍加入你的书架
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 28,
          padding: 4,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 14,
          width: 'fit-content',
        }}
        className="slide-up stagger-1"
      >
        <button
          onClick={() => { setInputMode('isbn'); setPreview(null); stopScan(); }}
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            background: inputMode === 'isbn' ? 'var(--accent)' : 'transparent',
            color: inputMode === 'isbn' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.25s ease',
            boxShadow: inputMode === 'isbn' ? '0 4px 16px rgba(108,99,255,0.4)' : 'none',
          }}
        >
          🔢 手动输入ISBN
        </button>
        <button
          onClick={() => { setInputMode('scan'); setPreview(null); }}
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            background: inputMode === 'scan' ? 'var(--accent)' : 'transparent',
            color: inputMode === 'scan' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.25s ease',
            boxShadow: inputMode === 'scan' ? '0 4px 16px rgba(108,99,255,0.4)' : 'none',
          }}
        >
          📷 扫描条形码
        </button>
      </div>

      <div
        className="glass-card slide-up stagger-2"
        style={{ padding: 32, marginBottom: 28 }}
      >
        {inputMode === 'isbn' ? (
          <>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10, display: 'block' }}>
              ISBN 号码
            </label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                className="input-field"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder="输入13位ISBN，例如：9787020002207"
                style={{ flex: 1 }}
              />
              <button
                className="btn-primary"
                onClick={() => handleFetch()}
                disabled={fetching}
              >
                {fetching ? '查询中...' : '🔍 查询书籍'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>快速填充：</span>
              {supportedISBNs.slice(0, 5).map((code) => (
                <button
                  key={code}
                  onClick={() => { setIsbn(code); handleFetch(code); }}
                  disabled={fetching}
                  style={{
                    fontSize: 11,
                    padding: '4px 12px',
                    background: 'rgba(108,99,255,0.12)',
                    border: '1px solid rgba(108,99,255,0.25)',
                    color: '#B4AEFF',
                    borderRadius: 20,
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(108,99,255,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(108,99,255,0.12)'; }}
                >
                  {code.slice(0, 3)}-{code.slice(3, 5)}-{code.slice(5, 9)}-{code.slice(9, 12)}-{code.slice(12)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 500,
                margin: '0 auto',
                aspectRatio: '4/3',
                background: '#000',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: scanning ? 'scaleX(1)' : 'scaleX(1)',
                }}
                playsInline
                muted
              />
              {!scanning && !scanResult && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1A1A2E, #2A2A4A)',
                    color: 'var(--text-muted)',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ fontSize: 64 }}>📷</div>
                  <div style={{ fontSize: 14 }}>点击下方按钮开始扫描ISBN条形码</div>
                </div>
              )}
              {scanning && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: '10%',
                      right: '10%',
                      top: '25%',
                      bottom: '25%',
                      border: '2px solid rgba(108,99,255,0.7)',
                      borderRadius: 8,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '10%',
                      right: '10%',
                      top: '50%',
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #6C63FF, transparent)',
                      animation: 'skeletonShimmer 1.5s infinite',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      color: '#fff',
                      fontSize: 13,
                      padding: '8px 20px',
                      background: 'rgba(0,0,0,0.6)',
                      margin: '0 20px',
                      borderRadius: 10,
                    }}
                  >
                    将条形码对准方框内...
                  </div>
                </>
              )}
              {scanResult && !scanning && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(74,222,128,0.15)',
                    color: '#4ADE80',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 56 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>扫描成功</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.8 }}>{scanResult}</div>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {!scanning ? (
                <button className="btn-primary" onClick={startScan}>
                  📷 开始扫描
                </button>
              ) : (
                <button className="btn-ghost" onClick={stopScan} style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                  ✕ 取消扫描
                </button>
              )}
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px dashed rgba(108,99,255,0.25)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#B4AEFF',
                  display: 'inline-block',
                  textAlign: 'left',
                }}
              >
                💡 若扫描不可用，建议使用Chrome/Edge浏览器，或切换到手动输入模式
              </div>
            </div>
          </div>
        )}

        {progress && fetching && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <span>{progress.message}</span>
              <span>{progress.percent}%</span>
            </div>
            <div
              style={{
                height: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress.percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent), #A78BFA)',
                  borderRadius: 10,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#FCA5A5',
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {preview && (
        <div className="glass-card slide-up stagger-3" style={{ padding: 32 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            ✨ 书籍信息预览
            <span
              style={{
                fontSize: 11,
                padding: '2px 10px',
                background: 'rgba(74,222,128,0.15)',
                color: '#4ADE80',
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              已找到
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: 28,
            }}
            className="preview-grid"
          >
            <div
              style={{
                aspectRatio: '2/3',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                background: '#FFFFFF10',
              }}
            >
              <img src={preview.coverUrl} alt={preview.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  background: 'rgba(108,99,255,0.12)',
                  border: '1px solid rgba(108,99,255,0.3)',
                  color: '#B4AEFF',
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  marginBottom: 12,
                }}
              >
                ISBN: {preview.isbn}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#fff' }}>
                {preview.title}
              </h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                {(preview.authors || []).join('、') || '未知作者'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                {preview.pageCount && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    📄 共 <strong style={{ color: '#fff' }}>{preview.pageCount}</strong> 页
                  </div>
                )}
                {preview.publishDate && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    📅 出版：<strong style={{ color: '#fff' }}>{preview.publishDate}</strong>
                  </div>
                )}
              </div>
              {preview.description && (
                <div
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    lineHeight: 1.7,
                    marginBottom: 20,
                    maxHeight: 160,
                    overflow: 'auto',
                  }}
                >
                  {preview.description}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
                  阅读状态
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { v: 'wishlist', label: '📌 想读', color: '#FBBF24' },
                    { v: 'reading', label: '📖 在读', color: '#6C63FF' },
                    { v: 'finished', label: '✅ 已读', color: '#4ADE80' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setStatus(opt.v as any)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 30,
                        fontSize: 12,
                        fontWeight: 600,
                        background: status === opt.v ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${status === opt.v ? opt.color : 'var(--glass-border)'}`,
                        color: status === opt.v ? opt.color : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={handleAdd} disabled={adding}>
                  {adding ? '添加中...' : '🎉 加入书架'}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => { setPreview(null); setIsbn(''); setError(null); }}
                >
                  重新查询
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 640px) {
              .preview-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AddBookPage;
