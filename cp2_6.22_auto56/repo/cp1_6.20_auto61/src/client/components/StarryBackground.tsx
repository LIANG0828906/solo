import { useEffect, useRef } from 'react';

// 粒子接口定义
interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
}

// 粒子颜色常量
const STAR_COLORS = ['#00d4ff', '#ffffff', '#00d4ff', '#ffffff', '#00d4ff'];
// 最大粒子数量
const MAX_STARS = 200;
// 连线最大距离
const CONNECT_DISTANCE = 120;

/**
 * 动态星空背景Canvas组件
 * - 全屏Canvas覆盖
 * - 随机生成粒子，带连线效果
 * - requestAnimationFrame动画循环
 * - 粒子颜色以#00d4ff和白色为主
 */
export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置Canvas尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    // 初始化粒子
    const initStars = () => {
      const stars: Star[] = [];
      const count = Math.min(MAX_STARS, Math.floor((canvas.width * canvas.height) / 10000));

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.5 + 0.5,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
      starsRef.current = stars;
    };

    // 绘制粒子
    const drawStar = (star: Star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 发光效果
      if (star.color === '#00d4ff') {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 2
        );
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    // 绘制粒子之间的连线
    const drawConnections = () => {
      const stars = starsRef.current;
      const { x: mouseX, y: mouseY } = mouseRef.current;

      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECT_DISTANCE) {
            const opacity = (1 - distance / CONNECT_DISTANCE) * 0.3;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // 鼠标与粒子的连线
        const mdx = stars[i].x - mouseX;
        const mdy = stars[i].y - mouseY;
        const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDistance < CONNECT_DISTANCE * 1.5) {
          const opacity = (1 - mDistance / (CONNECT_DISTANCE * 1.5)) * 0.5;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    };

    // 更新粒子位置
    const updateStars = () => {
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        stars[i].x += stars[i].vx;
        stars[i].y += stars[i].vy;

        // 边界检测，粒子从对面重新进入
        if (stars[i].x < 0) stars[i].x = canvas.width;
        if (stars[i].x > canvas.width) stars[i].x = 0;
        if (stars[i].y < 0) stars[i].y = canvas.height;
        if (stars[i].y > canvas.height) stars[i].y = 0;

        // 闪烁效果
        stars[i].opacity = 0.3 + Math.sin(Date.now() * 0.002 + i) * 0.2;
      }
    };

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      updateStars();
      drawConnections();
      for (const star of starsRef.current) {
        drawStar(star);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // 鼠标离开事件
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // 初始化
    resizeCanvas();
    animate();

    // 注册事件监听
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // 清理函数
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, background: 'linear-gradient(180deg, #05051a 0%, #0a0a2e 50%, #05051a 100%)' }}
    />
  );
}
