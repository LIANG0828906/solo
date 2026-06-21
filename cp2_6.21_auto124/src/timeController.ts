export interface ColorTone {
  skyTop: string;
  skyBottom: string;
  grassTop: string;
  grassBottom: string;
  mountainColor: string;
  brightness: number;
  isNight: boolean;
}

export class TimeController {
  private currentTime: number = 720;
  private targetTime: number = 720;
  private transitionStart: number = 0;
  private isTransitioning: boolean = false;
  private transitionDuration: number = 1000;
  private onTimeChange: (() => void) | null = null;

  constructor() {}

  setOnTimeChange(callback: () => void): void {
    this.onTimeChange = callback;
  }

  setTime(minutes: number): void {
    this.targetTime = minutes;
    this.transitionStart = performance.now();
    this.isTransitioning = true;
  }

  getTime(): number {
    return this.currentTime;
  }

  getTimeString(): string {
    const hours = Math.floor(this.currentTime / 60);
    const minutes = Math.floor(this.currentTime % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  update(deltaTime: number): void {
    if (this.isTransitioning) {
      const elapsed = performance.now() - this.transitionStart;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      const easeProgress = this.easeInOutCubic(progress);

      const diff = this.targetTime - this.currentTime;
      this.currentTime = this.currentTime + diff * easeProgress;

      if (progress >= 1) {
        this.currentTime = this.targetTime;
        this.isTransitioning = false;
      }

      if (this.onTimeChange) {
        this.onTimeChange();
      }
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getCurrentColorTone(): ColorTone {
    const hours = this.currentTime / 60;

    let dayProgress: number;

    if (hours >= 7 && hours <= 17) {
      dayProgress = 1;
    } else if (hours >= 5 && hours < 7) {
      dayProgress = (hours - 5) / 2;
    } else if (hours > 17 && hours <= 19) {
      dayProgress = 1 - (hours - 17) / 2;
    } else {
      dayProgress = 0;
    }

    dayProgress = Math.max(0, Math.min(1, dayProgress));

    const nightFactor = 1 - dayProgress;

    const skyTopDay = [135, 206, 235];
    const skyBottomDay = [176, 224, 230];
    const skyTopNight = [10, 15, 50];
    const skyBottomNight = [20, 25, 60];

    const skyTop = this.lerpColor(skyTopNight, skyTopDay, dayProgress);
    const skyBottom = this.lerpColor(skyBottomNight, skyBottomDay, dayProgress);

    const grassTopDay = this.hexToRgb('#4caf50');
    const grassBottomDay = this.hexToRgb('#388e3c');
    const grassTopNight = this.hexToRgb('#1b5e20');
    const grassBottomNight = this.hexToRgb('#0d3d12');

    const grassTop = this.lerpColor(grassTopNight, grassTopDay, dayProgress);
    const grassBottom = this.lerpColor(grassBottomNight, grassBottomDay, dayProgress);

    const mountainDay = this.hexToRgb('#5d4037');
    const mountainNight = this.hexToRgb('#2d1f1a');
    const mountainColor = this.lerpColor(mountainNight, mountainDay, dayProgress);

    const brightness = 0.5 + dayProgress * 0.5;

    return {
      skyTop: `rgb(${skyTop[0]}, ${skyTop[1]}, ${skyTop[2]})`,
      skyBottom: `rgb(${skyBottom[0]}, ${skyBottom[1]}, ${skyBottom[2]})`,
      grassTop: `rgb(${grassTop[0]}, ${grassTop[1]}, ${grassTop[2]})`,
      grassBottom: `rgb(${grassBottom[0]}, ${grassBottom[1]}, ${grassBottom[2]})`,
      mountainColor: `rgb(${mountainColor[0]}, ${mountainColor[1]}, ${mountainColor[2]})`,
      brightness,
      isNight: nightFactor > 0.5
    };
  }

  private lerpColor(a: number[], b: number[], t: number): number[] {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }
}
