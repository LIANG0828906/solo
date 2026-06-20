import { parseJSONString, type CommitRecord } from './dataParser';
import { Renderer, type NodeInfo } from './renderer';
import { StatPanel } from './statPanel';

const STORAGE_KEY = 'gitcommitflow_data';

class App {
  private renderer!: Renderer;
  private statPanel!: StatPanel;
  private records: CommitRecord[] = [];
  private hoverCard: HTMLElement;
  private detailPanel: HTMLElement;
  private uploadOverlay: HTMLElement;

  constructor() {
    this.hoverCard = document.getElementById('hoverCard')!;
    this.detailPanel = document.getElementById('detailPanel')!;
    this.uploadOverlay = document.getElementById('uploadOverlay')!;

    this.init();
  }

  private init() {
    const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    const sidebar = document.getElementById('sidebar')!;

    this.renderer = new Renderer(canvas);
    this.statPanel = new StatPanel(sidebar);

    this.renderer.setCallbacks(
      (node: NodeInfo) => this.handleNodeClick(node),
      (node: NodeInfo | null, x: number, y: number) => this.handleNodeHover(node, x, y)
    );

    this.statPanel.setFilterCallback((branch: string | null) => {
      this.renderer.filterByBranch(branch);
    });

    this.setupUpload();
    this.setupResize();
    this.setupCopySha();

    this.loadFromStorage();
  }

  private setupUpload() {
    const zone = document.getElementById('uploadZone')!;
    const input = document.getElementById('uploadInput') as HTMLInputElement;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer?.files[0];
      if (file) this.handleFile(file);
    });

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) this.handleFile(file);
      input.value = '';
    });
  }

  private handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseJSONString(reader.result as string);
      if (!result.success || !result.data) {
        this.showAlert(result.error || '数据格式错误，请检查字段');
        return;
      }
      this.records = result.data;
      this.saveToStorage();
      this.renderData();
    };
    reader.readAsText(file);
  }

  private showAlert(message: string) {
    const existing = document.querySelector('.alert-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.className = 'alert-bar';
    bar.innerHTML = `<span>${message}</span><button class="close-btn">&times;</button>`;
    document.body.appendChild(bar);

    const closeBtn = bar.querySelector('.close-btn')!;
    const dismiss = () => bar.remove();
    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 3000);
  }

  private renderData() {
    this.uploadOverlay.classList.add('hidden');
    this.renderer.setData(this.records);
    this.statPanel.setData(this.records, this.renderer.getAuthorMap());

    const navCount = document.getElementById('nav-count')!;
    const navTime = document.getElementById('nav-time')!;
    navCount.textContent = `${this.records.length} 条记录`;
    navTime.textContent = `更新于 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private handleNodeHover(node: NodeInfo | null, screenX: number, screenY: number) {
    if (!node) {
      this.hoverCard.style.display = 'none';
      return;
    }

    const r = node.record;
    const date = new Date(r.timestamp);
    const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const msgPreview = r.message.length > 30 ? r.message.slice(0, 30) + '…' : r.message;

    this.hoverCard.innerHTML = `
      <div class="hover-card-time">${timeStr}</div>
      <div class="hover-card-author" style="color:${node.color}">${r.author}</div>
      <div class="hover-card-lines">
        <span class="added">+${r.linesAdded}</span>&nbsp;
        <span class="deleted">-${r.linesDeleted}</span>
      </div>
      <div class="hover-card-msg">${msgPreview}</div>
    `;

    const area = document.getElementById('canvasArea')!;
    const areaRect = area.getBoundingClientRect();
    let left = screenX + 15;
    let top = screenY - 30;

    if (left + 240 > areaRect.width) {
      left = screenX - 255;
    }
    if (top < 10) top = 10;

    this.hoverCard.style.display = 'block';
    this.hoverCard.style.left = left + 'px';
    this.hoverCard.style.top = top + 'px';
  }

  private handleNodeClick(node: NodeInfo) {
    const r = node.record;
    const detailMessage = document.getElementById('detailMessage')!;
    const detailFiles = document.getElementById('detailFiles')!;
    const detailSha = document.getElementById('detailSha')!;

    detailMessage.textContent = r.message;

    detailFiles.innerHTML = '';
    const files = r.files || [];
    for (const file of files) {
      const ext = file.split('.').pop()?.toLowerCase() || '';
      let icon = '📄';
      if (['ts', 'js'].includes(ext)) icon = '📜';
      else if (['css', 'scss', 'less'].includes(ext)) icon = '🎨';
      else if (['html', 'svg'].includes(ext)) icon = '🖼️';
      else if (['json', 'yaml', 'yml', 'toml'].includes(ext)) icon = '⚙️';
      else if (['md', 'txt'].includes(ext)) icon = '📝';
      else if (['py'].includes(ext)) icon = '🐍';
      else if (['rs'].includes(ext)) icon = '🦀';
      else if (['go'].includes(ext)) icon = '🔷';
      const el = document.createElement('span');
      el.className = 'detail-file';
      el.innerHTML = `<span class="detail-file-icon">${icon}</span>${file}`;
      detailFiles.appendChild(el);
    }

    detailSha.textContent = r.sha;
    this.detailPanel.classList.add('open');
  }

  private setupCopySha() {
    const btn = document.getElementById('copyShaBtn')!;
    btn.addEventListener('click', async () => {
      const shaText = document.getElementById('detailSha')!.textContent || '';
      try {
        await navigator.clipboard.writeText(shaText);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = shaText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      btn.textContent = '已复制 ✓';
      btn.classList.add('copied');

      btn.classList.remove('shake-anim');
      void btn.offsetWidth;
      btn.classList.add('shake-anim');

      setTimeout(() => {
        btn.textContent = '复制 SHA';
        btn.classList.remove('copied');
        btn.classList.remove('shake-anim');
      }, 1500);
    });
  }

  private setupResize() {
    let resizeTimer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderer.resizeCanvas();
      }, 100);
    });
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch { /* quota exceeded */ }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const result = parseJSONString(raw);
          if (result.success && result.data) {
            this.records = result.data;
            this.renderData();
          }
        }
      }
    } catch { /* ignore */ }
  }
}

new App();
