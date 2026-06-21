import { Board, PathPoint } from './Board';
import { Cell, CellState } from './Cell';
import { SoundManager } from './SoundManager';

enum GamePhase {
    FADE_IN,
    IDLE,
    SELECTED,
    SHOW_PATH,
    ELIMINATING,
    ERROR_FLASH,
    VICTORY
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
    maxLife: number;
}

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private board: Board;
    private sound: SoundManager;

    private phase: GamePhase = GamePhase.FADE_IN;
    private phaseStartTime: number = 0;

    private selectedRow = -1;
    private selectedCol = -1;

    private steps = 0;
    private gameStartTime = 0;
    private elapsedSeconds = 0;
    private timerRunning = false;
    private hintsRemaining = 3;

    private currentPath: PathPoint[] | null = null;

    private elimR1 = -1;
    private elimC1 = -1;
    private elimR2 = -1;
    private elimC2 = -1;

    private errorR1 = -1;
    private errorC1 = -1;
    private errorR2 = -1;
    private errorC2 = -1;

    private hintR1 = -1;
    private hintC1 = -1;
    private hintR2 = -1;
    private hintC2 = -1;

    private hoveredRow = -1;
    private hoveredCol = -1;

    private cellSize = 60;
    private boardOffsetX = 0;
    private boardOffsetY = 0;

    private confettiParticles: Particle[] = [];
    private confettiCanvas: HTMLCanvasElement;
    private confettiCtx: CanvasRenderingContext2D;

    private stepsEl: HTMLElement;
    private timeEl: HTMLElement;
    private remainEl: HTMLElement;
    private hintBtn: HTMLButtonElement;
    private victoryOverlay: HTMLElement;
    private vTimeEl: HTMLElement;
    private vStepsEl: HTMLElement;

    private lastTimerUpdate = 0;

    constructor() {
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
        this.confettiCtx = this.confettiCanvas.getContext('2d')!;

        this.stepsEl = document.getElementById('steps-val')!;
        this.timeEl = document.getElementById('time-val')!;
        this.remainEl = document.getElementById('remain-val')!;
        this.hintBtn = document.getElementById('hint-btn') as HTMLButtonElement;
        this.victoryOverlay = document.getElementById('victory-overlay')!;
        this.vTimeEl = document.getElementById('v-time')!;
        this.vStepsEl = document.getElementById('v-steps')!;

        this.board = new Board();
        this.sound = new SoundManager();

        this.setupCanvas();
        this.setupEvents();
        this.newGame();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    private setupCanvas(): void {
        const container = this.canvas.parentElement!;
        const maxW = Math.min(container.clientWidth - 16, 640);
        const maxH = window.innerHeight - 200;

        const cellFromW = Math.floor(maxW / this.board.cols);
        const cellFromH = Math.floor(maxH / this.board.rows);
        this.cellSize = Math.min(cellFromW, cellFromH, 64);
        this.cellSize = Math.max(this.cellSize, 32);

        const canvasW = this.board.cols * this.cellSize;
        const canvasH = this.board.rows * this.cellSize;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = canvasW * dpr;
        this.canvas.height = canvasH * dpr;
        this.canvas.style.width = canvasW + 'px';
        this.canvas.style.height = canvasH + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.boardOffsetX = 0;
        this.boardOffsetY = 0;
    }

    private setupEvents(): void {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredRow = -1;
            this.hoveredCol = -1;
        });
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerEvent(touch.clientX, touch.clientY);
        }, { passive: false });

        this.hintBtn.addEventListener('click', () => this.useHint());

        document.getElementById('restart-btn')!.addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('quit-btn')!.addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('play-again-btn')!.addEventListener('click', () => {
            this.victoryOverlay.classList.remove('active');
            this.newGame();
        });

        window.addEventListener('resize', () => this.setupCanvas());
    }

    private getCellFromEvent(e: MouseEvent): { row: number; col: number } | null {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return this.getCellFromPos(x, y);
    }

    private getCellFromPos(clientX: number, clientY: number): { row: number; col: number } | null {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const col = Math.floor((x - this.boardOffsetX) / this.cellSize);
        const row = Math.floor((y - this.boardOffsetY) / this.cellSize);
        if (row >= 0 && row < this.board.rows && col >= 0 && col < this.board.cols) {
            return { row, col };
        }
        return null;
    }

    private handleClick(e: MouseEvent): void {
        const cell = this.getCellFromEvent(e);
        if (!cell) return;
        this.onCellClick(cell.row, cell.col);
    }

    private handleMouseMove(e: MouseEvent): void {
        const cell = this.getCellFromEvent(e);
        if (cell) {
            this.hoveredRow = cell.row;
            this.hoveredCol = cell.col;
        } else {
            this.hoveredRow = -1;
            this.hoveredCol = -1;
        }
    }

    private handlePointerEvent(clientX: number, clientY: number): void {
        const cell = this.getCellFromPos(clientX, clientY);
        if (cell) {
            this.onCellClick(cell.row, cell.col);
        }
    }

    private onCellClick(row: number, col: number): void {
        if (this.phase !== GamePhase.IDLE && this.phase !== GamePhase.SELECTED) return;

        const cell = this.board.getCell(row, col);
        if (cell.isEmpty) return;
        if (cell.state === CellState.ELIMINATING || cell.state === CellState.ERROR) return;

        const now = performance.now();

        if (this.phase === GamePhase.IDLE) {
            this.selectedRow = row;
            this.selectedCol = col;
            cell.setState(CellState.SELECTED, now);
            this.phase = GamePhase.SELECTED;
            this.phaseStartTime = now;
            this.sound.playSelect();
            return;
        }

        if (this.phase === GamePhase.SELECTED) {
            if (row === this.selectedRow && col === this.selectedCol) {
                this.board.getCell(this.selectedRow, this.selectedCol).setState(CellState.NORMAL, now);
                this.selectedRow = -1;
                this.selectedCol = -1;
                this.phase = GamePhase.IDLE;
                return;
            }

            const prevCell = this.board.getCell(this.selectedRow, this.selectedCol);

            if (!this.timerRunning) {
                this.gameStartTime = now;
                this.timerRunning = true;
            }

            this.steps++;
            this.updateStats();

            const path = this.board.findPath(this.selectedRow, this.selectedCol, row, col);

            if (path) {
                this.currentPath = path;
                this.elimR1 = this.selectedRow;
                this.elimC1 = this.selectedCol;
                this.elimR2 = row;
                this.elimC2 = col;
                prevCell.setState(CellState.NORMAL, now);
                this.phase = GamePhase.SHOW_PATH;
                this.phaseStartTime = now;
            } else {
                this.errorR1 = this.selectedRow;
                this.errorC1 = this.selectedCol;
                this.errorR2 = row;
                this.errorC2 = col;
                prevCell.setState(CellState.ERROR, now);
                cell.setState(CellState.ERROR, now);
                this.phase = GamePhase.ERROR_FLASH;
                this.phaseStartTime = now;
                this.sound.playError();
                this.selectedRow = -1;
                this.selectedCol = -1;
            }
        }
    }

    private useHint(): void {
        if (this.hintsRemaining <= 0) return;
        if (this.phase !== GamePhase.IDLE && this.phase !== GamePhase.SELECTED) return;

        const now = performance.now();
        const hint = this.board.findHint();

        if (!hint) {
            this.board.reshuffleRemaining();
            this.updateStats();
            return;
        }

        this.hintsRemaining--;
        this.hintBtn.textContent = `💡 提示 (${this.hintsRemaining})`;
        if (this.hintsRemaining <= 0) {
            this.hintBtn.disabled = true;
        }

        if (this.phase === GamePhase.SELECTED && this.selectedRow >= 0) {
            this.board.getCell(this.selectedRow, this.selectedCol).setState(CellState.NORMAL, now);
            this.selectedRow = -1;
            this.selectedCol = -1;
        }

        const [r1, c1, r2, c2] = hint;
        this.hintR1 = r1;
        this.hintC1 = c1;
        this.hintR2 = r2;
        this.hintC2 = c2;

        this.board.getCell(r1, c1).setState(CellState.HINT, now);
        this.board.getCell(r2, c2).setState(CellState.HINT, now);

        this.phase = GamePhase.IDLE;
    }

    private newGame(): void {
        this.board = new Board();
        this.phase = GamePhase.FADE_IN;
        this.phaseStartTime = performance.now();
        this.board.setFadeDelays(this.phaseStartTime);

        this.selectedRow = -1;
        this.selectedCol = -1;
        this.steps = 0;
        this.gameStartTime = 0;
        this.elapsedSeconds = 0;
        this.timerRunning = false;
        this.hintsRemaining = 3;
        this.currentPath = null;
        this.confettiParticles = [];

        this.hintBtn.disabled = false;
        this.hintBtn.textContent = '💡 提示 (3)';
        this.victoryOverlay.classList.remove('active');

        this.setupCanvas();
        this.updateStats();
    }

    private updateStats(): void {
        this.stepsEl.textContent = this.steps.toString();
        this.remainEl.textContent = this.board.getRemainingCount().toString();
    }

    private formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
    }

    private gameLoop(timestamp: number): void {
        this.update(timestamp);
        this.render(timestamp);
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    private update(now: number): void {
        if (this.timerRunning && this.phase !== GamePhase.VICTORY) {
            const elapsed = Math.floor((now - this.gameStartTime) / 1000);
            if (elapsed !== this.elapsedSeconds) {
                this.elapsedSeconds = elapsed;
                this.timeEl.textContent = this.formatTime(elapsed);
            }
        }

        switch (this.phase) {
            case GamePhase.FADE_IN: {
                const fadeElapsed = now - this.phaseStartTime;
                const totalFadeTime = (this.board.rows * this.board.cols) * 25 + 400;
                if (fadeElapsed > totalFadeTime) {
                    this.phase = GamePhase.IDLE;
                    for (let r = 0; r < this.board.rows; r++) {
                        for (let c = 0; c < this.board.cols; c++) {
                            const cell = this.board.getCell(r, c);
                            if (cell.state === CellState.FADE_IN) {
                                cell.state = CellState.NORMAL;
                            }
                        }
                    }
                }
                break;
            }

            case GamePhase.SHOW_PATH: {
                const elapsed = now - this.phaseStartTime;
                if (elapsed >= 300) {
                    this.currentPath = null;
                    this.phase = GamePhase.ELIMINATING;
                    this.phaseStartTime = now;
                    this.sound.playMatch();
                }
                break;
            }

            case GamePhase.ELIMINATING: {
                const elapsed = now - this.phaseStartTime;
                if (elapsed >= 400) {
                    this.board.eliminate(this.elimR1, this.elimC1, this.elimR2, this.elimC2);
                    this.elimR1 = -1;
                    this.elimC1 = -1;
                    this.elimR2 = -1;
                    this.elimC2 = -1;
                    this.updateStats();

                    if (this.board.isBoardCleared()) {
                        this.phase = GamePhase.VICTORY;
                        this.phaseStartTime = now;
                        this.timerRunning = false;
                        this.showVictory();
                    } else {
                        const hint = this.board.findHint();
                        if (!hint) {
                            this.board.reshuffleRemaining();
                            this.updateStats();
                        }
                        this.phase = GamePhase.IDLE;
                    }

                    this.selectedRow = -1;
                    this.selectedCol = -1;
                }
                break;
            }

            case GamePhase.ERROR_FLASH: {
                const elapsed = now - this.phaseStartTime;
                if (elapsed >= 300) {
                    if (this.errorR1 >= 0) {
                        const c1 = this.board.getCell(this.errorR1, this.errorC1);
                        if (c1.state === CellState.ERROR) c1.state = CellState.NORMAL;
                    }
                    if (this.errorR2 >= 0) {
                        const c2 = this.board.getCell(this.errorR2, this.errorC2);
                        if (c2.state === CellState.ERROR) c2.state = CellState.NORMAL;
                    }
                    this.errorR1 = -1;
                    this.errorC1 = -1;
                    this.errorR2 = -1;
                    this.errorC2 = -1;
                    this.phase = GamePhase.IDLE;
                }
                break;
            }

            case GamePhase.VICTORY: {
                this.updateConfetti();
                break;
            }
        }
    }

    private render(now: number): void {
        const ctx = this.ctx;
        const w = this.board.cols * this.cellSize;
        const h = this.board.rows * this.cellSize;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, w, h);

        for (let r = 0; r < this.board.rows; r++) {
            for (let c = 0; c < this.board.cols; c++) {
                const cell = this.board.getCell(r, c);
                if (cell.isEmpty) continue;

                const x = this.boardOffsetX + c * this.cellSize;
                const y = this.boardOffsetY + r * this.cellSize;

                let elimProgress: number | undefined;
                let elimCenterX: number | undefined;
                let elimCenterY: number | undefined;

                if (this.phase === GamePhase.ELIMINATING &&
                    ((r === this.elimR1 && c === this.elimC1) || (r === this.elimR2 && c === this.elimC2))) {
                    elimProgress = (now - this.phaseStartTime) / 400;
                    const x1 = this.boardOffsetX + this.elimC1 * this.cellSize + this.cellSize / 2;
                    const y1 = this.boardOffsetY + this.elimR1 * this.cellSize + this.cellSize / 2;
                    const x2 = this.boardOffsetX + this.elimC2 * this.cellSize + this.cellSize / 2;
                    const y2 = this.boardOffsetY + this.elimR2 * this.cellSize + this.cellSize / 2;
                    elimCenterX = (x1 + x2) / 2;
                    elimCenterY = (y1 + y2) / 2;
                }

                const isHovered = r === this.hoveredRow && c === this.hoveredCol;

                cell.draw(ctx, x, y, this.cellSize, now, elimProgress, elimCenterX, elimCenterY, isHovered);
            }
        }

        if (this.currentPath && this.phase === GamePhase.SHOW_PATH) {
            this.drawPath(ctx, now);
        }
    }

    private drawPath(ctx: CanvasRenderingContext2D, now: number): void {
        if (!this.currentPath || this.currentPath.length < 2) return;

        const elapsed = now - this.phaseStartTime;
        const alpha = elapsed < 200 ? 1 : 1 - (elapsed - 200) / 100;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = `rgba(100, 200, 255, ${Math.max(0, alpha) * 0.8})`;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let i = 0; i < this.currentPath.length; i++) {
            const p = this.currentPath[i];
            const px = this.boardOffsetX + p.col * this.cellSize + this.cellSize / 2;
            const py = this.boardOffsetY + p.row * this.cellSize + this.cellSize / 2;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = `rgba(150, 220, 255, ${Math.max(0, alpha) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
    }

    private showVictory(): void {
        this.vTimeEl.textContent = this.formatTime(this.elapsedSeconds);
        this.vStepsEl.textContent = this.steps.toString();
        this.victoryOverlay.classList.add('active');
        this.sound.playVictory();

        const modal = document.getElementById('victory-modal')!;
        this.confettiCanvas.width = modal.clientWidth;
        this.confettiCanvas.height = modal.clientHeight;

        this.spawnConfetti();
    }

    private spawnConfetti(): void {
        const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BB5', '#C77DFF', '#FF9F43', '#00D2FF'];
        const cw = this.confettiCanvas.width;
        const ch = this.confettiCanvas.height;

        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: Math.random() * cw,
                y: -Math.random() * ch * 0.5,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.15,
                life: 0,
                maxLife: 3000 + Math.random() * 2000
            });
        }
    }

    private updateConfetti(): void {
        const cw = this.confettiCanvas.width;
        const ch = this.confettiCanvas.height;
        const ctx = this.confettiCtx;

        ctx.clearRect(0, 0, cw, ch);

        const dt = 16;
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const p = this.confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.vx *= 0.99;
            p.rotation += p.rotationSpeed;
            p.life += dt;

            if (p.life > p.maxLife || p.y > ch + 20) {
                this.confettiParticles.splice(i, 1);
                continue;
            }

            const lifeAlpha = p.life > p.maxLife * 0.7 ? 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3) : 1;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = lifeAlpha;
            ctx.fillStyle = p.color;

            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);

            ctx.restore();
        }

        if (this.confettiParticles.length < 20 && Math.random() < 0.1) {
            this.spawnConfetti();
        }
    }
}

const game = new Game();
