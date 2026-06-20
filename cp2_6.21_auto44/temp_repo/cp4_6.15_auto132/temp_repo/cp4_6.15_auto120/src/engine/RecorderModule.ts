export class RecorderModule {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private recordingStartTime: number = 0;
  private recordingTime: number = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private audioDestination: MediaStreamAudioDestinationNode;
  private recordedBlob: Blob | null = null;

  constructor(audioDestination: MediaStreamAudioDestinationNode) {
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser');
    }
    this.audioDestination = audioDestination;
  }

  start(): void {
    if (this.isRecording()) {
      throw new Error('Recording is already in progress');
    }

    try {
      const stream = this.audioDestination.stream;
      const mimeType = 'audio/webm';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('audio/webm mime type is not supported');
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.chunks = [];
      this.recordedBlob = null;
      this.recordingTime = 0;
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: Event) => {
        this.stopTimer();
        const errorEvent = event as { error?: { message?: string } };
        throw new Error(`Recording error: ${errorEvent.error?.message || 'Unknown error'}`);
      };

      this.mediaRecorder.start();
      this.startTimer();
    } catch (error) {
      this.stopTimer();
      this.cleanup();
      throw error instanceof Error ? error : new Error('Failed to start recording');
    }
  }

  stop(): void {
    if (!this.isRecording() || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    try {
      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.chunks, { type: 'audio/webm' });
        this.download();
      };

      this.mediaRecorder.stop();
      this.stopTimer();
    } catch (error) {
      this.stopTimer();
      throw error instanceof Error ? error : new Error('Failed to stop recording');
    }
  }

  private download(): void {
    if (!this.recordedBlob) {
      throw new Error('No recorded data available');
    }

    const url = URL.createObjectURL(this.recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getRecordingTime(): number {
    return this.recordingTime;
  }

  private startTimer(): void {
    this.timerId = setInterval(() => {
      this.recordingTime = Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private cleanup(): void {
    this.stopTimer();
    this.chunks = [];
    this.mediaRecorder = null;
    this.recordedBlob = null;
  }

  private generateFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `JamSession_${year}${month}${day}_${hours}${minutes}${seconds}.webm`;
  }
}
