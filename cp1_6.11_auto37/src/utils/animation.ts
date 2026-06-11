interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const NOTE_COLORS = ['#4a9eff', '#e94560', '#ff9500', '#ffd700', '#81c784', '#ba68c8'];

export function startNoteRain(container: HTMLElement, duration: number = 2000): () => void {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const particles: Particle[] = [];
  let animationId: number;
  const startTime = Date.now();

  function createParticle(): Particle {
    return {
      x: Math.random() * width,
      y: -30 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      size: 12 + Math.random() * 16,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      alpha: 0.8 + Math.random() * 0.2,
      life: 0,
      maxLife: 1.5 + Math.random() * 1
    };
  }

  function drawNote(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha * (1 - p.life / p.maxLife);

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(2, p.size * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.size * 0.5, -p.size * 0.2);
    ctx.quadraticCurveTo(p.size * 1.2, -p.size * 0.8, p.size * 0.8, -p.size * 1.2);
    ctx.stroke();

    ctx.restore();
  }

  function animate() {
    const elapsed = Date.now() - startTime;

    if (elapsed < duration * 0.7) {
      for (let i = 0; i < 3; i++) {
        particles.push(createParticle());
      }
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rotation += p.rotationSpeed;
      p.life += 0.016;

      drawNote(ctx, p);

      if (p.y > height + 50 || p.life >= p.maxLife) {
        particles.splice(i, 1);
      }
    }

    if (elapsed < duration || particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      container.removeChild(canvas);
    }
  }

  const handleResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };
  window.addEventListener('resize', handleResize);

  animate();

  return () => {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(animationId);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}

export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existingRipple = button.getElementsByClassName('ripple')[0];
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(circle);

  setTimeout(() => circle.remove(), 600);
}
