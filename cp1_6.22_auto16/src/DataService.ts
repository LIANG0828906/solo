import type { Template, ReportData, FeedbackRecord, Dimension, WeightMultipliers } from './types';

const API_BASE = '/api/templates';

class DataService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getAllTemplates(): Promise<Template[]> {
    return this.request<Template[]>(API_BASE);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.request<Template>(`${API_BASE}/${id}`);
  }

  async createTemplate(name: string, dimensions: Omit<Dimension, 'id'>[]): Promise<Template> {
    return this.request<Template>(API_BASE, {
      method: 'POST',
      body: JSON.stringify({ name, dimensions }),
    });
  }

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  }

  async submitFeedback(templateId: string, scores: Record<string, number>): Promise<FeedbackRecord> {
    return this.request<FeedbackRecord>(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ templateId, scores }),
    });
  }

  async getReport(templateId: string): Promise<ReportData> {
    return this.request<ReportData>(`${API_BASE}/${templateId}/result`);
  }

  async getHistoryReports(templateId: string): Promise<ReportData[]> {
    return this.request<ReportData[]>(`${API_BASE}/${templateId}/history`);
  }

  async saveReportToHistory(templateId: string): Promise<ReportData> {
    return this.request<ReportData>(`${API_BASE}/${templateId}/save-report`, {
      method: 'POST',
    });
  }

  calculateWeightedScores(
    averages: Record<string, number>,
    dimensions: Dimension[],
    multipliers: WeightMultipliers
  ): Record<string, number> {
    const result: Record<string, number> = {};

    dimensions.forEach(dim => {
      const baseWeight = dim.weight;
      const multiplier = multipliers[dim.id] ?? 1;
      const avg = averages[dim.id] ?? 0;
      result[dim.id] = Number((avg * baseWeight * multiplier / 5).toFixed(2));
    });

    return result;
  }

  calculateChartData(
    report: ReportData,
    weightMultipliers: WeightMultipliers,
    useWeighted: boolean = true
  ): { labels: string[]; data: number[] } {
    const labels = report.dimensions.map((d: Dimension) => d.name);
    let data: number[];

    if (useWeighted) {
      const weighted = this.calculateWeightedScores(
        report.averages,
        report.dimensions,
        weightMultipliers
      );
      data = report.dimensions.map((d: Dimension) => weighted[d.id] || 0);
    } else {
      data = report.dimensions.map((d: Dimension) => report.averages[d.id] || 0);
    }

    return { labels, data };
  }

  calculateDiff(current: ReportData, history: ReportData): Record<string, number> {
    const diff: Record<string, number> = {};
    history.dimensions.forEach((dim: Dimension) => {
      const currentAvg = current.averages[dim.id] ?? 0;
      const historyAvg = history.averages[dim.id] ?? 0;
      diff[dim.id] = Number((currentAvg - historyAvg).toFixed(2));
    });
    return diff;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getSubmittedKey(templateId: string): string {
    return `feedback_submitted_${templateId}`;
  }

  hasSubmitted(templateId: string): boolean {
    const key = this.getSubmittedKey(templateId);
    return localStorage.getItem(key) !== null;
  }

  markSubmitted(templateId: string): void {
    const key = this.getSubmittedKey(templateId);
    localStorage.setItem(key, Date.now().toString());
  }
}

export const dataService = new DataService();
