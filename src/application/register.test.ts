import type { RegistrationData } from '@/domain/registration';
import { validateRegistration } from '@/domain/registration';
import { createLoggerSpy } from '@/test/loggerSpy';
import type { RegistrationGateway } from './ports/RegistrationGateway';
import { createRegister } from './register';

const SECRET_NAME = 'Zoe Secreta';
const SECRET_EMAIL = 'zoe@secreto.test';
const SECRET_PASSWORD = 'ClaveSecreta123';

const valid: RegistrationData = {
  fullName: `  ${SECRET_NAME}  `,
  email: ` ${SECRET_EMAIL.toUpperCase()} `,
  password: SECRET_PASSWORD,
  confirmPassword: SECRET_PASSWORD,
  acceptedTerms: true,
};

function setup(gatewayImpl: RegistrationGateway['register']) {
  const gateway: RegistrationGateway = { register: vi.fn(gatewayImpl) };
  const logger = createLoggerSpy();
  let clock = 1000;
  const register = createRegister({
    gateway,
    logger,
    newAttemptId: () => 'attempt-1',
    now: () => {
      clock += 250;
      return clock;
    },
  });
  return { gateway, logger, register };
}

describe('createRegister (contracts/registration-gateway.md)', () => {
  it('normaliza y entrega al gateway solo fullName, email y password', async () => {
    const { gateway, register } = setup(async () => ({ kind: 'success' }));
    const result = await register(valid);
    expect(gateway.register).toHaveBeenCalledWith({
      fullName: SECRET_NAME,
      email: SECRET_EMAIL,
      password: SECRET_PASSWORD,
    });
    expect(result).toEqual({ kind: 'success' });
  });

  it('FR-010: con datos inválidos devuelve invalid y no llama al gateway', async () => {
    const { gateway, register } = setup(async () => ({ kind: 'success' }));
    const data = { ...valid, email: 'usuario@', acceptedTerms: false };
    await expect(register(data)).resolves.toEqual({
      kind: 'invalid',
      errors: validateRegistration(data),
    });
    expect(gateway.register).not.toHaveBeenCalled();
  });

  it('FR-021: si el gateway rechaza devuelve unavailable', async () => {
    const { register } = setup(async () => {
      throw new Error('fallo');
    });
    await expect(register(valid)).resolves.toEqual({ kind: 'unavailable' });
  });

  describe('FR-023: registra un evento estructurado por intento', () => {
    it('éxito → info registration.succeeded con attemptId y durationMs', async () => {
      const { logger, register } = setup(async () => ({ kind: 'success' }));
      await register(valid);
      expect(logger.entries).toEqual([
        {
          level: 'info',
          event: 'registration.succeeded',
          attemptId: 'attempt-1',
          durationMs: 250,
        },
      ]);
    });

    it('inválido → info registration.rejected con los nombres de campo', async () => {
      const { logger, register } = setup(async () => ({ kind: 'success' }));
      await register({ ...valid, email: 'usuario@', acceptedTerms: false });
      expect(logger.entries).toEqual([
        {
          level: 'info',
          event: 'registration.rejected',
          attemptId: 'attempt-1',
          invalidFields: ['email', 'acceptedTerms'],
        },
      ]);
    });

    it('fallo → error registration.failed con durationMs y errorName', async () => {
      const { logger, register } = setup(async () => {
        throw new TypeError('fallo');
      });
      await register(valid);
      expect(logger.entries).toEqual([
        {
          level: 'error',
          event: 'registration.failed',
          attemptId: 'attempt-1',
          durationMs: 250,
          errorName: 'TypeError',
        },
      ]);
    });

    it('un valor lanzado que no es Error se registra como UnknownError', async () => {
      const { logger, register } = setup(() => Promise.reject('texto'));
      await register(valid);
      expect(logger.entries[0]).toMatchObject({ errorName: 'UnknownError' });
    });
  });

  it('FR-013: ningún evento contiene nombre, correo, contraseña ni el mensaje del error', async () => {
    const logs: string[] = [];
    for (const impl of [
      async () => ({ kind: 'success' }) as const,
      async () => {
        throw new TypeError(`detalle interno ${SECRET_EMAIL}`);
      },
    ]) {
      const { logger, register } = setup(impl);
      await register(valid);
      await register({ ...valid, confirmPassword: `${SECRET_PASSWORD}x` });
      logs.push(JSON.stringify(logger.entries));
    }
    const serialized = logs.join('\n').toLowerCase();
    for (const secret of [SECRET_NAME, SECRET_EMAIL, SECRET_PASSWORD, 'detalle interno']) {
      expect(serialized).not.toContain(secret.toLowerCase());
    }
  });

  it('por defecto genera un attemptId único por intento y mide durationMs', async () => {
    const logger = createLoggerSpy();
    const register = createRegister({
      gateway: { register: async () => ({ kind: 'success' }) },
      logger,
    });
    await register(valid);
    await register(valid);
    const [first, second] = logger.entries;
    expect(first?.attemptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(second?.attemptId).not.toBe(first?.attemptId);
    expect(first?.durationMs).toEqual(expect.any(Number));
  });

  it('U1: sin crypto.randomUUID (contexto no seguro) el registro se completa igual', async () => {
    vi.stubGlobal('crypto', {});
    try {
      const logger = createLoggerSpy();
      const register = createRegister({
        gateway: { register: async () => ({ kind: 'success' }) },
        logger,
      });
      await expect(register(valid)).resolves.toEqual({ kind: 'success' });
      expect(logger.entries[0]?.attemptId).toEqual(expect.any(String));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
