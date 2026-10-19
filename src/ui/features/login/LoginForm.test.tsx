import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createAuthStub } from '@/test/authStub';
import { TEST_ACCOUNT } from '@/test/fixtures';
import { LoginForm } from './LoginForm';

function setup(stub = createAuthStub(), onNavigateRegister = vi.fn()) {
  const user = userEvent.setup();
  render(<LoginForm authenticate={stub.authenticate} onNavigateRegister={onNavigateRegister} />);
  const email = screen.getByLabelText('Correo electrónico');
  const password = screen.getByLabelText('Contraseña');
  const submit = () => user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  return { user, stub, email, password, submit };
}

describe('LoginForm · US1 Iniciar sesión con credenciales válidas', () => {
  it('US1-1: credenciales válidas → vista de bienvenida con el nombre', async () => {
    const { user, email, password, submit } = setup();
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, TEST_ACCOUNT.password);
    await submit();
    expect(
      await screen.findByRole('heading', { name: '¡Bienvenido, Steven Luna!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
  });

  it('US1-2: durante la espera el botón está ocupado y no admite reenvíos', async () => {
    const { user, stub, email, password, submit } = setup();
    stub.defer();
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, TEST_ACCOUNT.password);
    await submit();
    const busy = screen.getByRole('button', { name: 'Iniciando sesión…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await user.click(busy);
    await user.keyboard('{Enter}');
    expect(stub.authenticate).toHaveBeenCalledOnce();
    await act(async () => stub.release());
    expect(await screen.findByRole('heading', { name: /Bienvenido, Steven Luna/ })).toBeVisible();
  });

  it('US1-3: acepta el correo con mayúsculas y espacios y autentica', async () => {
    const { user, stub, email, password, submit } = setup();
    await user.type(email, '  STEVEN.Luna@Example.test ');
    await user.type(password, TEST_ACCOUNT.password);
    await submit();
    // El input type="email" recorta espacios; el caso de uso normaliza mayúsculas.
    expect(stub.authenticate).toHaveBeenCalledWith({
      email: expect.stringMatching(/^\s*steven\.luna@example\.test\s*$/i),
      password: TEST_ACCOUNT.password,
    });
    expect(await screen.findByRole('heading', { name: /Bienvenido/ })).toBeVisible();
  });

  it('US1-4: Enter en la contraseña envía el formulario', async () => {
    const { user, stub, email, password } = setup();
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, `${TEST_ACCOUNT.password}{Enter}`);
    expect(stub.authenticate).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: /Bienvenido/ })).toBeVisible();
  });

  it('US1-5: "Cerrar sesión" vuelve al formulario con los campos vacíos', async () => {
    const { user, email, password, submit } = setup();
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, TEST_ACCOUNT.password);
    await submit();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('LoginForm · US2 Retroalimentación ante credenciales incorrectas', () => {
  const invalid = () => createAuthStub({ kind: 'invalid-credentials' });

  it('US2-1: contraseña incorrecta → mensaje genérico, sin bienvenida', async () => {
    const { user, email, password, submit } = setup(invalid());
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, 'otra-clave-99');
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(screen.queryByRole('heading', { name: /Bienvenido,/ })).not.toBeInTheDocument();
  });

  it('US2-2: correo inexistente → exactamente el mismo mensaje', async () => {
    const { user, email, password, submit } = setup(invalid());
    await user.type(email, 'nadie@example.test');
    await user.type(password, 'cualquier-clave');
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Correo o contraseña incorrectos$/);
  });

  it('US2-3: editar un campo oculta el error', async () => {
    const { user, email, password, submit } = setup(invalid());
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, 'otra-clave-99');
    await submit();
    await screen.findByRole('alert');
    await user.type(screen.getByLabelText('Contraseña'), 'n');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('US2-4: conserva el correo, vacía la contraseña y le da el foco', async () => {
    const { user, email, password, submit } = setup(invalid());
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, 'otra-clave-99');
    await submit();
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(TEST_ACCOUNT.email);
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveValue('');
    expect(passwordInput).toHaveFocus();
  });

  it('Caso límite: servicio no disponible → mensaje sin detalles internos', async () => {
    const { user, email, password, submit } = setup(createAuthStub({ kind: 'unavailable' }));
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, TEST_ACCOUNT.password);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Servicio de acceso no disponible. Intenta más tarde.',
    );
  });
});

