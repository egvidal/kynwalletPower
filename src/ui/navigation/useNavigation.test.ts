import { act, renderHook } from '@testing-library/react';
import { useNavigation } from './useNavigation';

const goTo = (path: string) => window.history.replaceState(null, '', path);

describe('useNavigation (research.md R4)', () => {
  afterEach(() => {
    goTo('/');
    vi.restoreAllMocks();
  });

  it('FR-002: con /register devuelve esa ruta', () => {
    goTo('/register');
    const { result } = renderHook(() => useNavigation());
    expect(result.current.route).toBe('/register');
  });

  it.each(['/', '/otra'])(
    'FR-002: %s se normaliza a /login sin agregar entrada al historial',
    (path) => {
      goTo(path);
      const replaceState = vi.spyOn(window.history, 'replaceState');
      const pushState = vi.spyOn(window.history, 'pushState');
      const { result } = renderHook(() => useNavigation());
      expect(result.current.route).toBe('/login');
      expect(window.location.pathname).toBe('/login');
      expect(replaceState).toHaveBeenCalled();
      expect(pushState).not.toHaveBeenCalled();
    },
  );

  it('navigate agrega una entrada al historial y actualiza la ruta', () => {
    goTo('/login');
    const pushState = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.navigate('/register'));
    expect(pushState).toHaveBeenCalledWith(null, '', '/register');
    expect(result.current.route).toBe('/register');
    expect(window.location.pathname).toBe('/register');
  });

  it('US4: un evento popstate actualiza la ruta', () => {
    goTo('/login');
    const { result } = renderHook(() => useNavigation());
    act(() => {
      goTo('/register');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.route).toBe('/register');
  });

  it('elimina el listener de popstate al desmontar', () => {
    goTo('/login');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNavigation());
    unmount();
    expect(remove).toHaveBeenCalledWith('popstate', expect.any(Function));
  });
});
