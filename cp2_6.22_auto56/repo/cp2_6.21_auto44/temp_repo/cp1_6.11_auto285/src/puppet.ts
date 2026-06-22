import { Light } from './light';

export interface Joint {
  x: number;
  y: number;
  angle: number;
  minAngle: number;
  maxAngle: number;
  length: number;
}

export interface PuppetData {
  name: string;
  index: number;
  bodyColor: string;
  outlineColor: string;
  headDraw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;
  accessoryDraw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, actionActive: boolean, actionTime: number) => void;
}

interface DragHandle {
  jointChain: ('rShoulder' | 'rElbow' | 'lHip' | 'lKnee')[];
  type: 'arm' | 'leg';
  stickEndX: number;
  stickEndY: number;
}

export class Puppet {
  data: PuppetData;
  x: number;
  y: number;
  scale: number = 1;
  distanceFromScreen: number = 0;

  lShoulder: Joint = { x: 0, y: 0, angle: 20, minAngle: -30, maxAngle: 60, length: 25 };
  lElbow: Joint = { x: 0, y: 0, angle: 0, minAngle: -45, maxAngle: 45, length: 22 };
  rShoulder: Joint = { x: 0, y: 0, angle: 20, minAngle: -30, maxAngle: 60, length: 25 };
  rElbow: Joint = { x: 0, y: 0, angle: 0, minAngle: -45, maxAngle: 45, length: 22 };
  lHip: Joint = { x: 0, y: 0, angle: 10, minAngle: -30, maxAngle: 60, length: 28 };
  lKnee: Joint = { x: 0, y: 0, angle: 0, minAngle: -45, maxAngle: 45, length: 25 };
  rHip: Joint = { x: 0, y: 0, angle: -10, minAngle: -30, maxAngle: 60, length: 28 };
  rKnee: Joint = { x: 0, y: 0, angle: 0, minAngle: -45, maxAngle: 45, length: 25 };

  bodyAngle: number = 0;
  globalAngle: number = 0;

  actionActive: boolean = false;
  actionName: string = '';
  actionTime: number = 0;
  actionDuration: number = 0;

  initialAngles: Record<string, number> = {};

  rightHandle: DragHandle | null = null;
  leftHandle: DragHandle | null = null;

  constructor(data: PuppetData, x: number, y: number) {
    this.data = data;
    this.x = x;
    this.y = y;
    this.saveInitialAngles();
  }

  saveInitialAngles(): void {
    this.initialAngles = {
      lShoulder: this.lShoulder.angle,
      lElbow: this.lElbow.angle,
      rShoulder: this.rShoulder.angle,
      rElbow: this.rElbow.angle,
      lHip: this.lHip.angle,
      lKnee: this.lKnee.angle,
      rHip: this.rHip.angle,
      rKnee: this.rKnee.angle,
      bodyAngle: this.bodyAngle,
      globalAngle: this.globalAngle,
    };
  }

  resetPose(): void {
    this.lShoulder.angle = this.initialAngles.lShoulder;
    this.lElbow.angle = this.initialAngles.lElbow;
    this.rShoulder.angle = this.initialAngles.rShoulder;
    this.rElbow.angle = this.initialAngles.rElbow;
    this.lHip.angle = this.initialAngles.lHip;
    this.lKnee.angle = this.initialAngles.lKnee;
    this.rHip.angle = this.initialAngles.rHip;
    this.rKnee.angle = this.initialAngles.rKnee;
    this.bodyAngle = this.initialAngles.bodyAngle;
    this.globalAngle = this.initialAngles.globalAngle;
  }

  playAction(name: string): void {
    if (this.actionActive) return;
    this.actionActive = true;
    this.actionName = name;
    this.actionTime = 0;
    this.saveInitialAngles();
    switch (name) {
      case 'flip':
        this.actionDuration = 2000;
        break;
      case 'staff':
        this.actionDuration = 3000;
        break;
      case 'giant':
        this.actionDuration = 2500;
        break;
      case 'cloud':
        this.actionDuration = 2000;
        break;
      default:
        this.actionDuration = 1500;
    }
  }

