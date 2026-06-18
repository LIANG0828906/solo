export class UI {
  private uploadContainer: HTMLDivElement;
  private dropZone: HTMLDivElement;
  private fileInput: HTMLInputElement;
  private thumbnailImg: HTMLImageElement | null = null;
  private generateBtn: HTMLButtonElement | null = null;
  private controlsContainer: HTMLDivElement;
  private gridToggle: HTMLInputElement;
  private resetBtn: HTMLButtonElement;
  private infoCard: HTMLDivElement | null = null;
  private imageCallback: ((img: HTMLImageElement) => void) | null = null;
  private resetCallback: (() => void) | null = null;
  private gridCallback: ((visible: boolean) => void) | null = null;

  constructor() {
    this.uploadContainer = this.createUploadArea();
    this.dropZone = this.uploadContainer.querySelector('.drop-zone')!;
    this.fileInput = this.uploadContainer.querySelector('input[type="file"]')!;
    this.controlsContainer = this.createGridControl();
    this.gridToggle = this.controlsContainer.querySelector('#grid-toggle')!;
    this.resetBtn = this.createResetButton();
    this.setupDropZone();
    this.setupControls();
  }

  private createUploadArea(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'upload-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    `;

    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.style.cssText = `
      width: 400px;
      height: 300px;
      border: 2px dashed #6366F1;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      background: rgba(255,255,255,0.9);
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 48px;
      color: #6366F1;
      margin-bottom: 12px;
    `;
    icon.innerHTML = '🏙️';

    const text = document.createElement('div');
    text.style.cssText = `
      color: #1E293B;
      font-size: 16px;
      font-weight: 500;
    `;
    text.textContent = '拖拽街景照片到此处';

    const subtext = document.createElement('div');
    subtext.style.cssText = `
      color: #64748B;
      font-size: 13px;
      margin-top: 8px;
    `;
    subtext.textContent = '或点击选择文件';

    dropZone.appendChild(icon);
    dropZone.appendChild(text);
    dropZone.appendChild(subtext);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    container.appendChild(dropZone);
    container.appendChild(fileInput);
    document.body.appendChild(container);

    return container;
  }

  private setupDropZone() {
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.style.background = '#EEF2FF';
      this.dropZone.style.borderColor = '#8B5CF6';
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.style.background = 'rgba(255,255,255,0.9)';
      this.dropZone.style.borderColor = '#6366F1';
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.style.background = 'rgba(255,255,255,0.9)';
      this.dropZone.style.borderColor = '#6366F1';
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleFile(file);
      }
    });

    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];
      if (file) this.handleFile(file);
    });
  }

  private handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.showThumbnail(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  private showThumbnail(dataUrl: string) {
    if (this.thumbnailImg) this.thumbnailImg.remove();
    if (this.generateBtn) this.generateBtn.remove();

    const oldContent = this.dropZone.querySelectorAll(':scope > *');
    oldContent.forEach((el) => {
      if (el !== this.fileInput && !el.classList.contains('thumbnail-area')) {
        el.style.display = 'none';
      }
    });

    this.dropZone.style.borderColor = '#6366F1';
    this.dropZone.style.background = 'rgba(255,255,255,0.95)';
    this.dropZone.style.padding = '16px';

    const thumbArea = document.createElement('div');
    thumbArea.className = 'thumbnail-area';
    thumbArea.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    `;

    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.cssText = `
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      object-fit: contain;
    `;
    this.thumbnailImg = img;

    const btn = document.createElement('button');
    btn.textContent = '生成模型';
    btn.style.cssText = `
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 28px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(2px)';
      btn.style.boxShadow = '0 2px 6px rgba(99, 102, 241, 0.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const imageEl = new Image();
      imageEl.onload = () => {
        if (this.imageCallback) this.imageCallback(imageEl);
      };
      imageEl.src = dataUrl;
    });
    this.generateBtn = btn;

    thumbArea.appendChild(img);
    thumbArea.appendChild(btn);
    this.dropZone.appendChild(thumbArea);
  }

  private createGridControl(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'controls-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 200;
      display: none;
    `;

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      padding: 8px 14px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    `;

    const label = document.createElement('span');
    label.textContent = '网格';
    label.style.cssText = `
      color: #1E293B;
      font-size: 13px;
      font-weight: 500;
      user-select: none;
    `;

    const toggle = document.createElement('label');
    toggle.style.cssText = `
      position: relative;
      width: 44px;
      height: 24px;
      cursor: pointer;
      flex-shrink: 0;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'grid-toggle';
    checkbox.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;

    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      inset: 0;
      background: #CBD5E1;
      border-radius: 12px;
      transition: background 0.2s ease;
    `;

    const knob = document.createElement('span');
    knob.style.cssText = `
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
    `;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        slider.style.background = '#7C3AED';
        knob.style.transform = 'translateX(20px)';
      } else {
        slider.style.background = '#CBD5E1';
        knob.style.transform = 'translateX(0)';
      }
      if (this.gridCallback) this.gridCallback(checkbox.checked);
    });

    slider.appendChild(knob);
    toggle.appendChild(checkbox);
    toggle.appendChild(slider);
    this.gridToggle = checkbox;

    row.appendChild(label);
    row.appendChild(toggle);
    container.appendChild(row);
    document.body.appendChild(container);

    return container;
  }

  private createResetButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.id = 'reset-view-btn';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    `;
    btn.title = '复位视角';
    btn.style.cssText = `
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 200;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      color: #7C3AED;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#EEF2FF';
      btn.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.2)';
      btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.95)';
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      btn.style.transform = 'scale(1)';
    });
    document.body.appendChild(btn);
    return btn;
  }

  private setupControls() {
    this.resetBtn.addEventListener('click', () => {
      if (this.resetCallback) this.resetCallback();
    });
  }

  onImageUploaded(cb: (img: HTMLImageElement) => void) {
    this.imageCallback = cb;
  }

  onResetView(cb: () => void) {
    this.resetCallback = cb;
  }

  onToggleGrid(cb: (visible: boolean) => void) {
    this.gridCallback = cb;
  }

  hideUploadArea() {
    this.uploadContainer.style.display = 'none';
    this.controlsContainer.style.display = 'block';
    this.resetBtn.style.display = 'flex';
  }

  showInfoCard(buildingId: number, height: number, screenPos: { x: number; y: number }) {
    this.removeInfoCard();

    const card = document.createElement('div');
    card.style.cssText = `
      position: fixed;
      z-index: 300;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      padding: 20px 24px;
      min-width: 180px;
      color: #1F2937;
      animation: fadeInCard 0.3s ease-out;
    `;

    let left = screenPos.x + 16;
    let top = screenPos.y - 40;
    if (left + 200 > window.innerWidth) left = screenPos.x - 200;
    if (top + 120 > window.innerHeight) top = screenPos.y - 120;
    if (top < 10) top = 10;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: white;
      color: #64748B;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    `;
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#F1F5F9';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'white';
    });
    closeBtn.addEventListener('click', () => this.removeInfoCard());

    const idLine = document.createElement('div');
    idLine.style.cssText = `
      font-size: 13px;
      color: #7C3AED;
      font-weight: 600;
      margin-bottom: 8px;
    `;
    idLine.textContent = `建筑 #${buildingId + 1}`;

    const heightLine = document.createElement('div');
    heightLine.style.cssText = `
      font-size: 20px;
      font-weight: 700;
      color: #1F2937;
    `;
    heightLine.textContent = `${(height * 5).toFixed(1)} m`;

    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 12px;
      color: #64748B;
      margin-top: 2px;
    `;
    label.textContent = '估算高度';

    card.appendChild(closeBtn);
    card.appendChild(idLine);
    card.appendChild(heightLine);
    card.appendChild(label);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInCard {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    card.appendChild(style);

    document.body.appendChild(card);
    this.infoCard = card;
  }

  private removeInfoCard() {
    if (this.infoCard) {
      const card = this.infoCard;
      card.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-6px)';
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 200);
      this.infoCard = null;
    }
  }
}