describe('LoginForm · US3 Validar los campos antes de enviar', () => {
  it('US3-1: envío vacío → ambos mensajes, sin autenticar y foco en el correo', async () => {
    const { stub, submit } = setup();
    await submit();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Ingresa tu correo electrónico',
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      'Ingresa tu contraseña',
    );
    expect(stub.authenticate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus();
  });

  it('US3-2: "usuario@" y salir del campo → mensaje de correo válido', async () => {
    const { user, email } = setup();
    await user.type(email, 'usuario@');
    await user.tab();
    expect(email).toHaveAccessibleDescription('Ingresa un correo electrónico válido');
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  it('US3-3: contraseña de 7 caracteres → mensaje de longitud, sin autenticar', async () => {
    const { user, stub, email, password, submit } = setup();
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, '1234567');
    await submit();
    expect(password).toHaveAccessibleDescription('La contraseña debe tener al menos 8 caracteres');
    expect(stub.authenticate).not.toHaveBeenCalled();
    expect(password).toHaveFocus();
  });

  it('US3-4: corregir el valor oculta el mensaje', async () => {
    const { user, email } = setup();
    await user.type(email, 'usuario@');
    await user.tab();
    await user.type(email, 'example.test');
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Ingresa un correo electrónico válido')).not.toBeInTheDocument();
  });

  it('Caso límite: el texto pegado se valida igual que el escrito', async () => {
    const { user, email } = setup();
    await user.click(email);
    await user.paste('usuario.com');
    await user.tab();
    expect(email).toHaveAccessibleDescription('Ingresa un correo electrónico válido');
  });
});

describe('LoginForm · US5 Elementos del diseño fuera de alcance', () => {
  it.each(['¿Olvidaste tu contraseña?', 'Google', 'Apple'])(
    'US5-1: "%s" muestra el aviso y conserva los datos',
    async (name) => {
      const { user, stub, email, password } = setup();
      await user.type(email, TEST_ACCOUNT.email);
      await user.type(password, TEST_ACCOUNT.password);
      await user.click(screen.getByRole('button', { name }));
      expect(screen.getByRole('status')).toHaveTextContent(
        'Función no disponible en esta demostración',
      );
      expect(email).toHaveValue(TEST_ACCOUNT.email);
      expect(password).toHaveValue(TEST_ACCOUNT.password);
      expect(stub.authenticate).not.toHaveBeenCalled();
    },
  );

  it('US4-2 (002): "Regístrate" llama a onNavigateRegister sin autenticar', async () => {
    const onNavigateRegister = vi.fn();
    const { user, stub } = setup(createAuthStub(), onNavigateRegister);
    await user.click(screen.getByRole('button', { name: 'Regístrate' }));
    expect(onNavigateRegister).toHaveBeenCalledOnce();
    expect(stub.authenticate).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('US5-2: "Recordarme" cambia de estado sin escribir en el almacenamiento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { user } = setup();
    const checkbox = screen.getByRole('checkbox', { name: 'Recordarme' });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('FR-014: orden de tabulación según contracts/ui-login.md', async () => {
    const { user } = setup();
    const expected = [
      screen.getByLabelText('Correo electrónico'),
      screen.getByLabelText('Contraseña'),
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
      screen.getByRole('checkbox', { name: 'Recordarme' }),
      screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }),
      screen.getByRole('button', { name: 'Iniciar sesión' }),
      screen.getByRole('button', { name: 'Google' }),
      screen.getByRole('button', { name: 'Apple' }),
      screen.getByRole('button', { name: 'Regístrate' }),
    ];
    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it('el aviso desaparece al enviar el formulario', async () => {
    const { user, submit } = setup();
    await user.click(screen.getByRole('button', { name: 'Google' }));
    await submit();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('LoginForm · seguridad (FR-012)', () => {
  it('la contraseña no aparece en el DOM, la URL, la consola ni el almacenamiento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method),
    );
    const secret = 'otra-clave-99';

    const stub = createAuthStub({ kind: 'invalid-credentials' });
    const { user, email, password, submit } = setup(stub);
    await user.type(email, TEST_ACCOUNT.email);
    await user.type(password, secret);
    await submit();
    await screen.findByRole('alert');

    const serialized = [
      document.body.textContent ?? '',
      window.location.href,
      ...setItem.mock.calls.flat(),
      ...consoleSpies.flatMap((spy) => spy.mock.calls.flat().map(String)),
    ].join('\n');
    expect(serialized).not.toContain(secret);
    expect(setItem).not.toHaveBeenCalled();

    setItem.mockRestore();
    consoleSpies.forEach((spy) => spy.mockRestore());
  });
});

describe('LoginForm · aviso de registro exitoso (002, FR-012)', () => {
  it('con successNotice muestra un status con ese texto', () => {
    render(
      <LoginForm
        authenticate={createAuthStub().authenticate}
        onNavigateRegister={vi.fn()}
        successNotice="Cuenta creada"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada');
  });

  it('sin successNotice no hay aviso', () => {
    setup();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