  updateAction(dt: number): void {
    if (!this.actionActive) return;
    this.actionTime += dt;
    const t = Math.min(this.actionTime / this.actionDuration, 1);

    switch (this.actionName) {
      case 'flip': {
        this.globalAngle = t * 360;
        const contract = Math.sin(t * Math.PI) * 40;
        this.lShoulder.angle = this.initialAngles.lShoulder + contract;
        this.rShoulder.angle = this.initialAngles.rShoulder + contract;
        this.lHip.angle = this.initialAngles.lHip - contract * 0.5;
        this.rHip.angle = this.initialAngles.rHip + contract * 0.5;
        this.lElbow.angle = this.initialAngles.lElbow + contract * 0.3;
        this.rElbow.angle = this.initialAngles.rElbow + contract * 0.3;
        break;
      }
      case 'staff': {
        this.rShoulder.angle = this.initialAngles.rShoulder + Math.sin(t * Math.PI * 10) * 50;
        this.rElbow.angle = this.initialAngles.rElbow + Math.cos(t * Math.PI * 10) * 40;
        this.lShoulder.angle = this.initialAngles.lShoulder + Math.sin(t * Math.PI * 10 + 1) * 15;
        this.lElbow.angle = this.initialAngles.lElbow + Math.sin(t * Math.PI * 5) * 10;
        break;
      }
      case 'giant': {
        const growT = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1;
        this.scale = 1 + growT * 1.5;
        this.lShoulder.angle = this.initialAngles.lShoulder + growT * 30;
        this.rShoulder.angle = this.initialAngles.rShoulder + growT * 30;
        this.lElbow.angle = this.initialAngles.lElbow - growT * 30;
        this.rElbow.angle = this.initialAngles.rElbow - growT * 30;
        this.lHip.angle = this.initialAngles.lHip - growT * 20;
        this.rHip.angle = this.initialAngles.rHip - growT * 20;
        break;
      }
      case 'cloud': {
        const floatY = Math.sin(t * Math.PI) * 30;
        this.y += floatY * 0.016;
        this.lShoulder.angle = this.initialAngles.lShoulder + Math.sin(t * Math.PI * 4) * 20;
        this.rShoulder.angle = this.initialAngles.rShoulder + Math.sin(t * Math.PI * 4 + 0.5) * 20;
        this.lElbow.angle = this.initialAngles.lElbow + Math.sin(t * Math.PI * 6) * 15;
        this.rElbow.angle = this.initialAngles.rElbow + Math.sin(t * Math.PI * 6 + 1) * 15;
        break;
      }
    }

    if (t >= 1) {
      this.actionActive = false;
      this.globalAngle = 0;
      this.scale = 1;
      this.resetPose();
    }
  }

  getJointPos(joint: Joint, parentX: number, parentY: number, parentAngle: number): { x: number; y: number } {
    const rad = ((parentAngle + joint.angle) * Math.PI) / 180;
    return {
      x: parentX + Math.sin(rad) * joint.length * this.scale,
      y: parentY + Math.cos(rad) * joint.length * this.scale,
    };
  }

  getHandlePositions(): { rightX: number; rightY: number; leftX: number; leftY: number } {
    const s = this.scale;
    const shoulderOffX = 12 * s;
    const shoulderOffY = -20 * s;
    const hipOffX = 6 * s;
    const hipOffY = 25 * s;

    const rShoulderPos = { x: this.x + shoulderOffX, y: this.y + shoulderOffY };
    const rElbowPos = this.getJointPos(this.rShoulder, rShoulderPos.x, rShoulderPos.y, this.bodyAngle + this.globalAngle);
    const rHandPos = this.getJointPos(this.rElbow, rElbowPos.x, rElbowPos.y, this.bodyAngle + this.globalAngle + this.rShoulder.angle);

    const lHipPos = { x: this.x - hipOffX, y: this.y + hipOffY };
    const lKneePos = this.getJointPos(this.lHip, lHipPos.x, lHipPos.y, this.bodyAngle + this.globalAngle);
    const lFootPos = this.getJointPos(this.lKnee, lKneePos.x, lKneePos.y, this.bodyAngle + this.globalAngle + this.lHip.angle);

    return {
      rightX: rHandPos.x,
      rightY: rHandPos.y,
      leftX: lFootPos.x,
      leftY: lFootPos.y,
    };
  }

