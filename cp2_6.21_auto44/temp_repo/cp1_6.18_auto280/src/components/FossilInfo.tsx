import { useEffect, useRef } from 'react';
import { useFossilStore } from '@/store/useFossilStore';
import { Skull, Calendar, MapPin, FileText, Loader2 } from 'lucide-react';
import './FossilInfo.css';

function drawTrexOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const pad = 18;
  const sx = (w - pad * 2) / 280;
  const sy = (h - pad * 2) / 200;
  ctx.translate(pad, pad);
  ctx.scale(sx, sy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ground line
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(10, 188);
  ctx.lineTo(270, 188);
  ctx.stroke();
  ctx.setLineDash([]);

  // Main body outline
  const draw = (drawFn: () => void, color = '#FFD700', lw = 2.4, alpha = 0.95) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lw;
    ctx.beginPath();
    drawFn();
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // Tail
  draw(() => {
    ctx.moveTo(262, 108);
    ctx.quadraticCurveTo(275, 112, 272, 120);
    ctx.quadraticCurveTo(258, 126, 240, 124);
    ctx.quadraticCurveTo(218, 118, 198, 116);
    ctx.quadraticCurveTo(182, 114, 170, 108);
  });

  // Tail underline
  draw(() => {
    ctx.moveTo(272, 120);
    ctx.quadraticCurveTo(262, 136, 245, 140);
    ctx.quadraticCurveTo(222, 142, 200, 138);
    ctx.quadraticCurveTo(184, 134, 172, 128);
  }, '#FFD700', 2.0, 0.8);

  // Body top (back)
  draw(() => {
    ctx.moveTo(170, 108);
    ctx.quadraticCurveTo(150, 82, 118, 80);
    ctx.quadraticCurveTo(88, 82, 62, 96);
    ctx.quadraticCurveTo(46, 106, 36, 120);
  });

  // Body bottom (belly)
  draw(() => {
    ctx.moveTo(172, 128);
    ctx.quadraticCurveTo(168, 156, 145, 166);
    ctx.quadraticCurveTo(118, 172, 92, 168);
    ctx.quadraticCurveTo(64, 162, 48, 146);
    ctx.quadraticCurveTo(38, 136, 36, 122);
  }, '#FFD700', 2.0, 0.8);

  // Neck
  draw(() => {
    ctx.moveTo(36, 120);
    ctx.quadraticCurveTo(26, 102, 24, 88);
    ctx.quadraticCurveTo(22, 74, 28, 62);
    ctx.quadraticCurveTo(34, 54, 44, 52);
  });

  // Neck bottom
  draw(() => {
    ctx.moveTo(36, 122);
    ctx.quadraticCurveTo(32, 108, 32, 96);
    ctx.quadraticCurveTo(30, 82, 36, 72);
  }, '#FFD700', 2.0, 0.8);

  // Skull (top)
  draw(() => {
    ctx.moveTo(44, 52);
    ctx.quadraticCurveTo(36, 42, 28, 44);
    ctx.quadraticCurveTo(18, 46, 10, 54);
    ctx.quadraticCurveTo(4, 60, 2, 68);
    ctx.quadraticCurveTo(0, 76, 6, 82);
  });

  // Snout line
  draw(() => {
    ctx.moveTo(6, 82);
    ctx.quadraticCurveTo(2, 84, 2, 88);
    ctx.quadraticCurveTo(2, 92, 8, 92);
    ctx.quadraticCurveTo(18, 92, 30, 90);
    ctx.quadraticCurveTo(36, 90, 36, 88);
  });

  // Eye socket
  ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(24, 66, 5, 4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Nostril
  ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(10, 60, 1.6, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Teeth (simplified)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const tx = 12 + i * 4.2;
    ctx.beginPath();
    ctx.moveTo(tx, 82);
    ctx.lineTo(tx + 1.5, 88);
    ctx.lineTo(tx + 3, 82);
    ctx.stroke();
  }

  // Jaw joint hint
  draw(() => {
    ctx.moveTo(36, 82);
    ctx.quadraticCurveTo(30, 86, 28, 82);
  }, '#FFD700', 1.4, 0.6);

  // Front arm (tiny)
  draw(() => {
    ctx.moveTo(70, 120);
    ctx.quadraticCurveTo(62, 138, 58, 146);
    ctx.quadraticCurveTo(54, 150, 56, 152);
    ctx.moveTo(58, 146);
    ctx.quadraticCurveTo(62, 150, 64, 148);
  }, '#FFD700', 2.0, 0.9);

  // Hind leg (back, left)
  draw(() => {
    ctx.moveTo(132, 160);
    ctx.quadraticCurveTo(128, 175, 124, 188);
    ctx.moveTo(120, 178);
    ctx.quadraticCurveTo(114, 186, 112, 188);
  });

  // Hind foot (back)
  draw(() => {
    ctx.moveTo(124, 188);
    ctx.quadraticCurveTo(114, 190, 108, 188);
    ctx.moveTo(124, 188);
    ctx.lineTo(130, 190);
  }, '#FFD700', 2.0, 0.85);

  // Hind leg (front, right)
  draw(() => {
    ctx.moveTo(170, 150);
    ctx.quadraticCurveTo(172, 170, 178, 188);
    ctx.moveTo(172, 178);
    ctx.quadraticCurveTo(180, 184, 182, 188);
  });

  // Hind foot (front)
  draw(() => {
    ctx.moveTo(178, 188);
    ctx.quadraticCurveTo(188, 190, 192, 188);
    ctx.moveTo(178, 188);
    ctx.lineTo(172, 190);
  }, '#FFD700', 2.0, 0.85);

  // Claws (subtle)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
  ctx.lineWidth = 1.1;
  const clawGroups = [
    [108, 188], [110, 188], [112, 188],
    [170, 190], [178, 188], [186, 188], [192, 188]
  ];
  clawGroups.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 1.5, cy + 3.5);
    ctx.stroke();
  });

  // Spine/vertebrae hints
  ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const sxv = 165 - t * 125;
    const syv = 106 - (Math.sin(t * Math.PI) * 14);
    ctx.beginPath();
    ctx.ellipse(sxv, syv, 2.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ribcage hints
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.22)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const rbx = 152 - t * 90;
    const rby = 102 + (i === 2 ? 1 : 0);
    ctx.beginPath();
    ctx.moveTo(rbx, rby);
    ctx.quadraticCurveTo(rbx + 6, rby + 28, rbx + 2, rby + 54);
    ctx.stroke();
  }

  // Signature
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.font = 'italic 7px serif';
  ctx.fillText('Tyrannosaurus rex', 200, 198);

  ctx.restore();
}

