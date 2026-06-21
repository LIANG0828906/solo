import type { Stock, PanelState, AnimatedPrice } from './types';
import { CONFIG } from './types';

export class StockPanel {
  private searchBox: HTMLInputElement;
  private stockList: HTMLElement;
  private stocks: Stock[] = [];
  private state: PanelState;
  private animatedPrices: Map<string, AnimatedPrice> = new Map();
  private onStockSelect: ((stockId: string | null) => void) | null = null;
  private onAddAnnotation: ((stockId: string, text: string, color: string) => void) | null = null;
  private annotationColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da'];

  constructor(_container: HTMLElement) {
    this.searchBox = _container.querySelector('#searchBox') as HTMLInputElement;
    this.stockList = _container.querySelector('#stockList') as HTMLElement;

    this.state = {
      selectedStockId: null,
      searchQuery: '',
      expandedAnnotationStockId: null
    };

    this.setupEventListeners();
  }

  public setOnStockSelect(callback: (stockId: string | null) => void): void {
    this.onStockSelect = callback;
  }

  public setOnAddAnnotation(callback: (stockId: string, text: string, color: string) => void): void {
    this.onAddAnnotation = callback;
  }

  public updateStocks(stocks: Stock[]): void {
    this.stocks = stocks;
    this.render();
    this.updatePriceAnimations();
  }

  private setupEventListeners(): void {
    this.searchBox.addEventListener('input', (e) => {
      this.state.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
    });
  }

