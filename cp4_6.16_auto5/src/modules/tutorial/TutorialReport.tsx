import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timingService, TimingResult } from '../../services/TimingService';

interface TutorialReportProps {
  totalSteps: number;
  estimatedTotalSeconds?: number;
  user: { username: string } | null;
  onUploadComplete?: (imageData: string) => void;
}

const gradeStyles: Record<string, { emoji: string; bg: string }> = {
  A: { emoji: '🏆', bg: 'linear-gradient(135deg, #FFD700, #C9A961)' },
  B: { emoji: '💎', bg: 'linear-gradient(135deg, #A67C52, #8B5E3C)' },
  C: { emoji: '🧵', bg: 'linear-gradient(135deg, #8B5E3C, #6B4423)' },
  D: { emoji: '🌱', bg: 'linear-gradient(135deg, #A67C52, #8B6F47)' },
};

export default function TutorialReport({
  totalSteps,
  estimatedTotalSeconds,
  user,
  onUploadComplete,
}: TutorialReportProps) {
  const [result, setResult] = useState<TimingResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    timingService.loadFromStorage();
    const report = timingService.calculateResult(totalSteps, estimatedTotalSeconds);
    setResult(report);
  }, [totalSteps, estimatedTotalSeconds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setPreviewImage(data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!previewImage) return;

    const photos = JSON.parse(localStorage.getItem('leather_photos') || '[]');
    const newPhoto = {
      id: Date.now(),
      imageUrl: previewImage,
      author: user?.username || '匿名皮友',
      userId: user?.username || 'anonymous',
      createdAt: new Date().toISOString(),
      title: '我的手工钱包成品',
    };
    photos.unshift(newPhoto);
    localStorage.setItem('leather_photos', JSON.stringify(photos));
    localStorage.removeItem('leather_timing');

    setUploaded(true);
    onUploadComplete?.(previewImage);

    setTimeout(() => {
      navigate('/community');
    }, 1500);
  };

  const handleStartOver = () => {
    timingService.clear();
    localStorage.removeItem('leather_timing');
    window.location.reload();
  };

  if (!result) {
    return (
      <div className="paper-card" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="empty-icon">📜</div>
        <p>正在生成报告...</p>
      </div>
    );
  }

  const style = gradeStyles[result.score.grade] || gradeStyles.D;

  return (
    <div className="report-card fade-in">
      <div className="paper-card">
        <h2 className="report-title">✨ 成绩单 ✨</h2>

        <div
          className="report-stats"
          style={{
            marginBottom: '16px',
          }}
        >
          <div className="report-stat">
            <div className="report-stat-label">总耗时</div>
            <div className="report-stat-value" style={{ fontSize: '22px' }}>
              {result.formattedTime}
            </div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">预计时间</div>
            <div className="report-stat-value" style={{ fontSize: '22px' }}>
              {result.formattedEstimatedTime}
            </div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">完成步骤</div>
            <div className="report-stat-value" style={{ fontSize: '22px' }}>
              {result.completedSteps} / {result.totalSteps}
            </div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">完成度</div>
            <div className="report-stat-value" style={{ fontSize: '22px' }}>
              {Math.round(result.completionRate * 100)}%
            </div>
          </div>
        </div>

        <div
          className="report-score"
          style={{
            marginTop: '16px',
          }}
        >
          <div
            className="score-circle"
            style={{
              background: `conic-gradient(${result.score.gradeColor} calc(var(--score) * 1%), var(--color-paper-dark) 0)`,
              ['--score' as string]: result.score.score,
              width: '160px',
              height: '160px',
            }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', letterSpacing: '2px', color: result.score.gradeColor }}>
                {style.emoji} 等级 {result.score.grade}
              </div>
              <span
                className="score-value"
                style={{
                  fontSize: '40px',
                  color: result.score.gradeColor,
                }}
              >
                {result.score.score}
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: '12px',
              fontSize: '16px',
              fontWeight: 600,
              color: result.score.gradeColor,
              letterSpacing: '2px',
            }}
          >
            {result.score.gradeDescription}
          </div>
          {result.timeRatio > 0 && (
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
              用时比例: 预计的 {Math.round(result.timeRatio * 100)}%
            </div>
          )}
        </div>

        <div className="report-encouragement">「{result.encouragement}」</div>

        {result.stepDetails.length > 0 && (
          <div style={{ margin: '24px 0', textAlign: 'left' }}>
            <h3
              style={{
                color: 'var(--color-leather-dark)',
                marginBottom: '12px',
              }}
            >
              📋 各步骤耗时
            </h3>
            <div
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              {result.stepDetails
                .sort((a, b) => a.stepId - b.stepId)
                .map((detail) => (
                  <div
                    key={detail.stepId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px dashed rgba(139,94,60,0.2)',
                      fontSize: '14px',
                    }}
                  >
                    <span>步骤 {detail.stepId}</span>
                    <span
                      style={{
                        color: 'var(--color-leather-dark)',
                        fontWeight: 600,
                      }}
                    >
                      {timingService.formatTime(detail.elapsedSeconds)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="upload-section">
          <h3>📸 上传你的成品照片</h3>
          <p
            style={{
              color: 'var(--color-leather)',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            与皮友们分享你的手作成果吧！
          </p>

          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="upload-input"
            onChange={handleFileChange}
          />
          <label htmlFor="photo-upload" className="upload-label">
            📷 选择照片
          </label>

          {previewImage && (
            <>
              <img src={previewImage} alt="预览" className="preview-image" />
              {!uploaded ? (
                <button className="leather-btn" onClick={handleUpload}>
                  ⬆ 发布到社区
                </button>
              ) : (
                <div
                  style={{
                    color: '#27ae60',
                    fontWeight: 600,
                    marginTop: '16px',
                  }}
                >
                  ✅ 发布成功！即将跳转到社区...
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button className="leather-btn" onClick={() => navigate('/community')}>
            🎨 去社区看看
          </button>
          <button
            className="leather-btn"
            onClick={handleStartOver}
            style={{
              background: 'linear-gradient(145deg, #A67C52, #8B5E3C)',
            }}
          >
            🔄 再做一个
          </button>
        </div>
      </div>
    </div>
  );
}
