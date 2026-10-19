import { newAttemptId } from './attemptId';

describe('newAttemptId (research.md R14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa crypto.randomUUID cuando está disponible', () => {
    expect(newAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('sin crypto.randomUUID (HTTP fuera de localhost) genera igualmente ids distintos', () => {
    vi.stubGlobal('crypto', {});
    const first = newAttemptId();
    const second = newAttemptId();
    expect(first).toMatch(/^[0-9a-z]+-[0-9a-z]+$/);
    expect(second).not.toBe(first);
  });
});