  private getFilteredStocks(): Stock[] {
    const query = this.state.searchQuery.toLowerCase().trim();
    if (!query) return this.stocks.slice(0, 8);
    
    return this.stocks
      .filter(stock => 
        stock.code.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }

  public render(): void {
    const filteredStocks = this.getFilteredStocks();
    
    this.stockList.innerHTML = '';
    
    filteredStocks.forEach(stock => {
      const card = this.createStockCard(stock);
      this.stockList.appendChild(card);
    });

    if (filteredStocks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
      `;
      emptyState.textContent = '未找到匹配的股票';
      this.stockList.appendChild(emptyState);
    }
  }

  private createStockCard(stock: Stock): HTMLElement {
    const card = document.createElement('div');
    const isUp = stock.lastPrice >= stock.prevPrice;
    const changePercent = ((stock.lastPrice - stock.basePrice) / stock.basePrice) * 100;
    const isSelected = this.state.selectedStockId === stock.id;
    const isExpanded = this.state.expandedAnnotationStockId === stock.id;

    card.className = `stock-card ${isUp ? 'up' : 'down'} ${isSelected ? 'selected' : ''}`;
    card.dataset.stockId = stock.id;

    const volatility = this.calculateVolatility(stock);
    const volume = this.formatVolume(stock);

    card.innerHTML = `
      <div class="stock-header">
        <div>
          <div class="stock-name">${stock.name}</div>
          <div class="stock-code">${stock.code}</div>
        </div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${stock.color};"></div>
      </div>
      <div class="stock-price-row">
        <div class="stock-price ${isUp ? 'up' : 'down'}" data-price-element="${stock.id}">
          ${stock.lastPrice.toFixed(2)}
        </div>
        <div class="stock-change ${changePercent >= 0 ? 'up' : 'down'}">
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
            ${changePercent >= 0 
              ? '<path d="M7 14l5-5 5 5z"/>' 
              : '<path d="M7 10l5 5 5-5z"/>'
            }
          </svg>
          ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
        </div>
      </div>
      <div class="stock-stats">
        <span>波动率 ${volatility.toFixed(2)}%</span>
        <span>量 ${volume}</span>
      </div>
      <button class="annotate-btn" data-annotate-btn="${stock.id}">
        ${isExpanded ? '收起标注' : '+ 添加标注'}
      </button>
      ${isExpanded ? this.createAnnotationForm(stock.id) : ''}
    `;

    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-annotate-btn]') || target.closest('.annotation-form')) {
        return;
      }
      this.handleStockClick(stock.id);
    });

    const annotateBtn = card.querySelector('[data-annotate-btn]');
    if (annotateBtn) {
      annotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAnnotation(stock.id);
      });
    }

    return card;
  }

  private createAnnotationForm(stockId: string): string {
    const randomColor = this.annotationColors[Math.floor(Math.random() * this.annotationColors.length)];
    return `
      <div class="annotation-form" data-annotation-form="${stockId}">
        <textarea 
          class="annotation-input" 
          placeholder="输入标注内容..."
          rows="2"
          data-annotation-input="${stockId}"
        ></textarea>
        <div class="annotation-controls">
          <input 
            type="color" 
            class="color-picker" 
            value="${randomColor}"
            data-color-picker="${stockId}"
          />
          <button class="submit-annotation" data-submit-annotation="${stockId}">
            确认标注
          </button>
        </div>
      </div>
    `;
  }

  private handleStockClick(stockId: string): void {
    this.state.selectedStockId = this.state.selectedStockId === stockId ? null : stockId;
    this.state.expandedAnnotationStockId = null;
    this.render();
    
    if (this.onStockSelect) {
      this.onStockSelect(this.state.selectedStockId);
    }
  }

  private toggleAnnotation(stockId: string): void {
    if (this.state.expandedAnnotationStockId === stockId) {
      this.state.expandedAnnotationStockId = null;
    } else {
      this.state.expandedAnnotationStockId = stockId;
    }
    this.render();

    if (this.state.expandedAnnotationStockId) {
      setTimeout(() => {
        const input = this.stockList.querySelector(`[data-annotation-input="${stockId}"]`) as HTMLTextAreaElement;
        if (input) {
          input.focus();
        }

        const submitBtn = this.stockList.querySelector(`[data-submit-annotation="${stockId}"]`);
        if (submitBtn) {
          submitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.submitAnnotation(stockId);
          });
        }

        const form = this.stockList.querySelector(`[data-annotation-form="${stockId}"]`);
        if (form) {
          form.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      }, 0);
    }
  }

  private submitAnnotation(stockId: string): void {
    const input = this.stockList.querySelector(`[data-annotation-input="${stockId}"]`) as HTMLTextAreaElement;
    const colorPicker = this.stockList.querySelector(`[data-color-picker="${stockId}"]`) as HTMLInputElement;
    
    const text = input?.value.trim() || '';
    const color = colorPicker?.value || '#ff6b6b';

    if (text && this.onAddAnnotation) {
      this.onAddAnnotation(stockId, text, color);
      this.state.expandedAnnotationStockId = null;
      this.render();
    }
  }

  private calculateVolatility(stock: Stock): number {
    const visibleCount = Math.min(CONFIG.VISIBLE_POINTS, stock.data.length);
    if (visibleCount < 2) return 0;

    const startIndex = Math.max(0, stock.data.length - visibleCount);
    let sum = 0;
    let sumSq = 0;

    for (let i = startIndex; i < stock.data.length; i++) {
      const price = stock.data[i].price;
      sum += price;
      sumSq += price * price;
    }

    const count = stock.data.length - startIndex;
    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    
    return (stdDev / mean) * 100;
  }

  private formatVolume(stock: Stock): string {
    if (stock.data.length === 0) return '0';
    const recentVolume = stock.data[stock.data.length - 1].volume;
    
    if (recentVolume >= 100000000) {
      return (recentVolume / 100000000).toFixed(2) + '亿';
    } else if (recentVolume >= 10000) {
      return (recentVolume / 10000).toFixed(2) + '万';
    }
    return recentVolume.toString();
  }

  private updatePriceAnimations(): void {
    const now = performance.now();

    this.stocks.forEach(stock => {
      const priceElement = this.stockList.querySelector(`[data-price-element="${stock.id}"]`);
      if (!priceElement) return;

      let anim = this.animatedPrices.get(stock.id);
      
      if (!anim) {
        anim = {
          element: priceElement as HTMLElement,
          currentValue: stock.lastPrice,
          targetValue: stock.lastPrice,
          startTime: now,
          duration: CONFIG.ANIMATION_DURATION_PRICE
        };
        this.animatedPrices.set(stock.id, anim);
      } else {
        anim.targetValue = stock.lastPrice;
        if (Math.abs(anim.currentValue - anim.targetValue) > 0.001) {
          anim.startTime = now;
        }
      }
    });

    this.animatedPrices.forEach((anim, stockId) => {
      const stock = this.stocks.find(s => s.id === stockId);
      if (!stock) return;

      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      
      if (progress < 1) {
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        anim.currentValue = anim.currentValue + (anim.targetValue - anim.currentValue) * easeProgress;
        anim.element.textContent = anim.currentValue.toFixed(2);
      } else {
        anim.currentValue = anim.targetValue;
        anim.element.textContent = anim.targetValue.toFixed(2);
      }

      const isUp = anim.targetValue >= stock.prevPrice;
      anim.element.classList.toggle('up', isUp);
      anim.element.classList.toggle('down', !isUp);
    });
  }

  public updatePriceAnimationFrame(): void {
    const now = performance.now();
    let needsUpdate = false;

    this.animatedPrices.forEach(anim => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      
      if (progress < 1) {
        needsUpdate = true;
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        anim.currentValue = anim.currentValue + (anim.targetValue - anim.currentValue) * easeProgress;
        anim.element.textContent = anim.currentValue.toFixed(2);
      } else {
        anim.currentValue = anim.targetValue;
        anim.element.textContent = anim.targetValue.toFixed(2);
      }
    });

    if (needsUpdate) {
      requestAnimationFrame(() => this.updatePriceAnimationFrame());
    }
  }
}
