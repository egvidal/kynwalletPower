import type { LogEntry, Logger } from '@/application/ports/Logger';

/** Una línea JSON por evento en la consola del navegador (research.md R14). */
export class ConsoleJsonLogger implements Logger {
  info(entry: LogEntry): void {
    console.info(this.format('info', entry));
  }

  error(entry: LogEntry): void {
    console.error(this.format('error', entry));
  }

  private format(level: 'info' | 'error', entry: LogEntry): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      app: 'kynwallet-web',
      ...entry,
    });
  }
}
