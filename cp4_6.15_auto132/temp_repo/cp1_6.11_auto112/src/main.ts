import { Analyzer, type HistoryItem } from './analyzer';
import { UI } from './ui';

class App {
  private analyzer: Analyzer;
  private ui: UI;
  private currentImage: HTMLImageElement | null = null;
  private history: HistoryItem[] = [];

  constructor() {
    this.analyzer = new Analyzer();

    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const reportPanel = document.getElementById('report-panel')!;
    const historySection = document.getElementById('history-section')!;

    this.ui = new UI(canvas, reportPanel, historySection);

    this.initEventListeners();
  }

  private initEventListeners(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const uploadZone = document.getElementById('upload-zone')!;
    const uploadBtn = document.getElementById('upload-btn')!;
    const historyContainer = document.getElementById('history-container')!;

    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFileUpload(target.files[0]);
      }
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (this.isValidImageFile(file)) {
          this.handleFileUpload(file);
        } else {
          alert('请上传 JPG 或 PNG 格式的图片文件');
        }
      }
    });

    historyContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const historyItem = target.closest('.history-item') as HTMLElement;
      if (historyItem && historyItem.dataset.id) {
        this.handleHistoryClick(historyItem.dataset.id);
      }
    });
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png'];
    return validTypes.includes(file.type);
  }

  private handleFileUpload(file: File): void {
    if (!this.isValidImageFile(file)) {
      alert('请上传 JPG 或 PNG 格式的图片文件');
      return;
    }

    this.ui.showLoading();

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.ui.renderImage(img);
        this.performAnalysis();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private performAnalysis(): void {
    if (!this.currentImage) return;

    this.ui.showLoading();
    this.ui.disableReanalyzeButton();

    setTimeout(() => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.currentImage!.width;
      tempCanvas.height = this.currentImage!.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(this.currentImage!, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      const result = this.analyzer.analyze(imageData);
      const thumbnail = this.ui.generateThumbnail(this.currentImage!);
      result.thumbnail = thumbnail;

      // 分析结果已保存到历史记录
      this.ui.renderSpots(result.spots);
      this.ui.renderReport(result);
      this.ui.hideLoading();
      this.ui.enableReanalyzeButton();

      const historyItem: HistoryItem = {
        ...result,
        id: this.generateId()
      };
      this.history.push(historyItem);
      // 历史记录ID用于UI高亮
      this.ui.addToHistory(historyItem);
      this.ui.setActiveHistoryItem(historyItem.id);

      this.bindReanalyzeButton();
    }, 800);
  }

  private bindReanalyzeButton(): void {
    const btn = this.ui.getReanalyzeButton();
    if (btn) {
      btn.onclick = () => this.handleReanalyze();
    }
  }

  private handleReanalyze(): void {
    if (!this.currentImage) return;
    this.performAnalysis();
  }

  private handleHistoryClick(id: string): void {
    const item = this.history.find(h => h.id === id);
    if (!item || !this.currentImage) return;

    // 恢复历史分析状态

    this.ui.renderImage(this.currentImage);
    this.ui.renderSpots(item.spots);
    this.ui.renderReport(item);
    this.ui.setActiveHistoryItem(id);
    this.bindReanalyzeButton();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
