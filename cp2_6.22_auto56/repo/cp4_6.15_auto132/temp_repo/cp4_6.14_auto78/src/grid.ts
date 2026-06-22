export class GridSystem {
  private bpm: number = 120;

  setBPM(bpm: number): void {
    this.bpm = Math.max(40, Math.min(300, bpm));
  }

  getBPM(): number {
    return this.bpm;
  }

  getBeatInterval(): number {
    return 60 / this.bpm;
  }

  getSnapPosition(timestamp: number): number {
    const beat = this.getBeatInterval();
    return Math.round(timestamp / beat) * beat;
  }

  getGridPositions(duration: number, minPxSpacing: number = 10, pixelsPerSecond: number = 100): number[] {
    const beat = this.getBeatInterval();
    const positions: number[] = [];

    let beatInterval = beat;
    const pxPerBeat = beat * pixelsPerSecond;

    let subdivision = 1;
    if (pxPerBeat < minPxSpacing) {
      const multiplier = Math.ceil(minPxSpacing / pxPerBeat);
      beatInterval = beat * multiplier;
      subdivision = 0;
    } else if (pxPerBeat > minPxSpacing * 4) {
      subdivision = 4;
    } else if (pxPerBeat > minPxSpacing * 2) {
      subdivision = 2;
    }

    if (subdivision > 1) {
      beatInterval = beat / subdivision;
    }

    for (let t = 0; t <= duration + beatInterval * 0.5; t += beatInterval) {
      positions.push(Number(t.toFixed(4)));
    }

    return positions;
  }
}
