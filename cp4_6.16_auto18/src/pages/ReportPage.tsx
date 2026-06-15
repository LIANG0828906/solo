import React, { useState, useRef, useCallback } from 'react';
import { useMusicStore } from '../store/musicStore';

interface ReportData {
  totalCollected: number;
  topAlbums: Array<{
    id: string;
    name: string;
    artist: string;
    coverUrl: string;
    genre: string;
    likes: number;
  }>;
  favoriteGenre: string;
  genreDistribution: Record<string, number>;
  totalArtists: number;
  month: string;
  slogan: string;
}

export default function ReportPage() {
  const { getMonthlyReport, albums } = useMusicStore();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const data = getMonthlyReport();
      setReport(data);
      setIsGenerating(false);
    }, 500);
  }, [getMonthlyReport]);

  const downloadReport = useCallback(async () => {
    if (!reportRef.current || !report) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      const width = reportRef.current.offsetWidth * scale;
      const height = reportRef.current.offsetHeight * scale;
      canvas.width = width;
      canvas.height = height;

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f5a623';
      ctx.font = `${24 * scale}px system-ui, sans-serif`;
      ctx.fillText(`🎵 ${report.month}听歌报告`, 30 * scale, 50 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(report.slogan, 30 * scale, 80 * scale);

      ctx.fillStyle = '#6c63ff';
      ctx.fillRect(30 * scale, 100 * scale, width - 60 * scale, 3 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `${18 * scale}px system-ui, sans-serif`;
      ctx.fillText('📊 本月统计', 30 * scale, 140 * scale);

      ctx.font = `${14 * scale}px system-ui, sans-serif`;
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`• 新收藏专辑: ${report.totalCollected} 张`, 30 * scale, 170 * scale);
      ctx.fillText(`• 新关注歌手: ${report.totalArtists} 位`, 30 * scale, 195 * scale);
      ctx.fillText(`• 最爱风格: ${report.favoriteGenre || '暂无'}`, 30 * scale, 220 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `${18 * scale}px system-ui, sans-serif`;
      ctx.fillText('🏆 Top 3 最爱专辑', 30 * scale, 260 * scale);

      report.topAlbums.forEach((album, index) => {
        const y = 290 + index * 50;
        ctx.fillStyle = '#f5a623';
        ctx.font = `bold ${16 * scale}px system-ui, sans-serif`;
        ctx.fillText(`#${index + 1}`, 30 * scale, y * scale);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${14 * scale}px system-ui, sans-serif`;
        ctx.fillText(`${album.name} - ${album.artist}`, 70 * scale, y * scale);
        ctx.fillStyle = '#ff6b9d';
        ctx.fillText(`❤️ ${album.likes}`, width - 80 * scale, y * scale);
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = `${18 * scale}px system-ui, sans-serif`;
      ctx.fillText('🎸 风格分布', 30 * scale, 450 * scale);

      const genres = Object.entries(report.genreDistribution);
      const maxCount = Math.max(...Object.values(report.genreDistribution), 1);
      genres.forEach(([genre, count], index) => {
        const y = 480 + index * 35;
        ctx.fillStyle = '#cccccc';
        ctx.font = `${12 * scale}px system-ui, sans-serif`;
        ctx.fillText(genre, 30 * scale, y * scale);

        const barWidth = (count / maxCount) * 150 * scale;
        const barGradient = ctx.createLinearGradient(80 * scale, 0, 80 * scale + barWidth, 0);
        barGradient.addColorStop(0, '#6c63ff');
        barGradient.addColorStop(1, '#f5a623');
        ctx.fillStyle = barGradient;
        ctx.fillRect(80 * scale, (y - 12) * scale, barWidth, 20 * scale);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${count}`, 85 * scale + barWidth, y * scale);
      });

      ctx.fillStyle = '#6c63ff';
      ctx.font = `${12 * scale}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('© 音乐收藏馆', width / 2, height - 20 * scale);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${report.month}听歌报告.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  }, [report]);

  const totalAlbums = albums.length;

  return (
    <div className="page report-page">
      <div className="report-header">
        <h2>📊 月度听歌报告</h2>
        <p>记录你的音乐足迹，发现你的音乐偏好</p>
        {!report && (
          <button
            className="btn btn-primary generate-btn"
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner small"></span>
                生成中...
              </>
            ) : (
              <>🎨 生成本月报告</>
            )}
          </button>
        )}
      </div>

      {!report ? (
        <div className="report-empty">
          <div className="empty-report-card">
            <span className="empty-icon">📈</span>
            <h3>还没有生成报告</h3>
            <p>点击上方按钮生成你的专属听歌报告</p>
            <p className="report-stats-preview">
              目前已收藏 <strong>{totalAlbums}</strong> 张专辑
            </p>
          </div>
        </div>
      ) : (
        <div className="report-content">
          <div className="report-card" ref={reportRef}>
            <div className="report-card-header">
              <h3>🎵 {report.month}听歌报告</h3>
              <p className="report-slogan">"{report.slogan}"</p>
            </div>

            <div className="report-stats">
              <div className="report-stat-item">
                <span className="stat-icon">💿</span>
                <p className="stat-value">{report.totalCollected}</p>
                <p className="stat-label">新收藏专辑</p>
              </div>
              <div className="report-stat-item">
                <span className="stat-icon">🎤</span>
                <p className="stat-value">{report.totalArtists}</p>
                <p className="stat-label">新关注歌手</p>
              </div>
              <div className="report-stat-item">
                <span className="stat-icon">🎸</span>
                <p className="stat-value">{report.favoriteGenre || '—'}</p>
                <p className="stat-label">最爱风格</p>
              </div>
            </div>

            <div className="report-section">
              <h4>🏆 Top 3 最爱专辑</h4>
              {report.topAlbums.length > 0 ? (
                <div className="top-albums">
                  {report.topAlbums.map((album, index) => (
                    <div key={album.id} className="top-album-item">
                      <span className={`rank rank-${index + 1}`}>#{index + 1}</span>
                      <div className="top-album-cover">
                        {album.coverUrl ? (
                          <img src={album.coverUrl} alt={album.name} />
                        ) : (
                          <div className="default-cover small">
                            <span>💽</span>
                          </div>
                        )}
                      </div>
                      <div className="top-album-info">
                        <p className="top-album-name">{album.name}</p>
                        <p className="top-album-artist">{album.artist}</p>
                      </div>
                      <span className="top-album-likes">❤️ {album.likes}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">本月还没有点赞的专辑</p>
              )}
            </div>

            <div className="report-section">
              <h4>🎸 风格分布</h4>
              {Object.keys(report.genreDistribution).length > 0 ? (
                <div className="genre-distribution">
                  {Object.entries(report.genreDistribution).map(([genre, count]) => {
                    const max = Math.max(...Object.values(report.genreDistribution));
                    const percentage = ((count / max) * 100).toFixed(0);
                    return (
                      <div key={genre} className="genre-item">
                        <span className="genre-name">{genre}</span>
                        <div className="genre-bar-bg">
                          <div
                            className="genre-bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="genre-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">本月还没有收藏新专辑</p>
              )}
            </div>

            <div className="report-footer">
              <p>© 音乐收藏馆 · 用心珍藏每一段旋律</p>
            </div>
          </div>

          <div className="report-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setReport(null)}
            >
              🔄 重新生成
            </button>
            <button
              className="btn btn-primary"
              onClick={downloadReport}
            >
              📥 下载报告图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
