import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// 胜利庆祝效果组件属性
interface CelebrationEffectProps {
  // 冠军队伍名称
  winnerTeamName: string;
  // 自定义类名
  className?: string;
}

// 粒子接口
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

// 彩带接口
interface Ribbon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

// 漂浮文字接口
interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  scale: number;
}

// 粒子颜色调色板
const PARTICLE_COLORS = [
  '#00d4ff',
  '#ff6b6b',
  '#00ff88',
  '#ffd93d',
  '#a855f7',
  '#ff69b4',
  '#ff8c00',
];

// 漂浮文字内容
const FLOATING_WORDS = ['胜利!', '冠军', '太棒了!', '🎉', 'Winner', '🏆', '完美!', '第一!'];

// 文字颜色
const TEXT_COLORS = ['#00d4ff', '#ffd93d', '#00ff88', '#ffffff', '#ff69b4'];

/**
 * 胜利庆祝效果组件
 * - 全屏Canvas覆盖
 * - 五彩粒子喷泉效果（从底部向上喷射）
 * - 随机颜色的彩带飘落
 * - 漂浮文字（"胜利!" "冠军" 等）从底部浮起
 * - requestAnimationFrame动画循环
 * - 传入winnerTeamName显示中央冠军队伍名称（大字号发光）
 */
export default function CelebrationEffect({ winnerTeamName, className }: CelebrationEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const ribbonsRef = useRef<Ribbon[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastTextSpawnTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重力加速度
    const GRAVITY = 0.15;
    // 粒子发射间隔（毫秒）
    const PARTICLE_SPAWN_INTERVAL = 30;
    // 文字生成间隔
    const TEXT_SPAWN_INTERVAL = 600;
    // 最大粒子数量
    const MAX_PARTICLES = 500;
    // 最大彩带数量
    const MAX_RIBBONS = 100;
    // 最大漂浮文字数量
    const MAX_FLOATING_TEXTS = 15;

    // 设置Canvas尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // 生成单个粒子
    const createParticle = (): Particle => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6;
      const speed = Math.random() * 8 + 5;
      return {
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        life: 0,
        maxLife: Math.random() * 60 + 80,
      };
    };

    // 生成单个彩带
    const createRibbon = (): Ribbon => {
      return {
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        width: Math.random() * 10 + 8,
        height: Math.random() * 30 + 20,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        life: 0,
        maxLife: Math.random() * 200 + 200,
      };
    };

    // 生成漂浮文字
    const createFloatingText = (): FloatingText => {
      return {
        x: Math.random() * (canvas.width - 200) + 100,
        y: canvas.height + 30,
        vy: -(Math.random() * 2 + 1.5),
        text: FLOATING_WORDS[Math.floor(Math.random() * FLOATING_WORDS.length)],
        color: TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)],
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 100 + 150,
        scale: Math.random() * 0.5 + 0.8,
      };
    };

    // 绘制粒子
    const drawParticle = (particle: Particle) => {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      // 发光效果
      ctx.shadowBlur = 15;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // 绘制彩带
    const drawRibbon = (ribbon: Ribbon) => {
      const alpha = 1 - ribbon.life / ribbon.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.translate(ribbon.x, ribbon.y);
      ctx.rotate(ribbon.rotation);
      ctx.fillStyle = ribbon.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = ribbon.color;
      ctx.fillRect(-ribbon.width / 2, -ribbon.height / 2, ribbon.width, ribbon.height);
      ctx.restore();
    };

    // 绘制漂浮文字
    const drawFloatingText = (ft: FloatingText) => {
      const alpha = 1 - ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${28 * ft.scale}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    };

    // 更新粒子位置
    const updateParticles = () => {
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife || p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      }
    };

    // 更新彩带位置
    const updateRibbons = () => {
      const ribbons = ribbonsRef.current;
      for (let i = ribbons.length - 1; i >= 0; i--) {
        const r = ribbons[i];
        r.vy += GRAVITY * 0.3;
        r.vx += Math.sin(r.life * 0.05) * 0.05;
        r.x += r.vx;
        r.y += r.vy;
        r.rotation += r.rotationSpeed;
        r.life++;

        if (r.life >= r.maxLife || r.y > canvas.height + 50) {
          ribbons.splice(i, 1);
        }
      }
    };

    // 更新漂浮文字
    const updateFloatingTexts = () => {
      const texts = floatingTextsRef.current;
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.y += t.vy;
        t.x += Math.sin(t.life * 0.03) * 0.5;
        t.life++;

        if (t.life >= t.maxLife || t.y < -50) {
          texts.splice(i, 1);
        }
      }
    };

    // 动画循环
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 定期生成粒子
      if (timestamp - lastSpawnTimeRef.current > PARTICLE_SPAWN_INTERVAL) {
        lastSpawnTimeRef.current = timestamp;
        if (particlesRef.current.length < MAX_PARTICLES) {
          for (let i = 0; i < 5; i++) {
            particlesRef.current.push(createParticle());
          }
        }
        if (ribbonsRef.current.length < MAX_RIBBONS) {
          ribbonsRef.current.push(createRibbon());
        }
      }

      // 定期生成漂浮文字
      if (timestamp - lastTextSpawnTimeRef.current > TEXT_SPAWN_INTERVAL) {
        lastTextSpawnTimeRef.current = timestamp;
        if (floatingTextsRef.current.length < MAX_FLOATING_TEXTS) {
          floatingTextsRef.current.push(createFloatingText());
        }
      }

      // 更新和绘制
      updateParticles();
      updateRibbons();
      updateFloatingTexts();

      // 绘制顺序：彩带 -> 粒子 -> 文字
      for (const ribbon of ribbonsRef.current) {
        drawRibbon(ribbon);
      }
      for (const particle of particlesRef.current) {
        drawParticle(particle);
      }
      for (const ft of floatingTextsRef.current) {
        drawFloatingText(ft);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // 初始化
    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);

    // 窗口大小变化事件
    window.addEventListener('resize', resizeCanvas);

    // 清理函数
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {/* Canvas粒子层 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 中央冠军队伍名称 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* 冠军标签 */}
        <div className="mb-4 px-8 py-2 bg-cyber-yellow/20 border-2 border-cyber-yellow rounded-full">
          <span className="font-orbitron text-2xl font-bold text-cyber-yellow tracking-wider animate-pulse-slow">
            🏆 冠军队伍 🏆
          </span>
        </div>

        {/* 队伍名称 */}
        <h1
          className="font-orbitron text-7xl font-black text-white animate-glow text-center px-4"
          style={{
            textShadow:
              '0 0 20px #00d4ff, 0 0 40px #00d4ff, 0 0 60px #00d4ff, 0 0 80px #00d4ff',
          }}
        >
          {winnerTeamName}
        </h1>

        {/* 装饰光效 */}
        <div
          className="mt-8 w-96 h-2 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, transparent, #00d4ff, #ffd93d, #00ff88, #ff69b4, #00d4ff, transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>

      {/* 动态CSS样式 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
