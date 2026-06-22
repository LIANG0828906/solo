import { StarOfficial, StarField } from './StarField';

export class InteractivePanel {
  private starField: StarField;
  private searchInput: HTMLInputElement;
  private searchResults: HTMLDivElement;
  private infoPanel: HTMLDivElement;
  private starNameEl: HTMLDivElement;
  private constellationNameEl: HTMLDivElement;
  private starDescriptionEl: HTMLDivElement;
  private starCountEl: HTMLDivElement;
  private panelCloseBtn: HTMLButtonElement;
  private currentOfficial: StarOfficial | null = null;
  private onSelectCallback: ((official: StarOfficial) => void) | null = null;

  constructor(starField: StarField) {
    this.starField = starField;

    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.searchResults = document.getElementById('search-results') as HTMLDivElement;
    this.infoPanel = document.getElementById('info-panel') as HTMLDivElement;
    this.starNameEl = document.getElementById('star-name') as HTMLDivElement;
    this.constellationNameEl = document.getElementById('constellation-name') as HTMLDivElement;
    this.starDescriptionEl = document.getElementById('star-description') as HTMLDivElement;
    this.starCountEl = document.getElementById('star-count') as HTMLDivElement;
    this.panelCloseBtn = document.getElementById('panel-close') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('focus', () => this.handleSearch());

    this.panelCloseBtn.addEventListener('click', () => this.hidePanel());

    document.addEventListener('click', (e) => {
      if (!this.searchResults.contains(e.target as Node) && e.target !== this.searchInput) {
        this.searchResults.classList.remove('visible');
      }
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.searchResults.classList.remove('visible');
        this.searchInput.blur();
      }
    });
  }

  private handleSearch(): void {
    const query = this.searchInput.value;
    const results = this.starField.searchStarOfficials(query);

    if (results.length > 0 && query.trim()) {
      this.renderSearchResults(results);
      this.searchResults.classList.add('visible');
    } else {
      this.searchResults.classList.remove('visible');
    }
  }

  private renderSearchResults(results: StarOfficial[]): void {
    this.searchResults.innerHTML = '';

    results.forEach(official => {
      const item = document.createElement('div');
      item.className = 'search-item';

      const name = document.createElement('div');
      name.className = 'search-item-name';
      name.textContent = `${official.data.name}（${official.data.pinyin} · ${official.data.englishName}）`;

      const sub = document.createElement('div');
      sub.className = 'search-item-sub';
      sub.textContent = official.data.constellation;

      item.appendChild(name);
      item.appendChild(sub);

      item.addEventListener('click', () => {
        this.searchResults.classList.remove('visible');
        this.searchInput.value = official.data.name;
        if (this.onSelectCallback) {
          this.onSelectCallback(official);
        }
      });

      this.searchResults.appendChild(item);
    });
  }

  public showPanel(official: StarOfficial): void {
    this.currentOfficial = official;
    this.starNameEl.textContent = official.data.name;
    this.constellationNameEl.textContent = official.data.constellation;
    this.starDescriptionEl.textContent = official.data.description;
    this.starCountEl.textContent = `包含恒星 ${official.data.stars.length} 颗`;

    this.infoPanel.classList.remove('hiding');
    requestAnimationFrame(() => {
      this.infoPanel.classList.add('visible');
    });
  }

  public hidePanel(): void {
    this.currentOfficial = null;
    this.infoPanel.classList.add('hiding');
    this.infoPanel.classList.remove('visible');
    this.starField.highlightStarOfficial(null);
  }

  public onSelect(callback: (official: StarOfficial) => void): void {
    this.onSelectCallback = callback;
  }

  public getCurrentOfficial(): StarOfficial | null {
    return this.currentOfficial;
  }
}