export default function FossilInfo() {
  const { fossilDetail, fossilDetailLoading, fullyAssembled } = useFossilStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = 220;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawTrexOutline(ctx, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [fullyAssembled, fossilDetail]);

  const showContent = fossilDetail || fossilDetailLoading;

  return (
    <div className={`fossil-info-panel ${showContent ? 'visible' : ''}`}>
      <div className="panel-header">
        <Skull size={18} color="#FFD700" />
        <h3>化石档案</h3>
      </div>

      {fossilDetailLoading && (
        <div className="loading-state">
          <Loader2 size={22} className="spinner" />
          <span>正在加载化石数据...</span>
        </div>
      )}

      {fossilDetail && !fossilDetailLoading && (
        <div className="info-content">
          <div className="species-block">
            <div className="species-cn">{fossilDetail.speciesName}</div>
            <div className="species-latin">{fossilDetail.latinName}</div>
          </div>

          <div className="canvas-wrap">
            <canvas ref={canvasRef} className="outline-canvas" />
            <div className="canvas-caption">复原轮廓示意图</div>
          </div>

          <ul className="info-list">
            <li>
              <Calendar size={14} className="info-icon" />
              <div>
                <div className="info-label">生存年代</div>
                <div className="info-value">{fossilDetail.period}</div>
              </div>
            </li>
            <li>
              <MapPin size={14} className="info-icon" />
              <div>
                <div className="info-label">发现地点</div>
                <div className="info-value">{fossilDetail.location}</div>
              </div>
            </li>
            <li>
              <FileText size={14} className="info-icon" />
              <div>
                <div className="info-label">标本描述</div>
                <div className="info-value description">{fossilDetail.description}</div>
              </div>
            </li>
          </ul>
        </div>
      )}

      {!showContent && (
        <div className="empty-state">
          <div className="empty-illustration">
            <Skull size={40} className="empty-skull" />
          </div>
          <p className="empty-title">等待复原完成</p>
          <p className="empty-desc">清理所有骨骼碎片后，这里将显示化石的详细信息和复原图</p>
        </div>
      )}
    </div>
  );
}
