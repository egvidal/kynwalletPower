import type { AuthResult } from '@/domain/auth';
import { createLoggerSpy } from '@/test/loggerSpy';
import type { AuthGateway } from './ports/AuthGateway';
import { createAuthenticate } from './authenticate';

function setup(gatewayImpl: AuthGateway['authenticate']) {
  const gateway: AuthGateway = { authenticate: vi.fn(gatewayImpl) };
  const logger = createLoggerSpy();
  let clock = 0;
  const authenticate = createAuthenticate({
    gateway,
    logger,
    newAttemptId: () => 'attempt-1',
    now: () => {
      clock += 100;
      return clock;
    },
  });
  return { gateway, logger, authenticate };
}

const resolving = (result: AuthResult) => async () => result;

describe('createAuthenticate', () => {
  it('delega con el correo normalizado y la contraseña sin modificar', async () => {
    const { gateway, authenticate } = setup(resolving({ kind: 'success', displayName: 'Ana' }));
    const result = await authenticate({ email: ' Ana@Example.test ', password: ' con espacios ' });
    expect(gateway.authenticate).toHaveBeenCalledWith({
      email: 'ana@example.test',
      password: ' con espacios ',
    });
    expect(result).toEqual({ kind: 'success', displayName: 'Ana' });
  });

  it('FR-019: si el gateway lanza una excepción devuelve unavailable', async () => {
    const { authenticate } = setup(async () => {
      throw new Error('x');
    });
    await expect(authenticate({ email: 'a@b.co', password: 'p' })).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  describe('T073: registra un evento estructurado por intento (Constitución 5.5 y 8.7)', () => {
    const credentials = { email: 'a@b.co', password: 'secreto-123' };

    it('éxito → info auth.succeeded con attemptId y durationMs', async () => {
      const { logger, authenticate } = setup(resolving({ kind: 'success', displayName: 'Ana' }));
      await authenticate(credentials);
      expect(logger.entries).toEqual([
        { level: 'info', event: 'auth.succeeded', attemptId: 'attempt-1', durationMs: 100 },
      ]);
    });

    it('credenciales incorrectas → info auth.rejected con reason', async () => {
      const { logger, authenticate } = setup(resolving({ kind: 'invalid-credentials' }));
      await authenticate(credentials);
      expect(logger.entries).toEqual([
        {
          level: 'info',
          event: 'auth.rejected',
          attemptId: 'attempt-1',
          durationMs: 100,
          reason: 'invalid-credentials',
        },
      ]);
    });

    it('servicio no disponible → error auth.failed con reason', async () => {
      const { logger, authenticate } = setup(resolving({ kind: 'unavailable' }));
      await authenticate(credentials);
      expect(logger.entries).toEqual([
        {
          level: 'error',
          event: 'auth.failed',
          attemptId: 'attempt-1',
          durationMs: 100,
          reason: 'unavailable',
        },
      ]);
    });

    it('excepción del gateway → error auth.failed con errorName', async () => {
      const { logger, authenticate } = setup(async () => {
        throw new TypeError('x');
      });
      await authenticate(credentials);
      expect(logger.entries).toEqual([
        {
          level: 'error',
          event: 'auth.failed',
          attemptId: 'attempt-1',
          durationMs: 100,
          errorName: 'TypeError',
        },
      ]);
    });

    it('un valor lanzado que no es Error se registra como UnknownError', async () => {
      const { logger, authenticate } = setup(() => Promise.reject('texto'));
      await authenticate(credentials);
      expect(logger.entries[0]).toMatchObject({ errorName: 'UnknownError' });
    });

    it('FR-012: ningún evento contiene correo, contraseña, nombre del titular ni el mensaje del error', async () => {
      const secrets = {
        email: 'zoe@secreto.test',
        password: 'ClaveSecreta123',
        displayName: 'Zoe Secreta',
        message: 'detalle interno zoe@secreto.test',
      };
      const logs: string[] = [];
      for (const impl of [
        resolving({ kind: 'success', displayName: secrets.displayName }),
        resolving({ kind: 'invalid-credentials' }),
        async (): Promise<AuthResult> => {
          throw new TypeError(secrets.message);
        },
      ]) {
        const { logger, authenticate } = setup(impl);
        await authenticate({ email: secrets.email, password: secrets.password });
        logs.push(JSON.stringify(logger.entries));
      }
      const serialized = logs.join('\n').toLowerCase();
      for (const secret of Object.values(secrets)) {
        expect(serialized).not.toContain(secret.toLowerCase());
      }
    });
  });

  it('por defecto genera el attemptId y mide durationMs', async () => {
    const logger = createLoggerSpy();
    const authenticate = createAuthenticate({
      gateway: { authenticate: async () => ({ kind: 'invalid-credentials' }) },
      logger,
    });
    await authenticate({ email: 'a@b.co', password: 'secreto-123' });
    expect(logger.entries[0]).toMatchObject({
      attemptId: expect.any(String),
      durationMs: expect.any(Number),
    });
  });
});
