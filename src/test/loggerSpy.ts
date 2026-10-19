import type { LogEntry, Logger } from '@/application/ports/Logger';

type RecordedEntry = LogEntry & { level: 'info' | 'error' };

/** Logger espía: guarda cada evento en orden, con su nivel. */
export function createLoggerSpy() {
  const entries: RecordedEntry[] = [];
  const logger = {
    entries,
    info: vi.fn((entry: LogEntry) => {
      entries.push({ level: 'info', ...entry });
    }),
    error: vi.fn((entry: LogEntry) => {
      entries.push({ level: 'error', ...entry });
    }),
  } satisfies Logger & { entries: RecordedEntry[] };
  return logger;
}
