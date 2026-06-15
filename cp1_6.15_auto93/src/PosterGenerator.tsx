import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import type { TourDate, Venue } from './types';

interface Props {
  tourDates: TourDate[];
  venues: Venue[];
}

const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
};

export default function PosterGenerator({ tourDates, venues }: Props) {
  const sortedDates = tourDates
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstDate = sortedDates.length > 0 ? new Date(sortedDates[0].date) : new Date();
  const lastDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1].date) : new Date();
  const tourId = `${firstDate.getFullYear()}${String(firstDate.getMonth() + 1).padStart(2, '0')}`;

  const [tourName, setTourName] = useState('2026 夏季巡演');
  const [subTitle, setSubTitle] = useState('Summer Tour · 独立乐队全国巡演');
  const [selectedDates, setSelectedDates] = useState<string[]>(
    sortedDates.map(d => d.id)
  );
  const [backgroundOption, setBackgroundOption] = useState<'gradient' | 'upload'>('gradient');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [visibleItems, setVisibleItems] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posterList = sortedDates
    .filter(d => selectedDates.includes(d.id))
    .map(d => ({
      date: `${new Date(d.date).getMonth() + 1}.${String(new Date(d.date).getDate()).padStart(2, '0')}`,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d.date).getDay()],
      city: d.city,
      venue: d.venueName,
      notes: d.notes
    }));

  const tourShareUrl = useRef('');

  const generateShareUrl = (): string => {
    const slug = slugify(tourName) || `${tourId}-tour`;
    const dateRange = `${firstDate.getMonth() + 1}${String(firstDate.getDate()).padStart(2, '0')}-${lastDate.getMonth() + 1}${String(lastDate.getDate()).padStart(2, '0')}`;
    const cities = posterList.map(p => encodeURIComponent(p.city)).join(',');
    const base = window.location.origin;
    return `${base}/tour/${tourId}/${slug}?dates=${dateRange}&stops=${posterList.length}&cities=${cities}`;
  };

  const generateQR = async () => {
    try {
      tourShareUrl.current = generateShareUrl();
      const dataUrl = await QRCode.toDataURL(tourShareUrl.current, {
        width: 100,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#ffffff',
          light: '#1a1a2e'
        }
      });
      setQrCodeUrl(dataUrl);
    } catch (e) {
      console.error('QR code error:', e);
    }
  };

  useEffect(() => {
    generateQR();
  }, [tourName, selectedDates]);

  const toggleDate = (id: string) => {
    setSelectedDates(prev =>
      prev.includes(id)
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawPoster = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (backgroundOption === 'upload' && uploadedImage) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(W / img.width, H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);

        const overlayGrad = ctx.createLinearGradient(0, 0, 0, H);
        overlayGrad.addColorStop(0, 'rgba(26, 26, 46, 0.4)');
        overlayGrad.addColorStop(0.5, 'rgba(26, 26, 46, 0.65)');
        overlayGrad.addColorStop(1, 'rgba(26, 26, 46, 0.85)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, W, H);

        drawContent(ctx, W, H);
      };
      img.src = uploadedImage;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#2d1b69');
      gradient.addColorStop(0.35, '#5a3f8f');
      gradient.addColorStop(0.65, '#a85d84');
      gradient.addColorStop(1, '#ffbf66');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      const noiseGrad = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.8);
      noiseGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
      noiseGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = noiseGrad;
      ctx.fillRect(0, 0, W, H);

      drawContent(ctx, W, H);
    }
  };

  const drawContent = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    let yPos = 80;

    const decorativeGrad = ctx.createLinearGradient(W * 0.35, yPos, W * 0.65, yPos + 3);
    decorativeGrad.addColorStop(0, 'rgba(255,255,255,0)');
    decorativeGrad.addColorStop(0.5, 'rgba(255,191,102,0.8)');
    decorativeGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = decorativeGrad;
    ctx.fillRect(W * 0.15, yPos, W * 0.7, 3);

    yPos += 40;
    ctx.save();
    ctx.font = 'bold 52px system-ui, -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tourName, W / 2, yPos);
    ctx.restore();

    yPos += 36;
    ctx.save();
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(subTitle, W / 2, yPos);
    ctx.restore();

    yPos += 40;
    ctx.strokeStyle = 'rgba(255,191,102,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, yPos);
    ctx.lineTo(W * 0.7, yPos);
    ctx.stroke();

    yPos += 50;
    const itemHeight = 62;
    const maxItems = Math.min(visibleItems, posterList.length);

    for (let i = 0; i < maxItems; i++) {
      const item = posterList[i];
      const itemY = yPos + i * itemHeight;

      ctx.save();
      const alpha = i < visibleItems ? Math.min((visibleItems - i) * 0.3 + 0.7, 1) : 0;
      ctx.globalAlpha = alpha;

      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffbf66';
      ctx.shadowColor = 'rgba(255,191,102,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(item.date, W * 0.1, itemY);

      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,191,102,0.6)';
      ctx.shadowBlur = 0;
      ctx.fillText(item.weekday, W * 0.1, itemY + 20);

      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillText(item.city, W * 0.22, itemY);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.shadowBlur = 2;
      ctx.fillText(item.venue, W * 0.22, itemY + 22);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.1, itemY + 42);
      ctx.lineTo(W * 0.82, itemY + 42);
      ctx.stroke();

      ctx.restore();
    }

    if (qrCodeUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        const qrW = 90, qrH = 90;
        const qrX = W - qrW - 50, qrY = H - qrH - 50;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 6, qrY - 6, qrW + 12, qrH + 12);

        ctx.drawImage(qrImg, qrX, qrY, qrW, qrH);

        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('扫码查看详情', qrX + qrW / 2, qrY + qrH + 20);
        ctx.shadowBlur = 0;
      };
      qrImg.src = qrCodeUrl;
    }

    ctx.save();
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText('🎸', 50, H - 55);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('独立乐队 · 摇滚不死', 50, H - 35);
    ctx.restore();

    const stars = [
      { x: W * 0.05, y: H * 0.08, r: 1.5 },
      { x: W * 0.92, y: H * 0.15, r: 1 },
      { x: W * 0.88, y: H * 0.35, r: 2 },
      { x: W * 0.06, y: H * 0.4, r: 1 },
      { x: W * 0.12, y: H * 0.7, r: 1.5 }
    ];
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    });
  };

  const handleGenerate = () => {
    setVisibleItems(0);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#ffbf66', '#ff9a3c', '#667eea', '#4ade80'],
      disableForReducedMotion: true
    });

    let count = 0;
    const animateStep = () => {
      count++;
      setVisibleItems(count);

      if (count <= posterList.length) {
        animationTimerRef.current = setTimeout(animateStep, 300);
      }
    };
    animateStep();
  };

  useEffect(() => {
    if (visibleItems >= 0) {
      const timer = setTimeout(() => drawPoster(), 50);
      return () => clearTimeout(timer);
    }
  }, [visibleItems, tourName, subTitle, backgroundOption, uploadedImage, qrCodeUrl, selectedDates]);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleItems(posterList.length), 200);
    return () => {
      clearTimeout(timer);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${tourName}-poster.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ffbf66', '#ff9a3c', '#ff6b6b', '#667eea']
    });
  };

  return (
    <div style={{ padding: 28, minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          color: '#fff',
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 6,
          letterSpacing: 0.5
        }}>
          海报生成
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          自定义巡演海报并一键下载分享
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            padding: 22,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4, height: 14,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              海报文字
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 6,
                letterSpacing: 0.3
              }}>
                巡演名称
              </label>
              <input
                type="text"
                value={tourName}
                onChange={e => setTourName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,191,102,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 6,
                letterSpacing: 0.3
              }}>
                副标题
              </label>
              <input
                type="text"
                value={subTitle}
                onChange={e => setSubTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,191,102,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            padding: 22,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4, height: 14,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              背景设置
            </h3>

            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14
            }}>
              <button
                onClick={() => setBackgroundOption('gradient')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: backgroundOption === 'gradient'
                    ? '1px solid rgba(255,191,102,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: backgroundOption === 'gradient'
                    ? 'rgba(255,191,102,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  color: backgroundOption === 'gradient' ? '#ffbf66' : 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                默认渐变
              </button>
              <button
                onClick={() => setBackgroundOption('upload')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: backgroundOption === 'upload'
                    ? '1px solid rgba(255,191,102,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: backgroundOption === 'upload'
                    ? 'rgba(255,191,102,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  color: backgroundOption === 'upload' ? '#ffbf66' : 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                本地上传
              </button>
            </div>

            {backgroundOption === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  border: '2px dashed rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,191,102,0.4)';
                  e.currentTarget.style.background = 'rgba(255,191,102,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {uploadedImage ? (
                  <div>
                    <img src={uploadedImage} alt="" style={{
                      maxHeight: 60,
                      maxWidth: '100%',
                      borderRadius: 6
                    }} />
                    <div style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 6
                    }}>点击更换图片</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: 2
                    }}>
                      点击上传背景图片
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      支持 JPG / PNG 格式
                    </div>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            padding: 22,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4, height: 14,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              演出场次
              <span style={{
                fontSize: 11,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.4)',
                marginLeft: 4
              }}>
                ({selectedDates.length})
              </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflow: 'auto', paddingRight: 4 }}>
              {sortedDates.map((td, idx) => {
                const checked = selectedDates.includes(td.id);
                return (
                  <div
                    key={td.id}
                    onClick={() => toggleDate(td.id)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: checked
                        ? 'rgba(255,191,102,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      border: checked
                        ? '1px solid rgba(255,191,102,0.25)'
                        : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s',
                      animation: `dateIn 0.3s ease ${idx * 0.05}s both`
                    }}
                  >
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: 7,
                      background: checked
                        ? 'linear-gradient(135deg, #ffbf66, #ff9a3c)'
                        : 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: checked ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
                      fontSize: 11,
                      fontWeight: checked ? 700 : 600,
                      flexShrink: 0
                    }}>
                      {new Date(td.date).getDate()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: checked ? 600 : 500,
                        color: checked ? '#ffbf66' : '#fff',
                        marginBottom: 2
                      }}>
                        {td.city} · {td.venueName}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)'
                      }}>
                        {new Date(td.date).getMonth() + 1}月
                      </div>
                    </div>
                    <div style={{
                      width: 18, height: 18,
                      borderRadius: 5,
                      border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      background: checked
                        ? 'linear-gradient(135deg, #ffbf66, #ff9a3c)'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a1a2e',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {checked ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleGenerate}
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
                color: '#1a1a2e',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(255,191,102,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,191,102,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,191,102,0.25)';
              }}
            >
              ✨ 生成海报
            </button>
            <button
              onClick={downloadPoster}
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              ⬇ 下载 PNG
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 18,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 700
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 560,
            marginBottom: 18
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4, height: 16,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              海报预览
            </h3>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6
            }}>
              500 × 700 px
            </div>
          </div>
          <div style={{
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
          }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={700}
              style={{
                display: 'block',
                width: 500,
                maxWidth: '100%',
                height: 'auto',
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dateIn {
          from { opacity: 0; transform: translateZ(0) translateX(-6px); }
          to { opacity: 1; transform: translateZ(0) translateX(0); }
        }
        .poster-canvas, .form-panel, .btn, .date-item {
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .poster-canvas {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
