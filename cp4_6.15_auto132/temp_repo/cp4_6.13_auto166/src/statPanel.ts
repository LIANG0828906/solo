import type { CommitRecord } from './dataParser';

const AUTHOR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface AuthorStats {
  author: string;
  color: string;
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  totalLinesChanged: number;
  activeDays: number;
}

export class StatPanel {
  private container: HTMLElement;
  private records: CommitRecord[] = [];
  private authorMap: Map<string, number> = new Map();
  private onFilterChange: ((branch: string | null) => void) | null = null;
  private activeFilter: string | null = null;
  private heatmapTooltip: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setFilterCallback(cb: (branch: string | null) => void) {
    this.onFilterChange = cb;
  }

  setData(records: CommitRecord[], authorMap: Map<string, number>) {
    this.records = records;
    this.authorMap = authorMap;
    this.activeFilter = null;
    this.render();
  }

  private computeStats(): AuthorStats[] {
    const statsMap = new Map<string, AuthorStats>();
    for (const r of this.records) {
      if (!statsMap.has(r.author)) {
        statsMap.set(r.author, {
          author: r.author,
          color: AUTHOR_COLORS[this.authorMap.get(r.author) ?? 0],
          totalCommits: 0,
          totalLinesAdded: 0,
          totalLinesDeleted: 0,
          totalLinesChanged: 0,
          activeDays: 0,
        });
      }
      const stats = statsMap.get(r.author)!;
      stats.totalCommits++;
      stats.totalLinesAdded += r.linesAdded;
      stats.totalLinesDeleted += r.linesDeleted;
      stats.totalLinesChanged += r.linesAdded + r.linesDeleted;
    }

    const daySetByAuthor = new Map<string, Set<string>>();
    for (const r of this.records) {
      const dayKey = new Date(r.timestamp).toISOString().slice(0, 10);
      if (!daySetByAuthor.has(r.author)) daySetByAuthor.set(r.author, new Set());
      daySetByAuthor.get(r.author)!.add(dayKey);
    }
    for (const [author, days] of daySetByAuthor) {
      const stats = statsMap.get(author);
      if (stats) stats.activeDays = days.size;
    }

    return Array.from(statsMap.values()).sort((a, b) => b.totalLinesChanged - a.totalLinesChanged);
  }

  private computeWeeklyChange(): { percent: number; direction: 'up' | 'down' } {
    const now = Date.now();
    const weekMs = 604800000;
    const thisWeek = this.records.filter(r => r.timestamp > now - weekMs).length;
    const lastWeek = this.records.filter(r => r.timestamp > now - 2 * weekMs && r.timestamp <= now - weekMs).length;
    if (lastWeek === 0) return { percent: thisWeek > 0 ? 100 : 0, direction: thisWeek > 0 ? 'up' : 'down' };
    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    return { percent: Math.abs(Math.round(change)), direction: change >= 0 ? 'up' : 'down' };
  }

