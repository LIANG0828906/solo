export interface HistoryFrame {
    x: number;
    y: number;
    timestamp: number;
}

export class HistoryBuffer {
    private buffer: HistoryFrame[] = [];
    private maxDuration: number = 5000;
    private maxFrames: number = 600;

    constructor(maxDuration: number = 5000) {
        this.maxDuration = maxDuration;
        this.maxFrames = Math.ceil(maxDuration / 16.67);
    }

    push(frame: HistoryFrame): void {
        this.buffer.push(frame);
        this.cleanOldFrames(frame.timestamp);
        if (this.buffer.length > this.maxFrames) {
            this.buffer.shift();
        }
    }

    private cleanOldFrames(currentTime: number): void {
        const cutoffTime = currentTime - this.maxDuration;
        while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoffTime) {
            this.buffer.shift();
        }
    }

    getFramesForRewind(): HistoryFrame[] {
        return [...this.buffer].reverse();
    }

    getLastFrame(): HistoryFrame | null {
        if (this.buffer.length === 0) return null;
        return this.buffer[this.buffer.length - 1];
    }

    clear(): void {
        this.buffer = [];
    }

    getFrameCount(): number {
        return this.buffer.length;
    }

    getBuffer(): HistoryFrame[] {
        return this.buffer;
    }

    getMaxDuration(): number {
        return this.maxDuration;
    }
}
