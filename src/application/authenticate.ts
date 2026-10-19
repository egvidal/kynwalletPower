import type { AuthResult, LoginCredentials } from '@/domain/auth';
import { normalizeEmail } from '@/domain/validation';
import { newAttemptId as defaultAttemptId } from './attemptId';
import type { AuthGateway } from './ports/AuthGateway';
import type { Logger } from './ports/Logger';

export type Authenticate = (credentials: LoginCredentials) => Promise<AuthResult>;

type AuthenticateDeps = {
  gateway: AuthGateway;
  logger: Logger;
  newAttemptId?: () => string;
  now?: () => number;
};

/**
 * Caso de uso: inicia sesión delegando en el puerto de autenticación y registra un evento por
 * intento, sin correo, contraseña ni nombre del titular (001 T073; 002 research.md R14).
 */
export function createAuthenticate({
  gateway,
  logger,
  newAttemptId = defaultAttemptId,
  now = () => performance.now(),
}: AuthenticateDeps): Authenticate {
  return async ({ email, password }) => {
    const attemptId = newAttemptId();
    const startedAt = now();
    const elapsed = () => Math.round(now() - startedAt);
    try {
      const result = await gateway.authenticate({ email: normalizeEmail(email), password });
      switch (result.kind) {
        case 'success':
          logger.info({ event: 'auth.succeeded', attemptId, durationMs: elapsed() });
          break;
        case 'invalid-credentials':
          logger.info({
            event: 'auth.rejected',
            attemptId,
            durationMs: elapsed(),
            reason: result.kind,
          });
          break;
        case 'unavailable':
          logger.error({
            event: 'auth.failed',
            attemptId,
            durationMs: elapsed(),
            reason: result.kind,
          });
          break;
      }
      return result;
    } catch (error) {
      // Solo el tipo del error: el mensaje podría contener datos ingresados (Constitución 5.4).
      logger.error({
        event: 'auth.failed',
        attemptId,
        durationMs: elapsed(),
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      return { kind: 'unavailable' };
    }
  };
}