  private computeHeatmap(): { date: string; count: number }[][] {
    const now = new Date();
    const rows = 7;
    const cols = 30;
    const result: { date: string; count: number }[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowData: { date: string; count: number }[] = [];
      for (let col = 0; col < cols; col++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (cols - 1 - col) * 1);
        const dayOfWeek = (row + 1) % 7;
        const targetDate = new Date(d);
        const currentDayOfWeek = targetDate.getDay();
        const diff = dayOfWeek - currentDayOfWeek;
        targetDate.setDate(targetDate.getDate() + diff);

        const dateStr = targetDate.toISOString().slice(0, 10);
        const count = this.records.filter(r => {
          const rd = new Date(r.timestamp).toISOString().slice(0, 10);
          return rd === dateStr;
        }).length;
        rowData.push({ date: dateStr, count });
      }
      result.push(rowData);
    }
    return result;
  }

  private getHeatmapColor(count: number, maxCount: number): string {
    if (count === 0) return '#f1f5f9';
    const ratio = count / Math.max(maxCount, 1);
    const r1 = 219, g1 = 234, b1 = 254;
    const r2 = 37, g2 = 99, b2 = 235;
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `rgb(${r},${g},${b})`;
  }

  private render() {
    const stats = this.computeStats();
    const weekly = this.computeWeeklyChange();
    const heatmap = this.computeHeatmap();
    const branches = [...new Set(this.records.map(r => r.branch))];

    let maxHeatCount = 0;
    for (const row of heatmap) {
      for (const cell of row) {
        if (cell.count > maxHeatCount) maxHeatCount = cell.count;
      }
    }

    this.container.innerHTML = '';

    const overviewSection = document.createElement('div');
    overviewSection.className = 'stat-section';
    overviewSection.innerHTML = `
      <div class="stat-section-title">总览</div>
      <div class="overview-card">
        <div class="overview-count">${this.records.length}</div>
        <div class="overview-label">总提交数</div>
        <div class="overview-change ${weekly.direction}">
          ${weekly.direction === 'up' ? '↑' : '↓'} ${weekly.percent}%
          <span style="color:#94a3b8;margin-left:4px">较上周</span>
        </div>
      </div>
    `;
    this.container.appendChild(overviewSection);

    const authorSection = document.createElement('div');
    authorSection.className = 'stat-section';
    let authorHTML = '<div class="stat-section-title">作者贡献排行</div>';
    for (const s of stats) {
      const initial = s.author.charAt(0).toUpperCase();
      authorHTML += `
        <div class="author-item">
          <div class="author-avatar" style="background:${s.color}">${initial}</div>
          <div class="author-info">
            <div class="author-name">${s.author}</div>
          </div>
          <div class="author-badge">${s.totalCommits} 次</div>
        </div>
      `;
    }
    authorSection.innerHTML = authorHTML;
    this.container.appendChild(authorSection);

    const heatmapSection = document.createElement('div');
    heatmapSection.className = 'stat-section';
    heatmapSection.innerHTML = '<div class="stat-section-title">近 30 天热力图</div>';
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'heatmap-container';

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.gridTemplateRows = `repeat(7, 5px)`;
    grid.style.gridTemplateColumns = `repeat(30, 5px)`;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 30; col++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const data = heatmap[row][col];
        cell.style.background = this.getHeatmapColor(data.count, maxHeatCount);
        cell.dataset.date = data.date;
        cell.dataset.count = String(data.count);
        cell.addEventListener('mouseenter', (e: MouseEvent) => {
          this.showHeatmapTooltip(e.target as HTMLElement, data.date, data.count);
        });
        cell.addEventListener('mouseleave', () => {
          this.hideHeatmapTooltip();
        });
        grid.appendChild(cell);
      }
    }

    heatmapContainer.appendChild(grid);
    heatmapSection.appendChild(heatmapContainer);
    this.container.appendChild(heatmapSection);

    const filterSection = document.createElement('div');
    filterSection.className = 'stat-section';
    let filterHTML = '<div class="stat-section-title">分支筛选</div><div>';
    filterHTML += `<button class="filter-btn ${this.activeFilter === null ? 'active' : ''}" data-branch="">全部</button>`;
    for (const branch of branches) {
      filterHTML += `<button class="filter-btn ${this.activeFilter === branch ? 'active' : ''}" data-branch="${branch}">${branch}</button>`;
    }
    filterHTML += '</div>';
    filterSection.innerHTML = filterHTML;

    filterSection.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const branch = (btn as HTMLElement).dataset.branch;
        this.activeFilter = branch || null;
        filterSection.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.onFilterChange) this.onFilterChange(this.activeFilter);
      });
    });

    this.container.appendChild(filterSection);
  }

  private showHeatmapTooltip(target: HTMLElement, date: string, count: number) {
    this.hideHeatmapTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-tooltip';
    tooltip.textContent = `${date}  ${count} 次提交`;
    const rect = target.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    tooltip.style.left = (rect.left - containerRect.left) + 'px';
    tooltip.style.top = (rect.top - containerRect.top - 28) + 'px';
    this.container.style.position = 'relative';
    this.container.appendChild(tooltip);
    this.heatmapTooltip = tooltip;
  }

  private hideHeatmapTooltip() {
    if (this.heatmapTooltip) {
      this.heatmapTooltip.remove();
      this.heatmapTooltip = null;
    }
  }
}
