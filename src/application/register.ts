import {
  validateRegistration,
  type RegistrationData,
  type RegistrationResult,
} from '@/domain/registration';
import { normalizeEmail } from '@/domain/validation';
import { newAttemptId as defaultAttemptId } from './attemptId';
import type { Logger } from './ports/Logger';
import type { RegistrationGateway } from './ports/RegistrationGateway';

export type Register = (data: RegistrationData) => Promise<RegistrationResult>;

type RegisterDeps = {
  gateway: RegistrationGateway;
  logger: Logger;
  newAttemptId?: () => string;
  now?: () => number;
};

/**
 * Caso de uso: valida, delega en el puerto de registro y registra un evento por intento
 * (contracts/registration-gateway.md, research.md R6 y R14).
 */
export function createRegister({
  gateway,
  logger,
  newAttemptId = defaultAttemptId,
  now = () => performance.now(),
}: RegisterDeps): Register {
  return async (data) => {
    const attemptId = newAttemptId();

    const errors = validateRegistration(data);
    const invalidFields = Object.keys(errors);
    if (invalidFields.length > 0) {
      logger.info({ event: 'registration.rejected', attemptId, invalidFields });
      return { kind: 'invalid', errors };
    }

    const startedAt = now();
    const elapsed = () => Math.round(now() - startedAt);
    try {
      const result = await gateway.register({
        fullName: data.fullName.trim(),
        email: normalizeEmail(data.email),
        password: data.password,
      });
      logger.info({ event: 'registration.succeeded', attemptId, durationMs: elapsed() });
      return result;
    } catch (error) {
      // Solo el tipo del error: el mensaje podría contener datos ingresados (Constitución 5.4).
      logger.error({
        event: 'registration.failed',
        attemptId,
        durationMs: elapsed(),
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      return { kind: 'unavailable' };
    }
  };
}
