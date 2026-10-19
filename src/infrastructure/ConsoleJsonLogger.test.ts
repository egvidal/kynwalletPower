import { ConsoleJsonLogger } from './ConsoleJsonLogger';

const entry = { event: 'registration.succeeded', attemptId: 'attempt-1', durationMs: 42 };

describe('ConsoleJsonLogger (research.md R14)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('info escribe una línea JSON en console.info', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    new ConsoleJsonLogger().info(entry);
    expect(info).toHaveBeenCalledTimes(1);
    expect(JSON.parse(info.mock.calls[0]?.[0] as string)).toEqual({
      timestamp: '2026-10-19T12:00:00.000Z',
      level: 'info',
      app: 'kynwallet-web',
      ...entry,
    });
  });

  it('error escribe una línea JSON en console.error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    new ConsoleJsonLogger().error({ ...entry, event: 'registration.failed', errorName: 'X' });
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(error.mock.calls[0]?.[0] as string)).toEqual({
      timestamp: '2026-10-19T12:00:00.000Z',
      level: 'error',
      app: 'kynwallet-web',
      ...entry,
      event: 'registration.failed',
      errorName: 'X',
    });
  });
});
