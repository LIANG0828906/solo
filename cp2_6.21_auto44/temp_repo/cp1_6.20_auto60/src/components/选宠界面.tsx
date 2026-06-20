import { useEffect, useRef, useState } from 'react';
import { 宠物种族模板列表, 种族类型 } from '../data/初始数据';
import { 绘制像素兽 } from '../utils/像素兽绘制';

interface 选宠界面Props {
  on选择宠物: (种族: 种族类型) => void;
}

export default function 选宠界面({ on选择宠物 }: 选宠界面Props) {
  const [悬浮卡片, set悬浮卡片] = useState<种族类型 | null>(null);
  const [鼠标位置, set鼠标位置] = useState({ x: 0, y: 0 });
  const [粒子列表, set粒子列表] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [选中宠物, set选中宠物] = useState<种族类型 | null>(null);
  const [认主动画中, set认主动画中] = useState(false);
  const [背景过渡, set背景过渡] = useState(false);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const 帧计数器 = useRef(0);
  const 粒子ID = useRef(0);

  useEffect(() => {
    const 星星 = [];
    for (let i = 0; i < 80; i++) {
      星星.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 2,
      });
    }
    const starsContainer = document.getElementById('stars-container');
    if (starsContainer) {
      星星.forEach(s => {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = s.x + '%';
        star.style.top = s.y + '%';
        star.style.width = s.size + 'px';
        star.style.height = s.size + 'px';
        star.style.animationDelay = s.delay + 's';
        starsContainer.appendChild(star);
      });
    }

    let 动画ID: number;
    function 渲染循环() {
      帧计数器.current++;
      Object.keys(canvasRefs.current).forEach(key => {
        const canvas = canvasRefs.current[key];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const 种族 = key as 种族类型;
        const 模板 = 宠物种族模板列表.find(r => r.种族 === 种族);
        if (模板) {
          const 尺寸 = 选中宠物 === 种族 ? 180 : 150;
          绘制像素兽({
            ctx,
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 尺寸,
            种族,
            进化阶段: 0,
            配色: 模板.外观配色,
            动画帧: 帧计数器.current,
            动画状态: 悬浮卡片 === 种族 ? 'happy' : 'idle',
          });
        }
      });
      动画ID = requestAnimationFrame(渲染循环);
    }
    渲染循环();

    return () => cancelAnimationFrame(动画ID);
  }, [悬浮卡片, 选中宠物]);

  const 处理鼠标移动 = (e: React.MouseEvent) => {
    set鼠标位置({ x: e.clientX, y: e.clientY });
    if (悬浮卡片 && Math.random() > 0.7) {
      const 模板 = 宠物种族模板列表.find(r => r.种族 === 悬浮卡片);
      if (模板) {
        粒子ID.current++;
        set粒子列表(prev => [...prev.slice(-20), {
          id: 粒子ID.current,
          x: e.clientX + (Math.random() - 0.5) * 30,
          y: e.clientY + (Math.random() - 0.5) * 30,
          color: Math.random() > 0.5 ? 模板.外观配色.强调色 : '#f4d03f',
        }]);
        setTimeout(() => {
          set粒子列表(prev => prev.filter(p => p.id !== 粒子ID.current));
        }, 1000);
      }
    }
  };

  const 处理选择 = (种族: 种族类型) => {
    if (认主动画中) return;
    set选中宠物(种族);
    set认主动画中(true);
    set背景过渡(true);

    setTimeout(() => {
      on选择宠物(种族);
    }, 2500);
  };

  return (
    <div className="select-screen" onMouseMove={处理鼠标移动}>
      <div className={`starfield-bg ${背景过渡 ? 'to-grass' : ''}`}>
        <div id="stars-container" className={`stars ${背景过渡 ? 'fade-out' : ''}`} />
      </div>

      {粒子列表.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x + 'px',
            top: p.y + 'px',
            width: '6px',
            height: '6px',
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}

      {!认主动画中 && (
        <>
          <h1 className="game-title">像素兽养成竞技场</h1>
          <p className="subtitle">选择你的初始像素兽伙伴</p>

          <div className="pet-cards">
            {宠物种族模板列表.map(模板 => (
              <div
                key={模板.种族}
                className="pet-card"
                onMouseEnter={() => set悬浮卡片(模板.种族)}
                onMouseLeave={() => set悬浮卡片(null)}
                onClick={() => 处理选择(模板.种族)}
              >
                <canvas
                  ref={el => { canvasRefs.current[模板.种族] = el; }}
                  width={180}
                  height={180}
                />
                <div className="pet-card-name">{模板.name}</div>
                <div className="pet-card-desc">{模板.描述}</div>
                <div className="pet-card-stats">
                  <span className="pet-card-stat">
                    <span className="stat-icon stat-hp"></span>HP{模板.基础属性.maxHp}
                  </span>
                  <span className="pet-card-stat">
                    <span className="stat-icon stat-atk"></span>攻{模板.基础属性.attack}
                  </span>
                  <span className="pet-card-stat">
                    <span className="stat-icon stat-def"></span>防{模板.基础属性.defense}
                  </span>
                  <span className="pet-card-stat">
                    <span className="stat-icon stat-spd"></span>速{模板.基础属性.speed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {认主动画中 && 选中宠物 && (
        <div className="bond-animation-container">
          <canvas
            ref={el => { canvasRefs.current['bond'] = el; }}
            width={300}
            height={300}
            className="bond-pet"
          />
          <div className="bond-text">
            {宠物种族模板列表.find(r => r.种族 === 选中宠物)?.name} 认主成功！
          </div>
        </div>
      )}
    </div>
  );
}
