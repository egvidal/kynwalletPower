import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createAuthenticate } from '@/application/authenticate';
import { createRegister } from '@/application/register';
import { ConsoleJsonLogger } from '@/infrastructure/ConsoleJsonLogger';
import { InMemoryAuthGateway } from '@/infrastructure/InMemoryAuthGateway';
import { loadDemoAccounts } from '@/infrastructure/loadDemoAccounts';
import { SimulatedRegistrationGateway } from '@/infrastructure/SimulatedRegistrationGateway';
import '@/ui/styles/tokens.css';
import '@/ui/styles/global.css';
import { App } from './App';

// Raíz de composición: único lugar que conoce las implementaciones concretas (Constitución 2.5).
const accounts = loadDemoAccounts(import.meta.env.VITE_DEMO_USERS);
const logger = new ConsoleJsonLogger();
const authenticate = createAuthenticate({ gateway: new InMemoryAuthGateway(accounts), logger });
const register = createRegister({ gateway: new SimulatedRegistrationGateway(), logger });

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App authenticate={authenticate} register={register} />
    </StrictMode>,
  );
}
