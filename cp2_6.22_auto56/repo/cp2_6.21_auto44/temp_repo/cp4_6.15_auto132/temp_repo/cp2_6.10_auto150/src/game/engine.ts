import {
  Pin,
  Ball,
  BALL_RADIUS,
  PIN_WIDTH,
  PIN_HEIGHT,
  PIN_SPACING,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FRICTION,
  MIN_SPEED,
  PIN_WORDS,
  SCORE_RULES,
} from './constants';
import { playHitSound, playScoreSound } from '../utils/audio';

export function generatePinPositions(): Pin[] {
  const pins: Pin[] = [];
  const centerX = CANVAS_WIDTH / 2;
  const startY = 120;
  const rows = 5;
  let pinIndex = 0;

  for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 1;
    const rowWidth = pinsInRow * PIN_SPACING;
    const startX = centerX - rowWidth / 2 + PIN_SPACING / 2;

    for (let col = 0; col < pinsInRow; col++) {
      const wordConfig = PIN_WORDS[pinIndex % PIN_WORDS.length];
      pins.push({
        id: pinIndex,
        x: startX + col * PIN_SPACING,
        y: startY + row * (PIN_SPACING * 0.866),
        word: wordConfig.word,
        type: wordConfig.type,
        isDown: false,
        rotation: 0,
        fallDirection: 0,
        angularVelocity: 0,
      });
      pinIndex++;
    }
  }

  return pins;
}

export function createInitialBall(): Ball {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    vx: 0,
    vy: 0,
    isMoving: false,
    rotation: 0,
  };
}

export function updateBall(ball: Ball): Ball {
  if (!ball.isMoving) return ball;

  let newVx = ball.vx * FRICTION;
  let newVy = ball.vy * FRICTION;
  const speed = Math.sqrt(newVx * newVx + newVy * newVy);

  if (speed < MIN_SPEED) {
    return { ...ball, vx: 0, vy: 0, isMoving: false };
  }

  let newX = ball.x + newVx;
  let newY = ball.y + newVy;

  if (newX - BALL_RADIUS < 0) {
    newX = BALL_RADIUS;
    newVx = -newVx * 0.7;
  }
  if (newX + BALL_RADIUS > CANVAS_WIDTH) {
    newX = CANVAS_WIDTH - BALL_RADIUS;
    newVx = -newVx * 0.7;
  }
  if (newY - BALL_RADIUS < 0) {
    newY = BALL_RADIUS;
    newVy = -newVy * 0.7;
  }
  if (newY + BALL_RADIUS > CANVAS_HEIGHT) {
    newY = CANVAS_HEIGHT - BALL_RADIUS;
    newVy = -newVy * 0.7;
  }

  const rotationDelta = speed * 0.05;
  const newRotation = ball.rotation + rotationDelta;

  return {
    ...ball,
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    rotation: newRotation,
  };
}

export function checkCollisions(ball: Ball, pins: Pin[]): { ball: Ball; pins: Pin[]; scoreDelta: number } {
  let newBall = { ...ball };
  let newPins = pins.map((p) => ({ ...p }));
  let scoreDelta = 0;
  let hitOccurred = false;

  for (let i = 0; i < newPins.length; i++) {
    const pin = newPins[i];
    if (pin.isDown) continue;

    const dx = ball.x - pin.x;
    const dy = ball.y - pin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < BALL_RADIUS + PIN_WIDTH / 2) {
      hitOccurred = true;
      const angle = Math.atan2(dy, dx);
      const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

      pin.isDown = true;
      pin.fallDirection = angle * (180 / Math.PI);
      pin.angularVelocity = ballSpeed * 8;

      scoreDelta += SCORE_RULES[pin.type];

      const nx = dx / distance;
      const ny = dy / distance;
      const dotProduct = newBall.vx * nx + newBall.vy * ny;

      newBall.vx = newBall.vx - 1.5 * dotProduct * nx;
      newBall.vy = newBall.vy - 1.5 * dotProduct * ny;

      const overlap = BALL_RADIUS + PIN_WIDTH / 2 - distance;
      newBall.x += nx * overlap;
      newBall.y += ny * overlap;
    }
  }

  for (let i = 0; i < newPins.length; i++) {
    const pinA = newPins[i];
    if (!pinA.isDown || pinA.angularVelocity < 1) continue;

    for (let j = 0; j < newPins.length; j++) {
      if (i === j) continue;
      const pinB = newPins[j];
      if (pinB.isDown) continue;

      const dx = pinA.x - pinB.x;
      const dy = pinA.y - pinB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < PIN_WIDTH * 1.5) {
        const angle = Math.atan2(dy, dx);
        pinB.isDown = true;
        pinB.fallDirection = angle * (180 / Math.PI);
        pinB.angularVelocity = pinA.angularVelocity * 0.7;
        scoreDelta += SCORE_RULES[pinB.type];
        hitOccurred = true;
      }
    }
  }

  if (hitOccurred) {
    playHitSound();
    if (scoreDelta !== 0) {
      setTimeout(() => playScoreSound(scoreDelta > 0), 100);
    }
  }

  return { ball: newBall, pins: newPins, scoreDelta };
}

export function updatePins(pins: Pin[]): Pin[] {
  return pins.map((pin) => {
    if (!pin.isDown) return pin;

    let newRotation = pin.rotation + pin.angularVelocity;
    let newAngularVelocity = pin.angularVelocity * 0.92;

    if (Math.abs(newRotation) >= 90) {
      newRotation = newRotation > 0 ? 90 : -90;
      newAngularVelocity = 0;
    }

    return {
      ...pin,
      rotation: newRotation,
      angularVelocity: newAngularVelocity,
    };
  });
}

export function isRoundComplete(ball: Ball, pins: Pin[]): boolean {
  if (ball.isMoving) return false;

  const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (ballSpeed > MIN_SPEED) return false;

  for (const pin of pins) {
    if (pin.isDown && Math.abs(pin.angularVelocity) > 0.1) {
      return false;
    }
  }

  return true;
}

export function calculateRoundScore(pins: Pin[]): number {
  let score = 0;
  for (const pin of pins) {
    if (pin.isDown) {
      score += SCORE_RULES[pin.type];
    }
  }
  return score;
}
