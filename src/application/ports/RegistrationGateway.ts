import type { NewAccount, RegistrationResult } from '@/domain/registration';

/** Puerto de registro (contracts/registration-gateway.md). */
export interface RegistrationGateway {
  register(account: NewAccount): Promise<RegistrationResult>;
}
