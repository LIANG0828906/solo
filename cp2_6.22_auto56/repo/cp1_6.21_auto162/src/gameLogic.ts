export type CardState = 'hidden' | 'flipping' | 'revealed' | 'matching' | 'matched' | 'shaking';

export interface Card {
  id: number;
  gridIndex: number;
  iconIndex: number;
  state: CardState;
  flipProgress: number;
  shakeOffset: number;
  shakeTime: number;
  matchScale: number;
  flipDirection: 1 | -1;
  targetGridIndex: number | null;
  swapProgress: number;
}

export type GameStatus = 'idle' | 'playing' | 'checking' | 'won';

export class GameState {
  static readonly GRID_SIZE = 4;
  static readonly TOTAL_CARDS = GameState.GRID_SIZE * GameState.GRID_SIZE;
  static readonly CARD_SIZE = 120;
  static readonly CARD_GAP = 8;

  cards: Card[] = [];
  firstSelected: Card | null = null;
  secondSelected: Card | null = null;
  turnCount: number = 0;
  matchedPairs: number = 0;
  status: GameStatus = 'idle';
  startTime: number | null = null;
  elapsedTime: number = 0;
  checkTimer: number = 0;
  checkResult: 'success' | 'fail' | null = null;
  message: string = '点击任意卡片开始';

  private iconPool: number[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cards = [];
    this.firstSelected = null;
    this.secondSelected = null;
    this.turnCount = 0;
    this.matchedPairs = 0;
    this.status = 'idle';
    this.startTime = null;
    this.elapsedTime = 0;
    this.checkTimer = 0;
    this.checkResult = null;
    this.message = '点击任意卡片开始';

    this.generateIconPool();
    this.shuffleArray(this.iconPool);

    for (let i = 0; i < GameState.TOTAL_CARDS; i++) {
      this.cards.push({
        id: i,
        gridIndex: i,
        iconIndex: this.iconPool[i],
        state: 'hidden',
        flipProgress: 0,
        shakeOffset: 0,
        shakeTime: 0,
        matchScale: 1,
        flipDirection: 1,
        targetGridIndex: null,
        swapProgress: 0
      });
    }
  }

  private generateIconPool(): void {
    this.iconPool = [];
    const totalPairs = GameState.TOTAL_CARDS / 2;
    for (let i = 0; i < totalPairs; i++) {
      this.iconPool.push(i, i);
    }
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  handleCardClick(gridIndex: number): boolean {
    if (this.status === 'checking' || this.status === 'won') return false;

    const card = this.cards.find(c => c.gridIndex === gridIndex);
    if (!card || card.state !== 'hidden') return false;

    if (this.status === 'idle') {
      this.status = 'playing';
      this.startTime = performance.now();
      this.message = '';
    }

    card.state = 'flipping';
    card.flipDirection = 1;
    card.flipProgress = 0;

    if (!this.firstSelected) {
      this.firstSelected = card;
    } else {
      this.secondSelected = card;
      this.turnCount++;
      this.status = 'checking';
      this.checkResult = this.firstSelected.iconIndex === card.iconIndex ? 'success' : 'fail';
      this.checkTimer = this.checkResult === 'success' ? 0.3 : 0.6;
    }

    return true;
  }

  update(deltaTime: number): void {
    if (this.startTime !== null && this.status !== 'won') {
      this.elapsedTime = (performance.now() - this.startTime) / 1000;
    }

    for (const card of this.cards) {
      this.updateCardState(card, deltaTime);
    }

    if (this.status === 'checking' && this.firstSelected && this.secondSelected) {
      if (this.firstSelected.state === 'revealed' && this.secondSelected.state === 'revealed') {
        this.checkTimer -= deltaTime;

        if (this.checkTimer <= 0) {
          if (this.checkResult === 'success') {
            this.handleMatchSuccess();
          } else {
            this.handleMatchFail();
          }
        }
      }
    }

    if (this.matchedPairs === GameState.TOTAL_CARDS / 2) {
      this.status = 'won';
      this.message = '恭喜完成';
    }
  }

  private updateCardState(card: Card, deltaTime: number): void {
    switch (card.state) {
      case 'flipping':
        card.flipProgress += deltaTime * 2 * card.flipDirection;
        if (card.flipProgress >= 1) {
          card.flipProgress = 1;
          card.state = 'revealed';
        } else if (card.flipProgress <= 0) {
          card.flipProgress = 0;
          card.state = 'hidden';
        }
        break;

      case 'shaking':
        card.shakeTime += deltaTime;
        const shakeDuration = 0.3;
        const shakeFrequency = 12;
        const shakeAmplitude = 4;
        if (card.shakeTime < shakeDuration) {
          const phase = card.shakeTime * shakeFrequency * Math.PI * 2;
          card.shakeOffset = Math.sin(phase) * shakeAmplitude * (1 - card.shakeTime / shakeDuration);
        } else {
          card.shakeOffset = 0;
          card.shakeTime = 0;
          card.state = 'flipping';
          card.flipDirection = -1;
          card.flipProgress = 1;
        }
        break;

      case 'matching':
        card.matchScale -= deltaTime * 1.5;
        if (card.matchScale <= 0) {
          card.matchScale = 0;
          card.state = 'matched';
        }
        break;

      default:
        break;
    }
  }

  private handleMatchSuccess(): void {
    if (!this.firstSelected || !this.secondSelected) return;

    this.firstSelected.state = 'matching';
    this.secondSelected.state = 'matching';
    this.matchedPairs++;
    this.message = '配对成功继续';

    const matchedFirst = this.firstSelected;
    const matchedSecond = this.secondSelected;

    this.firstSelected = null;
    this.secondSelected = null;
    this.checkResult = null;

    if (this.matchedPairs < GameState.TOTAL_CARDS / 2) {
      this.swapUnrevealedCards();
    }

    this.status = 'playing';
  }

  private handleMatchFail(): void {
    if (!this.firstSelected || !this.secondSelected) return;

    this.firstSelected.state = 'shaking';
    this.secondSelected.state = 'shaking';
    this.message = '配对失败再试一次';

    this.firstSelected = null;
    this.secondSelected = null;
    this.checkResult = null;

    this.status = 'playing';
  }

  private swapUnrevealedCards(): void {
    const unrevealedCards = this.cards.filter(c => c.state === 'hidden');
    const positions = unrevealedCards.map(c => c.gridIndex);
    const shuffledPositions = [...positions];
    this.shuffleArray(shuffledPositions);

    for (let i = 0; i < unrevealedCards.length; i++) {
      unrevealedCards[i].gridIndex = shuffledPositions[i];
    }
  }

  getCardAtGrid(gridIndex: number): Card | undefined {
    return this.cards.find(c => c.gridIndex === gridIndex);
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = Math.floor(this.elapsedTime % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  getCardByGridIndex(gridIndex: number): Card | null {
    return this.cards.find(c => c.gridIndex === gridIndex) || null;
  }
}
