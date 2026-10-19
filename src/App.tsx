import { useEffect, useRef, useState } from 'react';
import type { Authenticate } from '@/application/authenticate';
import type { Register } from '@/application/register';
import { MESSAGES } from '@/domain/messages';
import { AuthLayout } from '@/ui/layout/AuthLayout/AuthLayout';
import { LoginForm } from '@/ui/features/login/LoginForm';
import { RegisterForm } from '@/ui/features/register/RegisterForm';
import { useNavigation } from '@/ui/navigation/useNavigation';

type AppProps = {
  authenticate: Authenticate;
  register: Register;
};

const DOCUMENT_TITLES = {
  '/login': 'Iniciar sesión · KynWallet',
  '/register': 'Crear cuenta · KynWallet',
} as const;

export function App({ authenticate, register }: AppProps) {
  const { route, navigate } = useNavigation();
  // Aviso de un solo uso en memoria: nunca en la URL ni en el almacenamiento (research.md R5).
  const [flash, setFlash] = useState<'registered' | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const previousRoute = useRef(route);

  // Al salir de /login por cualquier vía (incluido Atrás del navegador) el aviso se descarta.
  if (flash && route !== '/login') setFlash(null);

  useEffect(() => {
    document.title = DOCUMENT_TITLES[route];
    // En una SPA el cambio de vista no se anuncia solo: el foco va al título (research.md R11).
    // Solo al cambiar de ruta, no en la carga inicial.
    if (previousRoute.current !== route) {
      previousRoute.current = route;
      screenRef.current?.querySelector<HTMLElement>('h1')?.focus();
    }
  }, [route]);

  const handleRegistered = () => {
    navigate('/login');
    setFlash('registered');
  };

  return (
    <div ref={screenRef}>
      {route === '/register' ? (
        <AuthLayout
          brandTitle={
            <>
              Comienza tu
              <br />
              camino financiero.
            </>
          }
          brandSubtitle="Crea tu cuenta en minutos y empieza a enviar, recibir y administrar tu dinero desde cualquier lugar."
        >
          <RegisterForm
            register={register}
            onRegistered={handleRegistered}
            onNavigateLogin={() => navigate('/login')}
          />
        </AuthLayout>
      ) : (
        <AuthLayout
          brandTitle={
            <>
              Tu dinero,
              <br />
              sin fronteras.
            </>
          }
          brandSubtitle="Envía, recibe y paga en segundos. Una billetera pensada para tu día a día."
        >
          <LoginForm
            authenticate={authenticate}
            onNavigateRegister={() => navigate('/register')}
            successNotice={flash ? MESSAGES.REGISTRATION_SUCCESS : undefined}
          />
        </AuthLayout>
      )}
    </div>
  );
}
