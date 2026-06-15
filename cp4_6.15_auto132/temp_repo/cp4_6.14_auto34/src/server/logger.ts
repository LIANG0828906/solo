interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  module: string;
  message: string;
}

const MAX_LOGS = 1000;

export class Logger {
  private logs: LogEntry[] = [];
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      module: this.module,
      message,
    };

    const formatted = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`;

    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
  }

  info(message: string): void {
    this.addLog('INFO', message);
  }

  warn(message: string): void {
    this.addLog('WARN', message);
  }

  error(message: string, error?: unknown): void {
    const errorMsg = error instanceof Error ? `${message} - ${error.message}` : message;
    this.addLog('ERROR', errorMsg);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const globalLogger = new Logger('Global');
