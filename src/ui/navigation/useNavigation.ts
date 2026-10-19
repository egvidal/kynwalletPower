import { useCallback, useEffect, useState } from 'react';

export type Route = '/login' | '/register';

const DEFAULT_ROUTE: Route = '/login';

const isRoute = (path: string): path is Route => path === '/login' || path === '/register';

/** Ruta actual; cualquier ruta desconocida se reemplaza por /login sin agregar historial (R4). */
function readRoute(): Route {
  const path = window.location.pathname;
  if (isRoute(path)) return path;
  window.history.replaceState(null, '', DEFAULT_ROUTE);
  return DEFAULT_ROUTE;
}

/** Navegación mínima sobre la History API (research.md R4). */
export function useNavigation() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.history.pushState(null, '', next);
    setRoute(next);
  }, []);

  return { route, navigate };
}
