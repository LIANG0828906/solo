import { TabaoSimulator, RubbingPoint, RubbingMetrics } from './tabao';
import { RubbingSimulator, StrokePoint, CompareResult } from './rubbing';

interface HistoryItem {
  id: number;
  imageData: ImageData;
  thumbnail: string;
  metrics: RubbingMetrics;
  timestamp: number;
}

type AppState = 'rubbing' | 'revealing' | 'copying' | 'comparing';

const STELE_WIDTH = 400;
const STELE_HEIGHT = 600;
const PAPER_WIDTH = 240;
const PAPER_HEIGHT = 360;
const THUMB_WIDTH = 90;
const THUMB_HEIGHT = 60;
const MAX_HISTORY = 6;

const CHARACTERS = '九成宫醴泉铭秘书监检校侍中钜郡公臣魏徵奉敕撰维贞观六年孟夏之月皇帝';

class RubbingApp {
  private steleCanvas: HTMLCanvasElement;
  private steleCtx: CanvasRenderingContext2D;
  private paperCanvas: HTMLCanvasElement;
  private paperCtx: CanvasRenderingContext2D;
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  
  private tabao: TabaoSimulator;
  private rubbing: RubbingSimulator;
  
  private isRubbing: boolean = false;
  private isCopying: boolean = false;
  private lastRubbingPoint: RubbingPoint | null = null;
  
  private state: AppState = 'rubbing';
  private history: HistoryItem[] = [];
  private historyIdCounter: number = 0;
  private activeHistoryId: number | null = null;
  
  private coverageValue: HTMLElement;
  private inkValue: HTMLElement;
  private forceValue: HTMLElement;
  private statusBar: HTMLElement;
  private revealBtn: HTMLButtonElement;
  private compareBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private tabaoTool: HTMLElement;
  private scrollMask: HTMLElement;
  private historyBar: HTMLElement;
  
  private fpsCounter: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;
  
  private animationFrameId: number | null = null;

