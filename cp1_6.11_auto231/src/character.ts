export interface Goods {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  description: string;
}

export interface CustomerData {
  id: number;
  type: 'generous' | 'stingy' | 'child';
  name: string;
  icon: string;
  discountRate: number;
  requiresGift: boolean;
  bonusItems: string[];
  successBonus: number;
  dialog: string;
  color: { robe: string; sash: string };
}

export interface PeddlerState {
  x: number;
  y: number;
  targetX: number;
  direction: 'left' | 'right';
  walking: boolean;
  walkFrame: number;
}

export interface CustomerEntity extends CustomerData {
  x: number;
  y: number;
  targetX: number;
  walking: boolean;
  walkFrame: number;
  direction: 'left' | 'right';
  dialogVisible: boolean;
  interacted: boolean;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const GOODS_LIST: Goods[] = [
  { id: 'clay_figure', name: '泥人', icon: '🧸', basePrice: 35, description: '手工捏制的泥人玩偶' },
  { id: 'sugar_painting', name: '糖画', icon: '🍬', basePrice: 25, description: '麦芽糖绘制的糖画' },
  { id: 'round_fan', name: '团扇', icon: '🪭', basePrice: 45, description: '丝绸绘制的团扇' },
  { id: 'sachet', name: '香囊', icon: '🧵', basePrice: 30, description: '绣工精美的香囊' },
  { id: 'kite', name: '风筝', icon: '🪁', basePrice: 55, description: '纸糊彩绘的风筝' },
  { id: 'jade_pendant', name: '玉佩', icon: '💎', basePrice: 120, description: '温润的和田玉佩' },
  { id: 'rattle_drum', name: '拨浪鼓', icon: '🥁', basePrice: 20, description: '孩童喜爱的拨浪鼓' },
  { id: 'wooden_puppet', name: '木偶', icon: '🎎', basePrice: 65, description: '关节可动的木偶' },
  { id: 'silk_brocade', name: '织锦', icon: '🎀', basePrice: 90, description: '苏州织锦手帕' },
  { id: 'bamboo_hat', name: '竹笠', icon: '🎩', basePrice: 40, description: '遮阳避雨的竹编斗笠' }
];

export class Peddler {
  state: PeddlerState;
  goods: Goods[];
  money: number;
  reputation: number;
  stamina: number;
  successfulTrades: number;
  failedTrades: number;
  rounds: number;
  targetRevenue: number;

  constructor() {
    this.state = {
      x: 400,
      y: 0,
      targetX: 400,
      direction: 'right',
      walking: false,
      walkFrame: 0
    };
    this.goods = [...GOODS_LIST];
    this.money = 0;
    this.reputation = 50;
    this.stamina = 100;
    this.successfulTrades = 0;
    this.failedTrades = 0;
    this.rounds = 0;
    this.targetRevenue = 500;
  }

  setY(y: number): void {
    this.state.y = y;
  }

  moveTo(targetX: number): void {
    this.state.targetX = targetX;
    if (targetX > this.state.x) {
      this.state.direction = 'right';
    } else if (targetX < this.state.x) {
      this.state.direction = 'left';
    }
    this.state.walking = true;
  }

  update(deltaTime: number): DustParticle[] {
    const particles: DustParticle[] = [];
    const speed = 120;

    if (this.state.walking) {
      const dx = this.state.targetX - this.state.x;
      const absDx = Math.abs(dx);

      if (absDx < 2) {
        this.state.x = this.state.targetX;
        this.state.walking = false;
      } else {
        const moveAmount = speed * deltaTime;
        if (absDx <= moveAmount) {
          this.state.x = this.state.targetX;
          this.state.walking = false;
        } else {
          this.state.x += Math.sign(dx) * moveAmount;
        }
        this.state.walkFrame += deltaTime * 8;

        if (Math.random() < 0.3) {
          particles.push(this.createDustParticle());
        }
      }
    }

    return particles;
  }

  private createDustParticle(): DustParticle {
    return {
      x: this.state.x + (Math.random() - 0.5) * 20,
      y: this.state.y - 5,
      vx: (Math.random() - 0.5) * 40,
      vy: -20 - Math.random() * 20,
      life: 0,
      maxLife: 0.5 + Math.random() * 0.3,
      size: 2 + Math.random() * 3
    };
  }

  addMoney(amount: number): void {
    this.money += amount;
  }

  addReputation(amount: number): void {
    this.reputation = Math.max(0, Math.min(100, this.reputation + amount));
  }

  addStamina(amount: number): void {
    this.stamina = Math.max(0, Math.min(100, this.stamina + amount));
  }

  incrementRound(): void {
    this.rounds++;
  }

  recordTrade(success: boolean): void {
    if (success) {
      this.successfulTrades++;
    } else {
      this.failedTrades++;
    }
  }

  isGameOver(): boolean {
    return this.stamina <= 0 || this.money >= this.targetRevenue;
  }

  getTimeOfDay(): number {
    return Math.min(1, this.rounds / 25);
  }
}

export class Customer {
  entity: CustomerEntity;

  constructor(data: CustomerData, canvasWidth: number, streetY: number) {
    const fromLeft = Math.random() > 0.5;
    this.entity = {
      ...data,
      x: fromLeft ? -60 : canvasWidth + 60,
      y: streetY,
      targetX: fromLeft ? canvasWidth * 0.3 + Math.random() * canvasWidth * 0.4 : canvasWidth * 0.3 + Math.random() * canvasWidth * 0.4,
      walking: true,
      walkFrame: 0,
      direction: fromLeft ? 'right' : 'left',
      dialogVisible: false,
      interacted: false
    };
  }

  update(deltaTime: number, peddlerX: number, peddlerY: number): boolean {
    const speed = 60;
    let showedDialog = false;

    if (this.entity.walking && !this.entity.interacted) {
      const dx = this.entity.targetX - this.entity.x;
      const absDx = Math.abs(dx);

      if (absDx < 2) {
        this.entity.x = this.entity.targetX;
        this.entity.walking = false;
        this.entity.dialogVisible = true;
        showedDialog = true;
      } else {
        const moveAmount = speed * deltaTime;
        if (absDx <= moveAmount) {
          this.entity.x = this.entity.targetX;
          this.entity.walking = false;
          this.entity.dialogVisible = true;
          showedDialog = true;
        } else {
          this.entity.x += Math.sign(dx) * moveAmount;
        }
        this.entity.walkFrame += deltaTime * 6;
      }
    }

    return showedDialog;
  }

  isNearPeddler(peddlerX: number, peddlerY: number, threshold: number = 180): boolean {
    const dx = this.entity.x - peddlerX;
    const dy = this.entity.y - peddlerY;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  isAtDialogPosition(peddlerX: number): boolean {
    return Math.abs(this.entity.x - peddlerX) < 200;
  }

  checkDialogClick(clickX: number, clickY: number): boolean {
    if (!this.entity.dialogVisible || this.entity.interacted) return false;

    const dialogX = this.entity.x;
    const dialogY = this.entity.y - 140;
    const dialogWidth = 160;
    const dialogHeight = 50;

    return (
      clickX >= dialogX - dialogWidth / 2 &&
      clickX <= dialogX + dialogWidth / 2 &&
      clickY >= dialogY - dialogHeight / 2 &&
      clickY <= dialogY + dialogHeight / 2
    );
  }

  markInteracted(): void {
    this.entity.interacted = true;
    this.entity.dialogVisible = false;
  }
}
