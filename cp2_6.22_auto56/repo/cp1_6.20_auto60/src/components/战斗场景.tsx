import { useEffect, useRef, useState } from 'react';
import { 宠物数据 } from '../game/宠物系统';
import { 战斗状态, 战斗事件, 监听战斗事件, 开始战斗, 执行下一回合, 获取战斗结果, 重置战斗 } from '../game/战斗引擎';
import { 绘制像素兽, 创建粒子, 更新粒子, 绘制粒子特效 } from '../utils/像素兽绘制';

interface 战斗场景Props {
  玩家宠物: 宠物数据;
  敌方宠物: 宠物数据;
  on战斗结束: (胜者: '玩家' | '敌方', 金币: number, 经验: number) => void;
  on返回: () => void;
}

interface 伤害数字 {
  id: number;
  value: number;
  type: 'damage' | 'heal';
  x: number;
  y: number;
}

export default function 战斗场景({ 玩家宠物, 敌方宠物, on战斗结束, on返回 }: 战斗场景Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const 帧计数器 = useRef(0);
  const 伤害ID = useRef(0);
  const [战斗状态, set战斗状态] = useState<战斗状态 | null>(null);
  const [技能对话框, set技能对话框] = useState<{ 文本: string; 行动方: '玩家' | '敌方' } | null>(null);
  const [伤害数字列表, set伤害数字列表] = useState<伤害数字[]>([]);
  const [玩家动画状态, set玩家动画状态] = useState<'idle' | 'hurt' | 'attack' | 'happy' | 'defeated'>('idle');
  const [敌方动画状态, set敌方动画状态] = useState<'idle' | 'hurt' | 'attack' | 'happy' | 'defeated'>('idle');
  const [战斗结算, set战斗结算] = useState<{ 胜者: '玩家' | '敌方'; 金币: number; 经验: number } | null>(null);
  const 粒子列表Ref = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const 战斗进行中Ref = useRef(false);

  useEffect(() => {
    监听战斗事件(处理战斗事件);
    const 初始状态 = 开始战斗(玩家宠物, 敌方宠物);
    set战斗状态(初始状态);
    战斗进行中Ref.current = true;

    let 动画ID: number;
    function 渲染循环() {
      帧计数器.current++;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (战斗状态) {
            绘制像素兽({
              ctx,
              x: canvas.width * 0.18,
              y: canvas.height * 0.55,
              size: 160,
              种族: 战斗状态.玩家宠物.种族,
              进化阶段: 战斗状态.玩家宠物.进化阶段,
              配色: 战斗状态.玩家宠物.配色,
              动画帧: 帧计数器.current,
              动画状态: 玩家动画状态,
            });

            ctx.save();
            ctx.translate(canvas.width * 0.82, canvas.height * 0.55);
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width * 0.82, -canvas.height * 0.55);
            绘制像素兽({
              ctx,
              x: canvas.width * 0.82,
              y: canvas.height * 0.55,
              size: 160,
              种族: 战斗状态.敌方宠物.种族,
              进化阶段: 战斗状态.敌方宠物.进化阶段,
              配色: 战斗状态.敌方宠物.配色,
              动画帧: 帧计数器.current,
              动画状态: 敌方动画状态,
            });
            ctx.restore();

            粒子列表Ref.current = 更新粒子(粒子列表Ref.current);
            绘制粒子特效(ctx, 0, 0, 粒子列表Ref.current);
          }
        }
      }
      动画ID = requestAnimationFrame(渲染循环);
    }
    渲染循环();

    const 定时器 = setTimeout(下一回合, 1500);

    return () => {
      cancelAnimationFrame(动画ID);
      clearTimeout(定时器);
      重置战斗();
    };
  }, []);

  const 下一回合 = () => {
    if (!战斗进行中Ref.current) return;
    try {
      const 新状态 = 执行下一回合();
      set战斗状态(新状态);

      if (新状态.战斗结束) {
        战斗进行中Ref.current = false;
        const 结果 = 获取战斗结果();
        setTimeout(() => {
          set战斗结算(结果);
          if (结果.胜者 === '玩家') {
            set玩家动画状态('happy');
            set敌方动画状态('defeated');
          } else {
            set玩家动画状态('defeated');
            set敌方动画状态('happy');
          }
          setTimeout(() => on战斗结束(结果.胜者, 结果.金币, 结果.经验), 3000);
        }, 1000);
      } else {
        setTimeout(下一回合, 1800);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const 处理战斗事件 = (事件: 战斗事件) => {
    if (事件.type === '技能使用' && 事件.技能名称) {
      set技能对话框({ 文本: 事件.技能名称, 行动方: 事件.行动方 });
      if (事件.行动方 === '玩家') {
        set玩家动画状态('attack');
        const canvas = canvasRef.current;
        if (canvas) {
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.18, canvas.height * 0.45, '#fbbf24', 15));
        }
      } else {
        set敌方动画状态('attack');
        const canvas = canvasRef.current;
        if (canvas) {
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.82, canvas.height * 0.45, '#ef4444', 15));
        }
      }
      setTimeout(() => {
        set玩家动画状态('idle');
        set敌方动画状态('idle');
      }, 600);

      setTimeout(() => set技能对话框(null), 1200);
    }

    if (事件.type === '造成伤害' && 事件.数值) {
      const canvas = canvasRef.current;
      if (canvas) {
        const is玩家受伤 = 事件.行动方 === '敌方';
        伤害ID.current++;
        set伤害数字列表(prev => [...prev, {
          id: 伤害ID.current,
          value: 事件.数值!,
          type: 'damage',
          x: is玩家受伤 ? canvas.width * 0.18 : canvas.width * 0.82,
          y: canvas.height * 0.35,
        }]);
        if (is玩家受伤) {
          set玩家动画状态('hurt');
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.18, canvas.height * 0.45, '#ef4444', 20));
        } else {
          set敌方动画状态('hurt');
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.82, canvas.height * 0.45, '#ef4444', 20));
        }
        setTimeout(() => {
          set伤害数字列表(prev => prev.filter(d => d.id !== 伤害ID.current));
        }, 1500);
      }
    }

    if (事件.type === '治愈' && 事件.数值) {
      const canvas = canvasRef.current;
      if (canvas) {
        const is玩家治愈 = 事件.行动方 === '玩家';
        伤害ID.current++;
        set伤害数字列表(prev => [...prev, {
          id: 伤害ID.current,
          value: 事件.数值!,
          type: 'heal',
          x: is玩家治愈 ? canvas.width * 0.18 : canvas.width * 0.82,
          y: canvas.height * 0.35,
        }]);
        if (is玩家治愈) {
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.18, canvas.height * 0.45, '#10b981', 15));
        } else {
          粒子列表Ref.current.push(...创建粒子(canvas.width * 0.82, canvas.height * 0.45, '#10b981', 15));
        }
        setTimeout(() => {
          set伤害数字列表(prev => prev.filter(d => d.id !== 伤害ID.current));
        }, 1500);
      }
    }
  };

  if (!战斗状态) return null;

  const 玩家HP百分比 = Math.max(0, (战斗状态.玩家宠物.hp / 战斗状态.玩家宠物.maxHp) * 100);
  const 敌方HP百分比 = Math.max(0, (战斗状态.敌方宠物.hp / 战斗状态.敌方宠物.maxHp) * 100);

  return (
    <div className="battle-scene">
      <div className="battle-arena">
        <canvas ref={canvas