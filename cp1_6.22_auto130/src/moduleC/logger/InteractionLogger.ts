import { useLoggerStore } from '../store/loggerStore';
import type { EventType } from '../../types';

export class InteractionLogger {
  private static instance: InteractionLogger;
  private isPaused: boolean = false;

  private constructor() {}

  public static getInstance(): InteractionLogger {
    if (!InteractionLogger.instance) {
      InteractionLogger.instance = new InteractionLogger();
    }
    return InteractionLogger.instance;
  }

  public log(type: EventType, payload: Record<string, any> = {}): void {
    if (this.isPaused) return;
    const addLog = useLoggerStore.getState().addLog;
    addLog(type, payload);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public isLoggingPaused(): boolean {
    return this.isPaused;
  }
}

export const interactionLogger = InteractionLogger.getInstance();
