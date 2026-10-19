import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MESSAGES } from '@/domain/messages';
import { expectNoA11yViolations } from '@/test/a11y';
import { createAuthStub } from '@/test/authStub';
import { TEST_ACCOUNT } from '@/test/fixtures';
import { createRegisterStub } from '@/test/registerStub';
import { App } from './App';

const goTo = (path: string) => window.history.replaceState(null, '', path);

/** Atrás/Adelante del navegador: espera el evento popstate que jsdom emite de forma asíncrona. */
async function browserHistory(direction: 'back' | 'forward') {
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true }),
    );
    window.history[direction]();
    await popped;
  });
}

function renderApp() {
  const user = userEvent.setup();
  const utils = render(
    <App authenticate={createAuthStub().authenticate} register={createRegisterStub().register} />,
  );
  return { user, ...utils };
}

async function registerValidAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Diego Martínez');
  await user.type(screen.getByLabelText('Correo electrónico'), 'diego@example.test');
  await user.type(screen.getByLabelText('Contraseña'), 'secreto-123');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'secreto-123');
  await user.click(screen.getByRole('checkbox', { name: 'Acepto los términos y condiciones' }));
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
}

beforeEach(() => {
  goTo('/login');
});

afterEach(() => {
  goTo('/');
});

describe('App · accesibilidad de la pantalla completa (FR-015, SC-005)', () => {
  it('vista de login sin violaciones', async () => {
    const { container } = renderApp();
    await expectNoA11yViolations(container);
  });

  it('vista de login con errores visibles sin violaciones', async () => {
    const { user, container } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await user.click(screen.getByRole('button', { name: 'Google' }));
    await expectNoA11yViolations(container);
  });

  it('vista de bienvenida sin violaciones', async () => {
    const { user, container } = renderApp();
    await user.type(screen.getByLabelText('Correo electrónico'), TEST_ACCOUNT.email);
    await user.type(screen.getByLabelText('Contraseña'), TEST_ACCOUNT.password);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: /Bienvenido,/ });
    await expectNoA11yViolations(container);
  });
});

describe('App · rutas y registro', () => {
  it('FR-002: con /register se muestra el registro y su título de documento', () => {
    goTo('/register');
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByText('Comienza tu', { exact: false })).toBeInTheDocument();
    expect(document.title).toBe('Crear cuenta · KynWallet');
  });

  it('FR-002: con /login se muestra el inicio de sesión y su título de documento', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(document.title).toBe('Iniciar sesión · KynWallet');
  });

  it('US1-1 / FR-012 / FR-013: registro exitoso → /login con el aviso y sin datos en la URL', async () => {
    goTo('/register');
    const { user } = renderApp();
    await registerValidAccount(user);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bienvenido de nuevo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(MESSAGES.REGISTRATION_SUCCESS);
    expect(window.location.pathname).toBe('/login');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
  });

  it('US1-5: el aviso de éxito se muestra una sola vez', async () => {
    goTo('/register');
    const { user } = renderApp();
    await registerValidAccount(user);
    await screen.findByText(MESSAGES.REGISTRATION_SUCCESS);

    await browserHistory('back');
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
    await browserHistory('forward');

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(screen.queryByText(MESSAGES.REGISTRATION_SUCCESS)).not.toBeInTheDocument();
  });

  it('R11: tras navegar, el foco está en el título de la pantalla nueva', async () => {
    goTo('/register');
    const { user } = renderApp();
    await registerValidAccount(user);
    const heading = await screen.findByRole('heading', { level: 1, name: 'Bienvenido de nuevo' });
    expect(heading).toHaveFocus();
  });
});

describe('App · US4 navegación entre login y registro', () => {
  it('US4-1: desde /register, "Inicia sesión" lleva a /login sin aviso de éxito', async () => {
    goTo('/register');
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('US4-2: desde /login, "Regístrate" lleva a /register con el formulario vacío', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Regístrate' }));
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
    expect(window.location.pathname).toBe('/register');
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
  });

  it('US4: Atrás del navegador vuelve a la pantalla anterior', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Regístrate' }));
    await browserHistory('back');
    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(window.location.pathname).toBe('/login');
  });

  it('FR-002: con la URL inicial / se muestra el login y la URL queda en /login', () => {
    goTo('/');
    renderApp();
    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(window.location.pathname).toBe('/login');
  });
});

describe('App · US5 escritorio y móvil', () => {
  it('US5-4: los datos escritos se conservan al cambiar el tamaño de la ventana', async () => {
    goTo('/register');
    const { user } = renderApp();
    await user.type(screen.getByLabelText('Nombre completo'), 'Diego Martínez');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto-123');
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Diego Martínez');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('secreto-123');
  });
});

describe('App · US7 alerta nativa', () => {
  it('US7-3: "Google" llama a alert("Próximamente") y la pantalla sigue en /register', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    goTo('/register');
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Google' }));
    expect(alert).toHaveBeenCalledWith('Próximamente');
    expect(window.location.pathname).toBe('/register');
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
    alert.mockRestore();
  });
});

describe('App · accesibilidad del registro (FR-019, SC-006)', () => {
  it('/register vacío sin violaciones', async () => {
    goTo('/register');
    const { container } = renderApp();
    await expectNoA11yViolations(container);
  });

  it('/register con errores visibles y aviso de términos sin violaciones', async () => {
    goTo('/register');
    const { user, container } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await user.click(screen.getByRole('button', { name: 'términos y condiciones' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('/login con el aviso de registro exitoso sin violaciones', async () => {
    goTo('/register');
    const { user, container } = renderApp();
    await registerValidAccount(user);
    await screen.findByText(MESSAGES.REGISTRATION_SUCCESS);
    await expectNoA11yViolations(container);
  });
});
