import { EarthquakeRecord, earthquakeData } from '../data';

export class DataLoader {
  private records: EarthquakeRecord[];

  constructor() {
    this.records = [...earthquakeData];
  }

  loadAll(): EarthquakeRecord[] {
    return [...this.records];
  }

  filterByMagnitude(min: number, max: number): EarthquakeRecord[] {
    return this.records.filter(
      (r) => r.magnitude >= min && r.magnitude < max
    );
  }

  filterByDepth(min: number, max: number): EarthquakeRecord[] {
    return this.records.filter(
      (r) => r.depth >= min && r.depth < max
    );
  }

  getLatest(): EarthquakeRecord | null {
    if (this.records.length === 0) return null;
    const sorted = [...this.records].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    return sorted[0];
  }

  getMagnitudeStats(): { range: string; count: number }[] {
    return [
      { range: '0-3', count: this.filterByMagnitude(0, 3).length },
      { range: '3-5', count: this.filterByMagnitude(3, 5).length },
      { range: '5-7', count: this.filterByMagnitude(5, 7).length },
      { range: '7+', count: this.filterByMagnitude(7, 10).length },
    ];
  }
}
