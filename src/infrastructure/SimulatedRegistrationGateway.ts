import type { RegistrationGateway } from '@/application/ports/RegistrationGateway';
import type { RegistrationResult } from '@/domain/registration';

const DEFAULT_DELAY_MS = 1000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Registro simulado: no guarda la cuenta (contracts/registration-gateway.md, research.md R6). */
export class SimulatedRegistrationGateway implements RegistrationGateway {
  private readonly delayMs: number;

  constructor({ delayMs = DEFAULT_DELAY_MS }: { delayMs?: number } = {}) {
    this.delayMs = delayMs;
  }

  async register(): Promise<RegistrationResult> {
    await wait(this.delayMs);
    return { kind: 'success' };
  }
}
