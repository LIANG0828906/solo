import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../App';
import confetti from 'canvas-confetti';
import type { MergedDish } from '../types';

export default function CheckoutPanel() {
  const { state, doCheckout } = useApp();
  const [open, setOpen] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { threshold, discount } = state.discountRule;
  const originalTotal = useMemo(
    () => state.merged.reduce((s, x: MergedDish) => s + x.dish.price, 0),
    [state.merged],
  );
  const willReach = originalTotal >= threshold;
  const diffToReach = Math.max(0, threshold - originalTotal);
  const discountApplied = willReach ? discount : 0;
  const displayFinal = originalTotal - discountApplied;

  useEffect(() => {
    if (state.group && state.merged.length > 0) {
      doCheckout();
    }
  }, [state.group?.id, state.merged.length, originalTotal]);

  useEffect(() => {
    setShowPoster(false);
  }, [state.checkout]);

  function drawPoster() {
    const canvas = canvasRef.current;
    if (!canvas || !state.checkout || !state.group) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 720;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fff3cf');
    bg.addColorStop(1, '#ffd6a0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 8; i++) {
      const r = 60 + i * 20;
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(80 + (i % 3) * 200, 80 + Math.floor(i / 3) * 300, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    roundRect(ctx, 30, 30, W - 60, H - 60, 28);
    ctx.fill();
    ctx.shadowColor = 'rgba(140,100,60,0.18)';
    ctx.shadowBlur = 20;
    roundRect(ctx, 30, 30, W - 60, H - 60, 28);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#c25f25';
    ctx.font = 'bold 48px "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.fillText('🍱 聚味轩', 70, 120);

    ctx.fillStyle = '#6b5b4a';
    ctx.font = '22px "Noto Sans SC", sans-serif';
    ctx.fillText('多人拼单 · 美味不浪费', 70, 160);

    const headerGrad = ctx.createLinearGradient(70, 200, W - 70, 260);
    headerGrad.addColorStop(0, '#e07a3c');
    headerGrad.addColorStop(1, '#c25f25');
    ctx.fillStyle = headerGrad;
    roundRect(ctx, 70, 200, W - 140, 70, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.fillText(`拼单结算单 · ${state.group.members.length}人聚餐`, 100, 246);
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px "Noto Serif SC", serif';
    ctx.fillText(`¥${state.checkout.finalTotal.toFixed(1)}`, W - 100, 246);

    let y = 310;
    ctx.fillStyle = '#3b2f24';
    ctx.font = 'bold 22px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🥘 套餐菜品', 70, y);
    y += 10;

    ctx.strokeStyle = '#f0e2c4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(70, y + 14);
    ctx.lineTo(W - 70, y + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 40;

    const dishes = state.merged.slice(0, 6);
    for (const md of dishes) {
      ctx.font = '50px serif';
      ctx.textAlign = 'left';
      ctx.fillText(md.dish.emoji, 70, y + 8);
      ctx.fillStyle = '#3b2f24';
      ctx.font = 'bold 22px "Noto Sans SC", sans-serif';
      ctx.fillText(md.dish.name, 140, y);
      ctx.fillStyle = '#6b5b4a';
      ctx.font = '18px "Noto Sans SC", sans-serif';
      ctx.fillText(`${md.count}人想吃`, 140, y + 28);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c25f25';
      ctx.font = 'bold 26px "Noto Serif SC", serif';
      ctx.fillText(`¥${md.dish.price}`, W - 70, y + 6);
      y += 58;
    }
    if (state.merged.length > 6) {
      ctx.fillStyle = '#6b5b4a';
      ctx.font = '18px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`…… 还有 ${state.merged.length - 6} 道菜，尽情享用吧！`, W / 2, y + 10);
      y += 40;
    }

    y += 20;
    ctx.strokeStyle = '#f0e2c4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(W - 70, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 30;

    ctx.fillStyle = '#3b2f24';
    ctx.font = 'bold 22px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💰 费用明细', 70, y);
    y += 34;

    function moneyRow(label: string, value: string, opts?: { bold?: boolean; color?: string; tag?: string }) {
      ctx.fillStyle = opts?.color || '#6b5b4a';
      ctx.font = `${opts?.bold ? 'bold ' : ''}20px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(label, 90, y);
      if (opts?.tag) {
        ctx.fillStyle = '#2e7d32';
        ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
        ctx.fillText(opts.tag, 90 + ctx.measureText(label).width + 14, y);
      }
      ctx.fillStyle = opts?.color || '#3b2f24';
      ctx.textAlign = 'right';
      ctx.font = `${opts?.bold ? 'bold ' : ''}22px "Noto Serif SC", serif`;
      ctx.fillText(value, W - 90, y);
      y += 32;
    }
    moneyRow('套餐原价', `¥${state.checkout.originalTotal.toFixed(2)}`);
    if (state.checkout.discountApplied > 0) {
      moneyRow('满减优惠', `-¥${state.checkout.discountApplied.toFixed(2)}`, { color: '#2e7d32', tag: `满${threshold}减${discount}` });
    } else {
      moneyRow('距离满减', `还差 ¥${diffToReach.toFixed(2)}`, { color: '#8b7355' });
    }
    moneyRow('实付金额', `¥${state.checkout.finalTotal.toFixed(2)}`, { bold: true, color: '#c25f25' });

    y += 20;
    ctx.fillStyle = '#3b2f24';
    ctx.font = 'bold 22px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💸 AA 分摊', 70, y);
    y += 12;
    ctx.strokeStyle = '#f0e2c4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(70, y + 14);
    ctx.lineTo(W - 70, y + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 36;

    const splits = state.checkout.splits;
    for (const sp of splits) {
      ctx.fillStyle = '#6b5b4a';
      ctx.font = '20px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👤 ${sp.memberName}`, 90, y);
      ctx.fillStyle = '#c25f25';
      ctx.textAlign = 'right';
      ctx.font = 'bold 24px "Noto Serif SC", serif';
      ctx.fillText(`¥${sp.amount.toFixed(1)}`, W - 90, y);
      y += 34;
    }

    y += 16;
    const footerGrad = ctx.createLinearGradient(70, y, W - 70, y + 60);
    footerGrad.addColorStop(0, '#66bb6a');
    footerGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = footerGrad;
    roundRect(ctx, 70, y, W - 140, 60, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Noto Serif SC", serif';
    ctx.fillText('🎉 聚餐愉快 · 好吃下次再来！', W / 2, y + 38);

    y += 90;
    ctx.fillStyle = '#8b7355';
    ctx.font = '14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    const ts = new Date(state.group.createdAt).toLocaleString('zh-CN');
    ctx.fillText(`生成时间：${ts} · 小组ID：${state.group.id.slice(0, 12)}`, W / 2, y);
  }

  function handleDownloadPoster() {
    if (!canvasRef.current) return;
    drawPoster();
    setTimeout(() => {
      const canvas = canvasRef.current!;
      const link = document.createElement('a');
      link.download = `聚味轩拼单_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      fireConfetti();
    }, 60);
  }

  function fireConfetti() {
    const duration = 2200;
    const end = Date.now() + duration;
    const colors = ['#e07a3c', '#4caf50', '#2196f3', '#ffc107', '#ff7043', '#ab47bc'];
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 40,
      origin: { y: 0.55 },
      colors,
    });
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const co = state.checkout;

  return (
    <>
      <div className="checkout-bar">
        <div className="checkout-inner">
          <div className="checkout-summary">
            {!state.group ? (
              <div style={{ fontSize: 14, color: 'var(--text-soft)' }}>
                💡 创建拼单小组后即可查看结算信息
              </div>
            ) : (
              <>
                <div className="summary-line">
                  菜品
                  <b>{state.merged.length}种</b>
                </div>
                <div className="summary-line">
                  原价
                  <b>¥{originalTotal.toFixed(2)}</b>
                </div>
                <div className={`summary-line ${willReach ? 'discount' : ''}`}>
                  {willReach ? '满减' : '距满减'}
                  {willReach ? (
                    <>
                      <b>-¥{discountApplied}</b>
                      <span className="summary-tag">🎉 满{threshold}减{discount}</span>
                    </>
                  ) : (
                    <b>¥{diffToReach.toFixed(2)}</b>
                  )}
                </div>
                <div className="summary-line final">
                  实付
                  <b>¥{(co ? co.finalTotal : displayFinal).toFixed(2)}</b>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {co && co.splits.length > 0 && (
              <button
                className="btn btn-success"
                onClick={() => {
                  setOpen(!open);
                  if (!open) setTimeout(() => drawPoster(), 80);
                }}
              >
                {open ? '收起详情' : '📊 查看明细'}
              </button>
            )}
            <button
              className="btn btn-primary"
              disabled={!co || co.splits.length === 0}
              onClick={handleDownloadPoster}
            >
              📸 下载海报
            </button>
          </div>
        </div>

        <div className={`checkout-expand ${open ? 'open' : ''}`}>
          <div className="checkout-expand-inner">
            <h3 className="section-title">费用分摊明细</h3>
            {co && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg, #fff4dc 0%, #ffe2b6 100%)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>套餐原价</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 30,
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginTop: 4,
                      }}
                    >
                      ¥{co.originalTotal.toFixed(2)}
                    </div>
                    {co.discountApplied > 0 ? (
                      <div style={{ marginTop: 6, fontSize: 13, color: '#2e7d32', fontWeight: 600 }}>
                        🎁 满{threshold}减{discount}，已优惠 ¥{co.discountApplied}
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: 13, color: '#8b7355' }}>
                        再点 ¥{diffToReach.toFixed(2)} 即可享受满减
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #c8e6c9 0%, #81c784 100%)',
                      color: '#1b5e20',
                    }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.8 }}>实付金额</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 36,
                        fontWeight: 700,
                        marginTop: 4,
                      }}
                    >
                      ¥{co.finalTotal.toFixed(2)}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                      共 {state.group?.members.length || 0} 人 AA 分摊
                    </div>
                  </div>
                </div>

                <div className="split-list">
                  {co.splits.map((sp) => (
                    <div key={sp.memberId} className="split-item">
                      <div className="split-name">
                        <span className="member-avatar">
                          {sp.memberName.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                        {sp.memberName}
                      </div>
                      <div className="split-amount">¥{sp.amount.toFixed(1)}</div>
                    </div>
                  ))}
                </div>

                <div className="poster-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowPoster((v) => !v);
                      setTimeout(() => drawPoster(), 80);
                    }}
                  >
                    {showPoster ? '👁️ 隐藏海报预览' : '🖼️ 预览海报'}
                  </button>
                  <button className="btn btn-success" onClick={handleDownloadPoster}>
                    🎉 下载海报并庆祝
                  </button>
                </div>

                {showPoster && (
                  <div className="poster-canvas-wrap">
                    <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
                  </div>
                )}

                {!showPoster && <canvas ref={canvasRef} style={{ display: 'none' }} />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
