export interface ShatterPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface AnimationCallbacks {
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export function animateRise(
  _getY: () => number,
  setY: (y: number) => void,
  fromY: number,
  toY: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const currentY = fromY + (toY - fromY) * eased;
      setY(currentY);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setY(toY);
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: (t: number) => number = easeOutCubic
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      const value = from + (to - from) * eased;
      onUpdate(value);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        onUpdate(to);
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function animateShatter(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  pieces: ShatterPiece[],
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const gravity = 0.3;

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((piece) => {
        piece.vy += gravity;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;
        piece.opacity = Math.max(0, 1 - progress);

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.globalAlpha = piece.opacity;
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.restore();
      });

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function createShatterPieces(
  width: number,
  height: number,
  color: string,
  pieceCount: number = 30
): ShatterPiece[] {
  const pieces: ShatterPiece[] = [];
  const cols = Math.ceil(Math.sqrt(pieceCount * (width / height)));
  const rows = Math.ceil(pieceCount / cols);
  const pieceW = width / cols;
  const pieceH = height / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const centerX = col * pieceW + pieceW / 2;
      const centerY = row * pieceH + pieceH / 2;
      const angle = Math.atan2(centerY - height / 2, centerX - width / 2);
      const speed = 2 + Math.random() * 6;

      pieces.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
        vy: Math.sin(angle) * speed - 3 - Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        width: pieceW * (0.7 + Math.random() * 0.5),
        height: pieceH * (0.7 + Math.random() * 0.5),
        color: color,
        opacity: 1,
      });
    }
  }

  return pieces;
}

export function animateBorderGlow(element: HTMLElement, color: string): () => void {
  let animationId: number;
  let startTime = performance.now();
  const duration = 600;

  function tick(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = (elapsed % duration) / duration;
    const intensity = 0.3 + Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
    element.style.boxShadow = `0 0 ${8 + intensity * 15}px ${color}`;
    animationId = requestAnimationFrame(tick);
  }

  animationId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(animationId);
    element.style.boxShadow = '';
  };
}

export function animateClickBounce(element: HTMLElement, scale: number = 0.95): void {
  element.style.transform = `scale(${scale})`;
  element.style.transition = 'transform 0.1s ease';

  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
}

export function animateFlyingWhite(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const fontSize = 28;
    ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;

    const splatterDots: { x: number; y: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 15; i++) {
      splatterDots.push({
        x: x + Math.random() * 60 - 10,
        y: y + Math.random() * 30 - 15,
        r: Math.random() * 3 + 1,
        opacity: 0,
      });
    }

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.save();
      ctx.globalAlpha = progress;

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
      ctx.textBaseline = 'top';

      const chars = text.split('');
      let currentX = x;

      chars.forEach((char, index) => {
        const charProgress = Math.max(0, Math.min(1, (progress - index * 0.15) / 0.4));
        if (charProgress <= 0) return;

        const charWidth = ctx.measureText(char).width;
        const offsetY = (1 - charProgress) * -10;

        ctx.save();
        ctx.globalAlpha = progress * charProgress;

        ctx.fillText(char, currentX, y + offsetY);

        ctx.globalAlpha = progress * charProgress * 0.3;
        ctx.fillText(char, currentX + 1, y + offsetY + 1);
        ctx.fillText(char, currentX - 1, y + offsetY - 1);

        ctx.restore();

        if (charProgress > 0.5 && splatterDots.length > index * 3) {
          const dot = splatterDots[index * 3];
          if (dot) {
            dot.opacity = Math.min(1, dot.opacity + 0.1);
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.globalAlpha = dot.opacity * progress * 0.6;
            ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        currentX += charWidth + 2;
      });

      if (progress > 0.5) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = (progress - 0.5) * 2 * 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y + fontSize + 5);
        ctx.lineTo(x + ctx.measureText(text).width, y + fontSize + 5);
        ctx.stroke();
      }

      ctx.restore();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export { easeOutCubic, easeInCubic, easeInOutCubic, easeOutQuad };
