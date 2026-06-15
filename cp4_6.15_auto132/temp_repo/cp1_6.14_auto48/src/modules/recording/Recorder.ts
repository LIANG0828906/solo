import { RecordedAction } from '../types';

class Recorder {
  private actions: RecordedAction[] = [];
  private recording: boolean = false;
  private startTime: number = 0;
  private callback: ((action: RecordedAction) => void) | null = null;

  start() {
    this.actions = [];
    this.recording = true;
    this.startTime = Date.now();
  }

  stop(): RecordedAction[] {
    this.recording = false;
    return [...this.actions];
  }

  isRecording(): boolean {
    return this.recording;
  }

  record(type: RecordedAction['type'], params: Record<string, unknown>) {
    if (!this.recording) return;
    const action: RecordedAction = {
      timestamp: Date.now() - this.startTime,
      type,
      params,
    };
    this.actions.push(action);
    if (this.callback) this.callback(action);
  }

  onRecord(cb: (action: RecordedAction) => void) {
    this.callback = cb;
  }

  downloadJSON() {
    const data = this.stop();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-recording-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static loadFromFile(file: File): Promise<RecordedAction[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export const recorder = new Recorder();
