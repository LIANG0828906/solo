export interface DownloadTask {
  id: string
  fileName: string
  fileSize: number
  audioUrl: string
  status: 'pending' | 'downloading' | 'completed' | 'error'
  progress: number
  onProgress?: (percent: number) => void
  onComplete?: (fileSizeMB: number, audioUrl: string) => void
  onError?: (err: Error) => void
}

class DownloadQueue {
  private maxConcurrent = 3
  private queue: DownloadTask[] = []
  private running = 0
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  enqueue(task: Omit<DownloadTask, 'status' | 'progress'>): DownloadTask {
    const fullTask: DownloadTask = {
      ...task,
      status: 'pending',
      progress: 0,
    }
    this.queue.push(fullTask)
    this.notify()
    this.processNext()
    return fullTask
  }

  private async processNext() {
    if (this.running >= this.maxConcurrent) return

    const next = this.queue.find((t) => t.status === 'pending')
    if (!next) return

    this.running++
    next.status = 'downloading'
    this.notify()

    try {
      await this.simulateDownload(next)
      next.status = 'completed'
      next.progress = 100
      next.onComplete?.(next.fileSize, next.audioUrl)
    } catch (err) {
      next.status = 'error'
      next.onError?.(err as Error)
    }

    this.running--
    this.notify()
    this.processNext()
  }

  private simulateDownload(task: DownloadTask): Promise<void> {
    return new Promise((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          task.progress = 100
          task.onProgress?.(100)
          this.notify()
          resolve()
        } else {
          task.progress = Math.round(progress)
          task.onProgress?.(task.progress)
          this.notify()
        }
      }, 200)
    })
  }

  cancel(taskId: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === taskId)
    if (idx === -1) return false
    this.queue.splice(idx, 1)
    this.notify()
    return true
  }

  getTasks(): DownloadTask[] {
    return [...this.queue]
  }

  clear() {
    this.queue = []
    this.notify()
  }
}

export const downloadQueue = new DownloadQueue()
