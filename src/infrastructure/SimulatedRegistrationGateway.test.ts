import type { RegistrationGateway } from '@/application/ports/RegistrationGateway';
import { SimulatedRegistrationGateway } from './SimulatedRegistrationGateway';

const account = { fullName: 'Ana Pérez', email: 'ana@example.test', password: 'secreto-123' };

// Se usa a través del puerto, igual que el caso de uso.
const gateway = (options?: { delayMs?: number }): RegistrationGateway =>
  new SimulatedRegistrationGateway(options);

describe('SimulatedRegistrationGateway (contracts/registration-gateway.md)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('FR-011: espera 1000 ms por defecto antes de responder success', async () => {
    vi.useFakeTimers();
    const onResult = vi.fn();
    void gateway().register(account).then(onResult);

    await vi.advanceTimersByTimeAsync(999);
    expect(onResult).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onResult).toHaveBeenCalledWith({ kind: 'success' });
  });

  it('con delayMs: 0 responde de inmediato', async () => {
    await expect(gateway({ delayMs: 0 }).register(account)).resolves.toEqual({ kind: 'success' });
  });

  it('FR-013: no escribe en el almacenamiento del navegador', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await gateway({ delayMs: 0 }).register(account);
    expect(setItem).not.toHaveBeenCalled();
  });
});
