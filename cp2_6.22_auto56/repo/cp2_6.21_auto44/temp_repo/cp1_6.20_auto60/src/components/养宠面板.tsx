import { useEffect, useRef, useState } from 'react';
import { 宠物数据 } from '../game/宠物系统';
import { 技能模板列表, 技能模板, 稀有度配色 } from '../data/初始数据';
import { 绘制像素兽 } from '../utils/像素兽绘制';

interface 养宠面板Props {
  宠物: 宠物数据;
  金币: number;
  on投喂: () => void;
  on训练: (属性: 'attack' | 'defense' | 'speed') => void;
  on治疗: () => void;
  on进化: () => void;
  on装备技能: (技能id: string, 槽位: number) => void;
  on进入战斗: () => void;
  on显示消息: (消息: string) => void;
}

type 动画类型 = null | '投喂' | '训练' | '治疗' | '进化';

export default function 养宠面板({
  宠物,
  金币,
  on投喂,
  on训练,
  on治疗,
  on进化,
  on装备技能,
  on进入战斗,
  on显示消息,
}: 养宠面板Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const 帧计数器 = useRef(0);
  const [当前动画, set当前动画] = useState<动画类型>(null);
  const [食物动画, set食物动画] = useState(false);
  const [治疗动画, set治疗动画] = useState(false);
  const [训练属性, set训练属性] = useState<'attack' | 'defense' | 'speed' | null>(null);
  const [拖拽技能, set拖拽技能] = useState<技能模板 | null>(null);
  const [拖放目标, set拖放目标] = useState<number | null>(null);
  const [光环特效, set光环特效] = useState<number | null>(null);

  useEffect(() => {
    let 动画ID: number;
    function 渲染循环() {
      帧计数器.current++;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let 动画状态: 'idle' | 'hurt' | 'attack' | 'happy' | 'defeated' = 'idle';
          if (当前动画 === '训练') 动画状态 = 'attack';
          if (当前动画 === '投喂' || 当前动画 === '进化') 动画状态 = 'happy';
          
          绘制像素兽({
            ctx,
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 180,
            种族: 宠物.种族,
            进化阶段: 宠物.进化阶段,
            配色: 宠物.配色,
            动画帧: 帧计数器.current,
            动画状态,
          });
        }
      }
      动画ID = requestAnimationFrame(渲染循环);
    }
    渲染循环();
    return () => cancelAnimationFrame(动画ID);
  }, [宠物.种族, 宠物.进化阶段, 宠物.配色, 当前动画]);

  const 执行动画 = async (类型: 动画类型, 持续时间: number = 1200) => {
    set当前动画(类型);
    await new Promise(r => setTimeout(r, 持续时间));
    set当前动画(null);
  };

  const 处理投喂 = () => {
    if (当前动画) return;
    set食物动画(true);
    on投喂();
    执行动画('投喂');
    setTimeout(() => set食物动画(false), 1000);
    on显示消息('投喂成功！宠物恢复了HP并获得经验！');
  };

  const 处理训练 = (属性: 'attack' | 'defense' | 'speed') => {
    if (当前动画) return;
    set训练属性(属性);
    on训练(属性);
    执行动画('训练', 1500);
    setTimeout(() => set训练属性(null), 1500);
    const 属性名 = { attack: '攻击', defense: '防御', speed: '速度' }[属性];
    on显示Message(`训练成功！${属性名}属性提升！`);
  };

  const 处理治疗 = () => {
    if (当前动画) return;
    if (宠物.hp >= 宠物.maxHp) {
      on显示消息('宠物已经是满血状态！');
      return;
    }
    set治疗动画(true);
    on治疗();
    执行动画('治疗');
    setTimeout(() => set治疗动画(false), 1000);
    on显示消息('治疗成功！HP已完全恢复！');
  };

  const 处理进化 = () => {
    if (当前动画) return;
    const 所需等级 = 宠物.进化阶段 === 0 ? 10 : 宠物.进化阶段 === 1 ? 25 : -1;
    if (所需等级 === -1) {
      on显示消息('已达到最终进化形态！');
      return;
    }
    if (宠物.level < 所需等级) {
      on显示消息(`需要等级达到 ${所需等级} 才能进化！`);
      return;
    }
    执行动画('进化', 2000);
    setTimeout(() => on进化(), 500);
  };

  const 获取已装备技能 = (槽位: number): 技能模板 | undefined => {
    const 技能id = 宠物.已装备技能ids[槽位];
    if (!技能id) return undefined;
    return 技能模板列表.find(s => s.id === 技能id);
  };

  const 处理拖拽开始 = (e: React.DragEvent, 技能: 技能模板) => {
    set拖拽技能(技能);
    e.dataTransfer.effectAllowed = 'move';
  };

  const 处理拖拽进入 = (槽位: number) => {
    if (拖拽技能) set拖放目标(槽位);
  };

  const 处理拖拽离开 = () => {
    set拖放目标(null);
  };

  const 处理放置 = (槽位: number) => {
    if (拖拽技能) {
      on装备技能(拖拽技能.id, 槽位);
      set光环特效(槽位);
      setTimeout(() => set光环特效(null), 800);
      on显示消息(`技能 ${拖拽技能.name} 装备成功！`);
    }
    set拖拽技能(null);
    set拖放目标(null);
  };

  const 处理拖拽结束 = () => {
    set拖拽技能(null);
    set拖放目标(null);
  };

  const 可用技能列表 = 技能模板列表.filter(
    s => !s.种族限制 || s.种族限制.includes(宠物.种族)
  );

  const HP百分比 = Math.min(100, Math.max(0, (宠物.hp / 宠物.maxHp) * 100));
  const 攻击百分比 = Math.min(100, (宠物.attack / 200) * 100);
  const 防御百分比 = Math.min(100, (宠物.defense / 150) * 100);
  const 速度百分比 = Math.min(100, (宠物.speed / 200) * 100);
  const 经验百分比 = (宠物.exp / 宠物.expToNext) * 100;

  return (
    <div className="main-panel">
      <div className="panel-header">
        <div className="gold-display">💰 金币: {金币}</div>
        <h1 style={{ fontSize: '18px', color: '#f4d03f' }}>像素兽养成</h1>
        <button className="nav-button" onClick={on进入战斗}>⚔️ 进入竞技场</button>
      </div>

      <div className="main-content">
        <div className="pet-display">
          <div className="pet-avatar-frame">
            <span className="pet-level-badge">Lv.{宠物.level}</span>
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className={训练属性 ? 'pet-pushup' : ''}
            />
            {治疗动画 && <div className="heal-effect" />}
            {食物动画 && (
              <div 
                className="food-fly"
                style={{
                  top: '0px',
                  right: '0px',
                  ['--target-x' as any]: '-60px',
                  ['--target-y' as any]: '80px',
                }}
              >
                🍖
              </div>
            )}
          </div>
          <div className="pet-name">{宠物.name}</div>
          <div className="pet-type">
            {宠物.种族 === 'dragon' ? '🐉 龙族' : 宠物.种族 === 'cat' ? '🐱 猫族' : '🐦 鸟族'}
            {' · 进化阶段 '}{['幼年期', '成长期', '完全体'][宠物.进化阶段]}
          </div>
          <div className="pet-exp-bar">
            <div className="pet-exp-fill" style={{ width: 经验百分比 + '%' }} />
          </div>
          <div className="pet-exp-text">EXP {宠物.exp} / {宠物.expToNext}</div>
        </div>

        <div className="stats-panel">
          <div className="stats-title">属性面板</div>
          
          <div className="stat-row">
            <div className="stat-label">❤️ HP</div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill stat-bar-fill-hp" style={{ width: HP百分比 + '%' }} />
              <div className="stat-value">{宠物.hp} / {宠物.maxHp}</div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-label">⚔️ 攻击</div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill stat-bar-fill-atk" style={{ width: 攻击百分比 + '%' }} />
              <div className="stat-value">{宠物.attack}</div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-label">🛡️ 防御</div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill stat-bar-fill-def" style={{ width: 防御百分比 + '%' }} />
              <div className="stat-value">{宠物.defense}</div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-label">⚡ 速度</div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill stat-bar-fill-spd" style={{ width: 速度百分比 + '%' }} />
              <div className="stat-value">{宠物.speed}</div>
            </div>
          </div>
        </div>

        <div className="action-panel">
          <button className="action-button" onClick={处理投喂} disabled={!!当前动画}>
            <span className="action-button-icon">🍖</span>
            投喂
          </button>
          <button className="action-button" onClick={() => 处理训练('attack')} disabled={!!当前动画}>
            <span className="action-button-icon">💪</span>
            训练攻击
          </button>
          <button className="action-button" onClick={处理治疗} disabled={!!当前动画}>
            <span className="action-button-icon">💚</span>
            治疗
          </button>
          <button className="action-button" onClick={处理进化} disabled={!!当前动画}>
            <span className="action-button-icon">✨</span>
            进化
          </button>
          <button className="action-button" onClick={() => 处理训练('defense')} disabled={!!当前动画}>
            <span className="action-button-icon">🛡️</span>
            训练防御
          </button>
          <button className="action-button" onClick={() => 处理训练('speed')} disabled={!!当前动画}>
            <span className="action-button-icon">⚡</span>
            训练速度
          </button>
        </div>
      </div>

      <div className="skill-equip-section">
        <div className="stats-title" style={{ marginBottom: '20px' }}>技能装备（拖拽技能到技能槽）</div>
        <div className="skill-slots">
          {[0, 1, 2].map(槽位 => {
            const 已装备 = 获取已装备技能(槽位);
            const 配色 = 已装备 ? 稀有度配色[已装备.稀有度] : null;
            return (
              <div
                key={槽位}
                className={`skill-slot ${已装备 ? 'active' : ''} ${拖放目标 === 槽位 ? 'drag-over' : ''}`}
                style={已装备 && 配色 ? { borderColor: 配色.边框, boxShadow: `0 0 20px ${配色.辉光}` } : {}}
                onDragEnter={() => 处理拖拽进入(槽位)}
                onDragOver={e => { e.preventDefault(); }}
                onDragLeave={处理拖拽离开}
                onDrop={() => 处理放置(槽位)}
              >
                {光环特效 === 槽位 && <div className="equip-aura" />}
                {已装备 ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: 配色?.文字 || '#fff', marginBottom: '5px' }}>
                      {已装备.name}
                    </div>
                    <div style={{ fontSize: '8px', color: '#fca5a5' }}>
                      伤害: {已装备.基础伤害}
                    </div>
                  </div>
                ) : (
                  <div className="skill-slot-label">技能槽 {槽位 + 1}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="skill-scroll-container">
          <div className="skill-cards">
            {可用技能列表.map(技能 => {
              const 配色 = 稀有度配色[技能.稀有度];
              return (
                <div
                  key={技能.id}
                  className={`skill-card rarity-${技能.稀有度}`}
                  draggable
                  onDragStart={e => 处理拖拽开始(e, 技能)}
                  onDragEnd={处理拖拽结束}
                >
                  <div className="skill-card-name" style={{ color: 配色.文字 }}>
                    {技能.name}
                  </div>
                  <div className="skill-card-damage">
                    {技能.效果类型 === 'heal' ? `治愈: ${Math.abs(技能.基础伤害)}` :
                     技能.效果类型 === 'buff' ? '增益效果' :
                     `伤害: ${技能.基础伤害}`}
                  </div>
                  <div className="skill-card-desc">{技能.描述}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {当前动画 === '进化' && <div className="evolve-overlay" />}
    </div>
  );
}