  constructor() {
    this.steleCanvas = document.getElementById('steleCanvas') as HTMLCanvasElement;
    this.paperCanvas = document.getElementById('paperCanvas') as HTMLCanvasElement;
    this.baseCanvas = document.createElement('canvas');
    
    this.steleCtx = this.steleCanvas.getContext('2d')!;
    this.paperCtx = this.paperCanvas.getContext('2d')!;
    this.baseCtx = this.baseCanvas.getContext('2d')!;
    
    this.baseCanvas.width = STELE_WIDTH;
    this.baseCanvas.height = STELE_HEIGHT;
    
    this.tabao = new TabaoSimulator();
    this.rubbing = new RubbingSimulator();
    this.rubbing.setCanvasSize(PAPER_WIDTH, PAPER_HEIGHT);
    
    this.coverageValue = document.getElementById('coverageValue')!;
    this.inkValue = document.getElementById('inkValue')!;
    this.forceValue = document.getElementById('forceValue')!;
    this.statusBar = document.getElementById('statusBar')!;
    this.revealBtn = document.getElementById('revealBtn') as HTMLButtonElement;
    this.compareBtn = document.getElementById('compareBtn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.tabaoTool = document.getElementById('tabaoTool')!;
    this.scrollMask = document.getElementById('scrollMask')!;
    this.historyBar = document.getElementById('historyBar')!;
    
    this.init();
  }

  private init(): void {
    this.drawSteleBase();
    this.clearPaper();
    this.bindEvents();
    this.startAnimationLoop();
    this.showStatus('请用鼠标在石碑上按压拖动进行拓印');
  }

  private drawSteleBase(): void {
    this.baseCtx.fillStyle = '#3A3A3A';
    this.baseCtx.fillRect(0, 0, STELE_WIDTH, STELE_HEIGHT);
    
    const cols = 5;
    const rows = 4;
    const charWidth = (STELE_WIDTH - 100) / cols;
    const charHeight = (STELE_HEIGHT - 100) / rows;
    const fontSize = Math.min(charWidth, charHeight) * 0.85;
    
    this.baseCtx.font = `bold ${fontSize}px "Noto Serif SC", "STKaiti", "KaiTi", serif`;
    this.baseCtx.textAlign = 'center';
    this.baseCtx.textBaseline = 'middle';
    
    for (let i = 0; i < 20; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 50 + col * charWidth + charWidth / 2;
      const y = 50 + row * charHeight + charHeight / 2;
      const char = CHARACTERS[i] || '';
      
      this.baseCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.baseCtx.shadowBlur = 3;
      this.baseCtx.shadowOffsetX = 2;
      this.baseCtx.shadowOffsetY = 2;
      
      this.baseCtx.fillStyle = '#2A2A2A';
      this.baseCtx.fillText(char, x, y);
      
      this.baseCtx.shadowOffsetX = -1;
      this.baseCtx.shadowOffsetY = -1;
      this.baseCtx.fillStyle = '#4A4A4A';
      this.baseCtx.fillText(char, x - 1, y - 1);
      
      this.baseCtx.shadowColor = 'transparent';
      this.baseCtx.shadowBlur = 0;
      this.baseCtx.shadowOffsetX = 0;
      this.baseCtx.shadowOffsetY = 0;
    }
    
    this.renderStele();
  }

  private renderStele(): void {
    this.steleCtx.drawImage(this.baseCanvas, 0, 0);
  }

  private clearPaper(): void {
    this.paperCtx.fillStyle = '#F5E6C8';
    this.paperCtx.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
    this.rubbing.clearStrokes();
  }

  private bindEvents(): void {
    this.steleCanvas.addEventListener('mousedown', (e) => this.handleSteleMouseDown(e));
    this.steleCanvas.addEventListener('mousemove', (e) => this.handleSteleMouseMove(e));
    this.steleCanvas.addEventListener('mouseup', () => this.handleSteleMouseUp());
    this.steleCanvas.addEventListener('mouseleave', () => this.handleSteleMouseUp());
    
    this.paperCanvas.addEventListener('mousedown', (e) => this.handlePaperMouseDown(e));
    this.paperCanvas.addEventListener('mousemove', (e) => this.handlePaperMouseMove(e));
    this.paperCanvas.addEventListener('mouseup', () => this.handlePaperMouseUp());
    this.paperCanvas.addEventListener('mouseleave', () => this.handlePaperMouseUp());
    
    this.revealBtn.addEventListener('click', () => this.handleReveal());
    this.compareBtn.addEventListener('click', () => this.handleCompare());
    this.resetBtn.addEventListener('click', () => this.handleReset());
  }

  private handleSteleMouseDown(e: MouseEvent): void {
    if (this.state !== 'rubbing') return;
    
    const rect = this.steleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.isRubbing = true;
    this.tabaoTool.classList.add('active');
    this.tabao.startPress(x, y);
    this.showStatus('笃-一声闷响');
  }

  private handleSteleMouseMove(e: MouseEvent): void {
    if (!this.isRubbing || this.state !== 'rubbing') return;
    
    const rect = this.steleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentTime = performance.now();
    const point = this.tabao.addPoint(x, y, currentTime);
    
    this.tabao.renderInk(this.steleCtx, point, STELE_WIDTH, STELE_HEIGHT);
    this.lastRubbingPoint = point;
    
    this.updateInfoPanel();
  }

  private handleSteleMouseUp(): void {
    if (!this.isRubbing) return;
    
    this.isRubbing = false;
    this.tabaoTool.classList.remove('active');
    this.tabao.endPress();
    
    const metrics = this.tabao.calculateMetrics();
    this.revealBtn.disabled = metrics.coverage < 10;
    
    if (metrics.coverage >= 60) {
      this.showStatus('拓印渐入佳境，可揭纸');
    } else if (metrics.coverage >= 10) {
      this.showStatus(`已覆盖 ${metrics.coverage.toFixed(1)}%，继续拓印`);
    }
  }

  private handlePaperMouseDown(e: MouseEvent): void {
    if (this.state !== 'copying') return;
    
    const rect = this.paperCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.isCopying = true;
    this.rubbing.startDrawing(x, y);
    this.showStatus('笔落纸上，沙沙作响');
  }

  private handlePaperMouseMove(e: MouseEvent): void {
    if (!this.isCopying || this.state !== 'copying') return;
    
    const rect = this.paperCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentStroke = this.rubbing.getCurrentStroke();
    const newPoint = this.rubbing.addStrokePoint(x, y);
    
    if (newPoint && currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      this.rubbing.renderStroke(this.paperCtx, lastPoint, newPoint);
    }
  }

  private handlePaperMouseUp(): void {
    if (!this.isCopying) return;
    
    this.isCopying = false;
    const stroke = this.rubbing.endDrawing();
    
    if (stroke.length > 0) {
      this.compareBtn.disabled = false;
    }
  }

  private handleReveal(): void {
    if (this.state !== 'rubbing') return;
    
    this.state = 'revealing';
    this.showStatus('揭纸中...');
    
    this.scrollMask.style.display = 'block';
    
    setTimeout(() => {
      this.scrollMask.style.display = 'none';
      this.transferToPaper();
      this.state = 'copying';
      this.revealBtn.disabled = true;
      this.showStatus('拓片已成，可在宣纸上临摹');
      
      this.saveToHistory();
    }, 1500);
  }

  private transferToPaper(): void {
    const metrics = this.tabao.calculateMetrics();
    const intensityMap = this.tabao.createIntensityMap(STELE_WIDTH, STELE_HEIGHT, metrics.clarity);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = STELE_WIDTH;
    tempCanvas.height = STELE_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(intensityMap, 0, 0);
    
    this.clearPaper();
    
    const scale = Math.min(PAPER_WIDTH / STELE_WIDTH, PAPER_HEIGHT / STELE_HEIGHT) * 0.9;
    const offsetX = (PAPER_WIDTH - STELE_WIDTH * scale) / 2;
    const offsetY = (PAPER_HEIGHT - STELE_HEIGHT * scale) / 2;
    
    this.paperCtx.drawImage(
      tempCanvas,
      offsetX, offsetY,
      STELE_WIDTH * scale,
      STELE_HEIGHT * scale
    );
  }

  private handleCompare(): void {
    if (this.state !== 'copying') return;
    
    this.state = 'comparing';
    this.showStatus('比对中...');
    
    setTimeout(() => {
      const result = this.rubbing.compareWithOriginal();
      this.displayCompareResult(result);
      this.state = 'copying';
    }, 100);
  }

  private displayCompareResult(result: CompareResult): void {
    const messages: Record<string, string> = {
      '神似': `笔墨精妙，神形兼备！相似度 ${result.similarity}%`,
      '形似': `结构尚可，笔意待琢。相似度 ${result.similarity}%`,
      '欠佳': `需勤加练习。相似度 ${result.similarity}%`
    };
    
    const detailText = `覆盖:${result.details.coverage}% 精准:${result.details.overlap}% 偏离:${result.details.deviation}%`;
    this.showStatus(`${messages[result.grade]} ${detailText}`);
  }

  private handleReset(): void {
    this.state = 'rubbing';
    this.isRubbing = false;
    this.isCopying = false;
    this.activeHistoryId = null;
    
    this.tabao.clear();
    this.rubbing.clearStrokes();
    
    this.renderStele();
    this.clearPaper();
    
    this.revealBtn.disabled = true;
    this.compareBtn.disabled = true;
    
    this.coverageValue.textContent = '0';
    this.inkValue.textContent = '0';
    this.forceValue.textContent = '50';
    
    this.showStatus('已重置，请重新开始拓印');
    this.updateHistoryUI();
  }

  private saveToHistory(): void {
    const metrics = this.tabao.calculateMetrics();
    const intensityMap = this.tabao.createIntensityMap(STELE_WIDTH, STELE_HEIGHT, metrics.clarity);
    
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMB_WIDTH;
    thumbCanvas.height = THUMB_HEIGHT;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = STELE_WIDTH;
    tempCanvas.height = STELE_HEIGHT;
    tempCanvas.getContext('2d')!.putImageData(intensityMap, 0, 0);
    
    thumbCtx.fillStyle = '#F5E6C8';
    thumbCtx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);
    thumbCtx.drawImage(tempCanvas, 0, 0, STELE_WIDTH, STELE_HEIGHT, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
    
    const item: HistoryItem = {
      id: ++this.historyIdCounter,
      imageData: intensityMap,
      thumbnail: thumbCanvas.toDataURL('image/png'),
      metrics,
      timestamp: Date.now()
    };
    
    if (this.history.length >= MAX_HISTORY) {
      const oldestThumb = this.historyBar.querySelector('.history-thumb:not(.empty)');
      if (oldestThumb) {
        oldestThumb.classList.add('fade-out');
        setTimeout(() => {
          this.history.shift();
          this.history.push(item);
          this.updateHistoryUI();
        }, 400);
        return;
      }
    }
    
    this.history.push(item);
    this.updateHistoryUI();
  }

  private updateHistoryUI(): void {
    const thumbs = this.historyBar.querySelectorAll<HTMLElement>('.history-thumb');
    
    thumbs.forEach((thumb, index) => {
      thumb.classList.remove('active', 'fade-out');
      
      if (index < this.history.length) {
        const item = this.history[index];
        thumb.classList.remove('empty');
        thumb.innerHTML = `
          <img src="${item.thumbnail}" style="width:100%;height:100%;object-fit:cover;" />
          <span class="history-label">#${item.id}</span>
        `;
        
        if (item.id === this.activeHistoryId) {
          thumb.classList.add('active');
        }
        
        thumb.onclick = () => this.loadHistoryItem(item);
      } else {
        thumb.classList.add('empty');
        thumb.innerHTML = '';
        thumb.onclick = null;
      }
    });
  }

  private loadHistoryItem(item: HistoryItem): void {
    this.activeHistoryId = item.id;
    this.state = 'copying';
    
    this.isRubbing = false;
    this.isCopying = false;
    
    this.rubbing.clearStrokes();
    this.compareBtn.disabled = true;
    
    this.clearPaper();
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = STELE_WIDTH;
    tempCanvas.height = STELE_HEIGHT;
    tempCanvas.getContext('2d')!.putImageData(item.imageData, 0, 0);
    
    const scale = Math.min(PAPER_WIDTH / STELE_WIDTH, PAPER_HEIGHT / STELE_HEIGHT) * 0.9;
    const offsetX = (PAPER_WIDTH - STELE_WIDTH * scale) / 2;
    const offsetY = (PAPER_HEIGHT - STELE_HEIGHT * scale) / 2;
    
    this.paperCtx.drawImage(
      tempCanvas,
      offsetX, offsetY,
      STELE_WIDTH * scale,
      STELE_HEIGHT * scale
    );
    
    this.showStatus(`已加载拓片 #${item.id}，清晰度 ${item.metrics.clarity.toFixed(1)}%`);
    this.updateHistoryUI();
  }

  private updateInfoPanel(): void {
    const metrics = this.tabao.calculateMetrics();
    
    this.coverageValue.textContent = metrics.coverage.toFixed(1);
    this.inkValue.textContent = metrics.totalInk.toFixed(1);
    this.forceValue.textContent = this.tabao.getForcePercentage().toString();
  }

  private showStatus(text: string): void {
    this.statusBar.innerHTML = `<span class="feedback-text">${text}</span>`;
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();
    
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.updateFPS(currentTime);
      
      if (this.state === 'copying' && this.rubbing.isCurrentlyDrawing()) {
        this.rubbing.renderTrail(this.paperCtx, currentTime);
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateFPS(currentTime: number): void {
    this.fpsCounter++;
    
    if (currentTime - this.lastFpsTime >= 1000) {
      this.currentFps = this.fpsCounter;
      this.fpsCounter = 0;
      this.lastFpsTime = currentTime;
      
      if (this.currentFps < 50) {
        console.warn(`FPS dropped to ${this.currentFps}, below 50fps target`);
      }
    }
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RubbingApp();
});
