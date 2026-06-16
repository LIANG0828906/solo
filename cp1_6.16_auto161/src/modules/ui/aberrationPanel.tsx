import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Activity, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function AberrationPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { aberrationData } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 44;
    const padR = 16;
    const padT = 20;
    const padB = 32;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    ctx.fillStyle = '#181820';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(58, 58, 69, 0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = padL + (plotW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(102, 217, 239, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH / 2);
    ctx.lineTo(w - padR, padT + plotH / 2);
    ctx.stroke();

    const data = aberrationData;
    const datasets = [
      { key: 'spherical', color: '#66D9EF', label: '球差', data: data?.spherical || [] },
      { key: 'coma', color: '#F92672', label: '彗差', data: data?.coma || [] },
      { key: 'chromatic', color: '#AE81FF', label: '色差', data: data?.chromatic || [] },
    ];

    const allVals = datasets.flatMap((d) => d.data.map((p) => p.aberration));
    const maxAbs = allVals.length > 0 ? Math.max(...allVals.map(Math.abs), 0.5) : 1;

    ctx.font = '10px monospace';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const val = maxAbs - (2 * maxAbs / 5) * i;
      const y = padT + (plotH / 5) * i;
      ctx.fillText(val.toFixed(2), padL - 6, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i <= 5; i++) {
      const x = padL + (plotW / 5) * i;
      ctx.fillText(`${(i * 20).toFixed(0)}%`, x, h - padB + 16);
    }

    ctx.fillStyle = '#666';
    ctx.font = '9px system-ui';
    ctx.fillText('视场', w / 2, h - 6);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('波像差 (λ)', 0, 0);
    ctx.restore();

    datasets.forEach((ds) => {
      if (!ds.data.length) return;
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ds.data.forEach((p, i) => {
        const x = padL + (p.field / 100) * plotW;
        const y = padT + plotH / 2 - (p.aberration / maxAbs) * (plotH / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = ds.color;
      ds.data.forEach((p) => {
        const x = padL + (p.field / 100) * plotW;
        const y = padT + plotH / 2 - (p.aberration / maxAbs) * (plotH / 2);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    if (!data) {
      ctx.fillStyle = '#333';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无像差数据', padL + plotW / 2, padT + plotH / 2 - 10);
      ctx.font = '10px system-ui';
      ctx.fillStyle = '#2A2A3A';
      ctx.fillText('执行光线追迹后生成', padL + plotW / 2, padT + plotH / 2 + 12);
    }

    let legendX = padL + 10;
    ctx.font = '10px system-ui';
    datasets.forEach((ds) => {
      ctx.fillStyle = ds.color;
      ctx.fillRect(legendX, h - 10, 10, 3);
      ctx.fillStyle = '#888';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ds.label, legendX + 14, h - 8);
      legendX += ctx.measureText(ds.label).width + 36;
    });
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }, [aberrationData]);

  const rms = aberrationData?.rmsWavefrontError ?? 0;
  const strehl = aberrationData?.strehlRatio ?? 0;
  const isStrehlLow = aberrationData && strehl < 0.8;

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: '#1F1F28', backgroundColor: '#2A2A35' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#E0E0E0' }}>
          像差分析
        </h2>
        <div className="flex items-center gap-1.5">
          <Activity size={14} style={{ color: '#66D9EF' }} />
          <span className="text-xs" style={{ color: '#666' }}>
            {aberrationData ? '已分析' : '待分析'}
          </span>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ backgroundColor: '#181820' }}
      >
        <div className="px-3 py-3">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: '#22222D',
                borderColor: '#32323F',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Layers size={12} style={{ color: '#66D9EF' }} />
                <span className="text-[11px]" style={{ color: '#777' }}>
                  RMS 波前误差
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-semibold font-mono"
                  style={{ color: rms > 0.25 ? '#F92672' : rms > 0.1 ? '#E6DB74' : '#A6E22E' }}
                >
                  {rms.toFixed(3)}
                </span>
                <span className="text-[10px]" style={{ color: '#555' }}>λ</span>
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#444' }}>
                {rms === 0 ? '—' : rms < 0.071 ? '瑞利极限内 ✓' : rms < 0.25 ? '一般' : '偏差较大'}
              </div>
            </div>

            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: '#22222D',
                borderColor: isStrehlLow ? 'rgba(249, 38, 114, 0.4)' : '#32323F',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {isStrehlLow ? (
                  <AlertTriangle size={12} style={{ color: '#F92672' }} />
                ) : (
                  <CheckCircle2 size={12} style={{ color: '#A6E22E' }} />
                )}
                <span className="text-[11px]" style={{ color: '#777' }}>
                  斯特列尔比
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-semibold font-mono"
                  style={{ color: isStrehlLow ? '#F92672' : '#A6E22E' }}
                >
                  {strehl.toFixed(3)}
                </span>
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: isStrehlLow ? '#F92672' : '#444' }}
              >
                {strehl === 0 ? '—' : isStrehlLow ? '⚠ 低于衍射极限' : strehl >= 0.95 ? '接近衍射极限' : '合格'}
              </div>
            </div>
          </div>

          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: '#252530' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(strehl * 100, 100)}%`,
                backgroundColor: isStrehlLow ? '#F92672' : '#A6E22E',
                boxShadow: isStrehlLow
                  ? '0 0 10px rgba(249, 38, 114, 0.4)'
                  : '0 0 10px rgba(166, 226, 46, 0.4)',
              }}
            />
          </div>
        </div>

        <div className="px-3 pb-3 flex-1 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={360}
            height={220}
            className="rounded-lg"
            style={{
              border: '1px solid #2A2A35',
              maxWidth: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
