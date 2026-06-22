export interface FiringReport {
  maxTemperature: number;
  holdDuration: number;
  glazeTypes: string[];
  crackDensity: number;
  totalTime: number;
  coolingRate: number;
}

export class DataExporter {
  private report: FiringReport;

  constructor() {
    this.report = {
      maxTemperature: 0,
      holdDuration: 0,
      glazeTypes: [],
      crackDensity: 0,
      totalTime: 0,
      coolingRate: 0
    };
  }

  public updateMaxTemp(temp: number): void {
    if (temp > this.report.maxTemperature) {
      this.report.maxTemperature = Math.round(temp);
    }
  }

  public addHoldTime(delta: number): void {
    this.report.holdDuration += delta;
  }

  public setGlazeTypes(glazes: string[]): void {
    this.report.glazeTypes = [...glazes];
  }

  public setCrackDensity(density: number): void {
    this.report.crackDensity = Math.round(density * 100) / 100;
  }

  public setTotalTime(time: number): void {
    this.report.totalTime = Math.round(time * 10) / 10;
  }

  public setCoolingRate(rate: number): void {
    this.report.coolingRate = Math.round(rate * 10) / 10;
  }

  public getReport(): FiringReport {
    return { ...this.report };
  }

  public exportJSON(): string {
    return JSON.stringify(this.report, null, 2);
  }

  public downloadReport(): void {
    const jsonStr = this.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sancai-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public reset(): void {
    this.report = {
      maxTemperature: 0,
      holdDuration: 0,
      glazeTypes: [],
      crackDensity: 0,
      totalTime: 0,
      coolingRate: 0
    };
  }
}
