import { ShoeConfigurator } from './shoeConfigurator';
import { ShoeConfig, PartName, MaterialType, DEFAULT_CONFIG, MATERIAL_LABELS, PART_LABELS } from './types';

export class UIController {
  private configurator: ShoeConfigurator;
  private config: ShoeConfig;
  private drawerOpen: boolean = false;

  constructor(configurator: ShoeConfigurator) {
    this.configurator = configurator;
    this.config = { ...DEFAULT_CONFIG };
  }

  init(): void {
    this.bindShoeSelector();
    this.bindColorPickers();
    this.bindMaterialSelects();
    this.bindDecalUpload();
    this.bindShareButton();
    this.bindDrawerToggle();

    this.configurator.addConfigChangeListener((newConfig) => {
      this.config = { ...newConfig };
      this.updateSummaryCard();
    });

    this.syncUIWithConfig();
    this.updateSummaryCard();
  }

  private syncUIWithConfig(): void {
    const parts: PartName[] = ['upper', 'sole', 'lace', 'logo'];
    parts.forEach((part) => {
      const colorKey = `${part}Color` as keyof ShoeConfig;
      const materialKey = `${part}Material` as keyof ShoeConfig;

      const colorInput = document.getElementById(`color-${part}`) as HTMLInputElement | null;
      if (colorInput) {
        colorInput.value = this.config[colorKey] as string;
      }
      const hexSpan = document.getElementById(`hex-${part}`);
      if (hexSpan) {
        hexSpan.textContent = this.config[colorKey] as string;
      }

      const materialSelect = document.getElementById(`material-${part}`) as HTMLSelectElement | null;
      if (materialSelect) {
        materialSelect.value = this.config[materialKey] as string;
      }
    });

    const cards = document.querySelectorAll('.shoe-card');
    cards.forEach((card) => {
      const id = parseInt((card as HTMLElement).dataset.shoe || '0', 10);
      if (id === this.config.shoeModel) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  private bindShoeSelector(): void {
    const cards = document.querySelectorAll('.shoe-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const shoeId = parseInt((card as HTMLElement).dataset.shoe || '0', 10);

        cards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');

        this.config.shoeModel = shoeId;
        this.configurator.switchShoeModel(shoeId);
        this.reapplyConfig();
      });
    });
  }

  private reapplyConfig(): void {
    const parts: PartName[] = ['upper', 'sole', 'lace', 'logo'];
    parts.forEach((part) => {
      const colorKey = `${part}Color` as keyof ShoeConfig;
      const materialKey = `${part}Material` as keyof ShoeConfig;
      this.configurator.updateColor(part, this.config[colorKey] as string);
      this.configurator.updateMaterial(part, this.config[materialKey] as MaterialType);
    });

    if (this.config.decalImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.config.decalImage;
      img.onload = () => {
        this.configurator.updateTexture(img);
      };
    }
  }

  private bindColorPickers(): void {
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach((input) => {
      const el = input as HTMLInputElement;
      const part = el.dataset.part as PartName;

      el.addEventListener('input', () => {
        const color = el.value;
        const colorKey = `${part}Color` as keyof ShoeConfig;
        (this.config as any)[colorKey] = color;

        const hexSpan = document.getElementById(`hex-${part}`);
        if (hexSpan) hexSpan.textContent = color;

        this.configurator.updateColor(part, color);
      });
    });
  }

  private bindMaterialSelects(): void {
    const selects = document.querySelectorAll('.material-select');
    selects.forEach((select) => {
      const el = select as HTMLSelectElement;
      const part = el.dataset.part as PartName;

      el.addEventListener('change', () => {
        const materialType = el.value as MaterialType;
        const materialKey = `${part}Material` as keyof ShoeConfig;
        (this.config as any)[materialKey] = materialType;

        this.configurator.updateMaterial(part, materialType);
      });
    });
  }

  private bindDecalUpload(): void {
    const fileInput = document.getElementById('decal-input') as HTMLInputElement;
    const preview = document.getElementById('decal-preview') as HTMLElement;
    const previewImg = document.getElementById('decal-preview-img') as HTMLImageElement;
    const removeBtn = document.getElementById('decal-remove') as HTMLElement;

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          previewImg.src = dataUrl;
          preview.classList.add('visible');

          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            this.configurator.updateTexture(img);
            this.config.decalImage = dataUrl;
          };
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.configurator.removeTexture();
        this.config.decalImage = null;
        preview.classList.remove('visible');
        if (fileInput) fileInput.value = '';
      });
    }
  }

  private bindShareButton(): void {
    const btn = document.getElementById('btn-share');
    if (btn) {
      btn.addEventListener('click', () => {
        this.configurator.captureScreenshot();
      });
    }
  }

  private bindDrawerToggle(): void {
    const toggle = document.getElementById('drawer-toggle');
    const panel = document.getElementById('control-panel');

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        this.drawerOpen = !this.drawerOpen;
        panel.classList.toggle('open', this.drawerOpen);
        toggle.textContent = this.drawerOpen ? '✕ 关闭面板' : '自定义配置';

        const handle = document.createElement('div');
        handle.className = 'drawer-handle';
        toggle.insertBefore(handle, toggle.firstChild);
      });
    }
  }

  updateSummaryCard(): void {
    const grid = document.getElementById('summary-grid');
    const card = document.getElementById('summary-card');
    if (!grid || !card) return;

    grid.innerHTML = '';

    const parts: PartName[] = ['upper', 'sole', 'lace', 'logo'];
    parts.forEach((part) => {
      const colorKey = `${part}Color` as keyof ShoeConfig;
      const materialKey = `${part}Material` as keyof ShoeConfig;
      const color = this.config[colorKey] as string;
      const material = this.config[materialKey] as MaterialType;

      const label = document.createElement('span');
      label.className = 'sg-label';
      label.textContent = PART_LABELS[part];

      const value = document.createElement('span');
      value.className = 'sg-value';

      const swatch = document.createElement('span');
      swatch.className = 'sg-swatch';
      swatch.style.backgroundColor = color;

      const text = document.createElement('span');
      text.textContent = MATERIAL_LABELS[material];

      value.appendChild(swatch);
      value.appendChild(text);
      grid.appendChild(label);
      grid.appendChild(value);
    });

    if (this.config.decalImage) {
      const label = document.createElement('span');
      label.className = 'sg-label';
      label.textContent = '贴花';

      const value = document.createElement('span');
      value.className = 'sg-value';
      value.textContent = '已应用';

      grid.appendChild(label);
      grid.appendChild(value);
    }

    const primaryColor = this.config.upperColor;
    const r = parseInt(primaryColor.slice(1, 3), 16);
    const g = parseInt(primaryColor.slice(3, 5), 16);
    const b = parseInt(primaryColor.slice(5, 7), 16);
    card.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.18)`;
    card.style.boxShadow = `0 0 36px rgba(${r}, ${g}, ${b}, 0.18), inset 0 0 24px rgba(${r}, ${g}, ${b}, 0.05), 0 8px 32px rgba(0,0,0,0.35)`;
    card.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    card.style.transition = 'background-color 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s cubic-bezier(0.4,0,0.2,1), border-color 0.5s cubic-bezier(0.4,0,0.2,1)';
  }

  dispose(): void {}
}
