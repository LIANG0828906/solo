interface DownloadTask {
  url: string;
  filename: string;
  onProgress?: (p: number) => void;
  onComplete?: (size: number) => void;
}

class DownloadQueue {
  private queue: DownloadTask[] = [];
  private active: number = 0;
  private maxConcurrent: number = 3;

  add(task: DownloadTask): void {
    this.queue.push(task);
    this.processNext();
  }

  private processNext(): void {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.active++;
        this.download(task).finally(() => {
          this.active--;
          this.processNext();
        });
      }
    }
  }

  private async download(task: DownloadTask): Promise<void> {
    const totalTime = 1000 + Math.random() * 1000;
    const startTime = Date.now();
    const fileSize = Math.floor(Math.random() * 10000000) + 1000000;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / totalTime) * 100);
        task.onProgress?.(progress);

        if (progress >= 100) {
          clearInterval(interval);
          task.onComplete?.(fileSize);
          resolve();
        }
      }, 50);
    });
  }
}

export const downloadQueue = new DownloadQueue();