  drag(handleType: 'right' | 'left', targetX: number, targetY: number): void {
    if (this.actionActive) return;

    const s = this.scale;
    const shoulderOffX = 12 * s;
    const shoulderOffY = -20 * s;
    const hipOffX = 6 * s;
    const hipOffY = 25 * s;

    if (handleType === 'right') {
      const sx = this.x + shoulderOffX;
      const sy = this.y + shoulderOffY;
      const dx = targetX - sx;
      const dy = targetY - sy;
      const shoulderAngle = Math.atan2(dx, dy) * (180 / Math.PI);
      this.rShoulder.angle = Math.max(this.rShoulder.minAngle, Math.min(this.rShoulder.maxAngle, shoulderAngle));

      const elbowX = sx + Math.sin((shoulderAngle * Math.PI) / 180) * this.rShoulder.length * s;
      const elbowY = sy + Math.cos((shoulderAngle * Math.PI) / 180) * this.rShoulder.length * s;
      const dx2 = targetX - elbowX;
      const dy2 = targetY - elbowY;
      const elbowAngle = Math.atan2(dx2, dy2) * (180 / Math.PI) - shoulderAngle;
      this.rElbow.angle = Math.max(this.rElbow.minAngle, Math.min(this.rElbow.maxAngle, elbowAngle));
    } else {
      const hx = this.x - hipOffX;
      const hy = this.y + hipOffY;
      const dx = targetX - hx;
      const dy = targetY - hy;
      const hipAngle = Math.atan2(dx, dy) * (180 / Math.PI);
      this.lHip.angle = Math.max(this.lHip.minAngle, Math.min(this.lHip.maxAngle, hipAngle));

      const kneeX = hx + Math.sin((hipAngle * Math.PI) / 180) * this.lHip.length * s;
      const kneeY = hy + Math.cos((hipAngle * Math.PI) / 180) * this.lHip.length * s;
      const dx2 = targetX - kneeX;
      const dy2 = targetY - kneeY;
      const kneeAngle = Math.atan2(dx2, dy2) * (180 / Math.PI) - hipAngle;
      this.lKnee.angle = Math.max(this.lKnee.minAngle, Math.min(this.lKnee.maxAngle, kneeAngle));
    }
  }

  projectShadow(ctx: CanvasRenderingContext2D, light: Light): void {
    const shadowOffset = light.getShadowOffset();
    const distFactor = this.distanceFromScreen / 100;
    const shadowScale = 1 - distFactor * 0.2;
    const blur = distFactor * 6;

    ctx.save();
    ctx.translate(shadowOffset.x, shadowOffset.y);
    ctx.translate(this.x, this.y);
    ctx.scale(shadowScale, shadowScale);
    ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 0.55 - distFactor * 0.15;
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
    }
    this.drawBody(ctx, '#000000', '#000000', true);
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, actionTime: number): void {
    this.drawBody(ctx, this.data.bodyColor, this.data.outlineColor, false);

    const handles = this.getHandlePositions();
    this.drawStick(ctx, handles.rightX, handles.rightY);
    this.drawStick(ctx, handles.leftX, handles.leftY);
  }

  drawStick(ctx: CanvasRenderingContext2D, endX: number, endY: number): void {
    const stickLen = 50 * this.scale;
    ctx.save();
    ctx.strokeStyle = '#C2A670';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX, endY + stickLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY + stickLen, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#C2A670';
    ctx.fill();
    ctx.restore();
  }

  drawBody(ctx: CanvasRenderingContext2D, fillColor: string, strokeColor: string, isShadow: boolean): void {
    const s = this.scale;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.globalAngle * Math.PI) / 180);

    const bodyH = 40 * s;
    const bodyW = 16 * s;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!isShadow) {
      ctx.stroke();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.6, -bodyH * 0.1);
      ctx.lineTo(bodyW * 0.6, -bodyH * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.7, bodyH * 0.1);
      ctx.lineTo(bodyW * 0.7, bodyH * 0.1);
      ctx.stroke();
    }

    if (!isShadow) {
      this.data.headDraw(ctx, 0, -bodyH / 2 - 15 * s, s);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -bodyH / 2 - 15 * s, 10 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawLimb(ctx, this.lShoulder, -bodyW, -bodyH * 0.35, fillColor, strokeColor, isShadow, this.lElbow);
    this.drawLimb(ctx, this.rShoulder, bodyW, -bodyH * 0.35, fillColor, strokeColor, isShadow, this.rElbow);
    this.drawLimb(ctx, this.lHip, -bodyW * 0.4, bodyH / 2, fillColor, strokeColor, isShadow, this.lKnee);
    this.drawLimb(ctx, this.rHip, bodyW * 0.4, bodyH / 2, fillColor, strokeColor, isShadow, this.rKnee);

    if (!isShadow) {
      this.data.accessoryDraw(ctx, 0, 0, s, this.actionActive, this.actionTime);
    }

    ctx.restore();
  }

  drawLimb(
    ctx: CanvasRenderingContext2D,
    joint: Joint,
    ox: number,
    oy: number,
    fillColor: string,
    strokeColor: string,
    isShadow: boolean,
    childJoint: Joint
  ): void {
    const s = this.scale;
    const rad = ((joint.angle + this.bodyAngle) * Math.PI) / 180;
    const ex = ox + Math.sin(rad) * joint.length * s;
    const ey = oy + Math.cos(rad) * joint.length * s;

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (!isShadow) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ox, oy, 2.5 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#C2A670';
      ctx.fill();
    }

    const childRad = ((joint.angle + childJoint.angle + this.bodyAngle) * Math.PI) / 180;
    const fx = ex + Math.sin(childRad) * childJoint.length * s;
    const fy = ey + Math.cos(childRad) * childJoint.length * s;

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (!isShadow) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 2 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#C2A670';
      ctx.fill();
    }
  }
}
