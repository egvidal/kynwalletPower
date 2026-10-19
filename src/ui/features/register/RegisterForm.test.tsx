import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MESSAGES } from '@/domain/messages';
import { createRegisterStub } from '@/test/registerStub';
import { RegisterForm } from './RegisterForm';

const VALID = {
  fullName: 'Diego Martínez',
  email: 'diego@example.test',
  password: 'secreto-123',
};

function setup(
  stub = createRegisterStub(),
  { onComingSoon }: { onComingSoon?: (message: string) => void } = {},
) {
  const user = userEvent.setup();
  const onRegistered = vi.fn();
  const onNavigateLogin = vi.fn();
  render(
    <RegisterForm
      register={stub.register}
      onRegistered={onRegistered}
      onNavigateLogin={onNavigateLogin}
      onComingSoon={onComingSoon}
    />,
  );
  const fields = {
    fullName: screen.getByLabelText('Nombre completo'),
    email: screen.getByLabelText('Correo electrónico'),
    password: screen.getByLabelText('Contraseña'),
    confirmPassword: screen.getByLabelText('Confirmar contraseña'),
    terms: screen.getByRole('checkbox', { name: 'Acepto los términos y condiciones' }),
  };
  const submit = () => user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  const fillValid = async (overrides: Partial<typeof VALID> = {}) => {
    const data = { ...VALID, ...overrides };
    await user.type(fields.fullName, data.fullName);
    await user.type(fields.email, data.email);
    await user.type(fields.password, data.password);
    await user.type(fields.confirmPassword, data.password);
    await user.click(fields.terms);
  };
  return { user, stub, onRegistered, onNavigateLogin, fields, submit, fillValid };
}

describe('RegisterForm · US1 Crear una cuenta con datos válidos', () => {
  it('FR-003: muestra el contenido del frame 04 · Registro', () => {
    const { fields } = setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByText('Completa tus datos para comenzar')).toBeInTheDocument();
    expect(fields.fullName).toHaveAttribute('placeholder', 'Ej: Diego Martínez');
    expect(fields.fullName).toHaveAttribute('autocomplete', 'name');
    expect(fields.email).toHaveAttribute('type', 'email');
    expect(fields.email).toHaveAttribute('placeholder', 'tucorreo@ejemplo.com');
    expect(fields.email).toHaveAttribute('autocomplete', 'email');
    for (const field of [fields.password, fields.confirmPassword]) {
      expect(field).toHaveAttribute('type', 'password');
      expect(field).toHaveAttribute('placeholder', '••••••••');
      expect(field).toHaveAttribute('autocomplete', 'new-password');
    }
    expect(fields.terms).not.toBeChecked();
    expect(screen.getByText('o regístrate con')).toBeInTheDocument();
    expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument();
  });

  it('US1-1: datos válidos + casilla + "Crear cuenta" → registra y avisa una vez', async () => {
    const { stub, onRegistered, submit, fillValid } = setup();
    await fillValid();
    await submit();
    expect(stub.register).toHaveBeenCalledWith({
      ...VALID,
      confirmPassword: VALID.password,
      acceptedTerms: true,
    });
    expect(onRegistered).toHaveBeenCalledOnce();
  });

  it('US1-2: durante la espera el botón está ocupado y no admite reenvíos', async () => {
    const { user, stub, onRegistered, submit, fillValid } = setup();
    stub.defer();
    await fillValid();
    await submit();
    const busy = screen.getByRole('button', { name: 'Creando cuenta…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await user.click(busy);
    await user.keyboard('{Enter}');
    expect(stub.register).toHaveBeenCalledOnce();
    await act(async () => stub.release());
    expect(onRegistered).toHaveBeenCalledOnce();
  });

  it('US1-2: Enter en un campo durante la espera no reenvía', async () => {
    const { user, stub, fields, submit, fillValid } = setup();
    stub.defer();
    await fillValid();
    await submit();
    await user.click(fields.fullName);
    await user.keyboard('{Enter}');
    expect(stub.register).toHaveBeenCalledOnce();
  });

  it('si la pantalla se desmonta durante la espera, no avisa del registro', async () => {
    const stub = createRegisterStub();
    stub.defer();
    const user = userEvent.setup();
    const onRegistered = vi.fn();
    const { unmount } = render(
      <RegisterForm
        register={stub.register}
        onRegistered={onRegistered}
        onNavigateLogin={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText('Nombre completo'), VALID.fullName);
    await user.type(screen.getByLabelText('Correo electrónico'), VALID.email);
    await user.type(screen.getByLabelText('Contraseña'), VALID.password);
    await user.type(screen.getByLabelText('Confirmar contraseña'), VALID.password);
    await user.click(screen.getByRole('checkbox', { name: 'Acepto los términos y condiciones' }));
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    unmount();
    await act(async () => stub.release());
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('US1-3: Enter en "Nombre completo" envía el formulario', async () => {
    const { user, stub, fields, fillValid } = setup();
    await fillValid();
    await user.click(fields.fullName);
    await user.keyboard('{Enter}');
    expect(stub.register).toHaveBeenCalledOnce();
  });

  it('US1-4: los espacios periféricos en nombre y correo no impiden el registro', async () => {
    const { stub, onRegistered, submit, fillValid } = setup();
    await fillValid({ fullName: '  Diego Martínez  ', email: ' diego@example.test ' });
    await submit();
    expect(stub.register).toHaveBeenCalledOnce();
    expect(onRegistered).toHaveBeenCalledOnce();
  });
});

describe('RegisterForm · US2 Retroalimentación inmediata sobre los datos', () => {
  it('US2-1: enviar vacío muestra los mensajes obligatorios, no registra y enfoca el nombre', async () => {
    const { stub, fields, submit } = setup();
    await submit();
    expect(fields.fullName).toHaveAccessibleDescription(MESSAGES.FULL_NAME_REQUIRED);
    expect(fields.email).toHaveAccessibleDescription(MESSAGES.EMAIL_REQUIRED);
    expect(fields.password).toHaveAccessibleDescription(MESSAGES.PASSWORD_REQUIRED);
    expect(fields.confirmPassword).toHaveAccessibleDescription(MESSAGES.CONFIRM_PASSWORD_REQUIRED);
    expect(stub.register).not.toHaveBeenCalled();
    expect(fields.fullName).toHaveFocus();
  });

  it('US2-2: correo sin formato válido al salir del campo', async () => {
    const { user, fields } = setup();
    await user.type(fields.email, 'usuario@');
    await user.tab();
    expect(fields.email).toHaveAccessibleDescription(MESSAGES.EMAIL_INVALID);
  });

  it('US2-3: contraseña de 7 caracteres al salir del campo', async () => {
    const { user, fields } = setup();
    await user.type(fields.password, '1234567');
    await user.click(fields.confirmPassword);
    expect(fields.password).toHaveAccessibleDescription(MESSAGES.PASSWORD_TOO_SHORT);
  });

  it('US2-4: confirmación distinta al salir del campo', async () => {
    const { user, fields } = setup();
    await user.type(fields.password, 'secreto-123');
    await user.type(fields.confirmPassword, 'secreto-999');
    await user.click(fields.terms);
    expect(fields.confirmPassword).toHaveAccessibleDescription(MESSAGES.PASSWORDS_DO_NOT_MATCH);
  });

  it('US2-5: cambiar la contraseña después de igualarlas muestra el error en la confirmación', async () => {
    const { user, fields } = setup();
    await user.type(fields.password, 'secreto-123');
    await user.type(fields.confirmPassword, 'secreto-123');
    await user.click(fields.terms);
    expect(fields.confirmPassword).not.toHaveAccessibleDescription();
    await user.type(fields.password, '4');
    expect(fields.confirmPassword).toHaveAccessibleDescription(MESSAGES.PASSWORDS_DO_NOT_MATCH);
  });

  it('US2-6: corregir el valor elimina el mensaje', async () => {
    const { user, fields } = setup();
    await user.type(fields.email, 'usuario@');
    await user.tab();
    await user.type(fields.email, 'example.test');
    expect(fields.email).not.toHaveAccessibleDescription();
  });

  it('US2-7: los campos con error tienen aria-invalid y la descripción accesible', async () => {
    const { fields, submit } = setup();
    await submit();
    for (const field of [fields.fullName, fields.email, fields.password, fields.confirmPassword]) {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    }
  });

  it('US2-8: enviar con errores conserva todos los valores, contraseñas incluidas', async () => {
    const { user, fields, submit } = setup();
    await user.type(fields.fullName, 'Diego');
    await user.type(fields.email, 'usuario@');
    await user.type(fields.password, 'secreto-123');
    await user.type(fields.confirmPassword, 'otra-clave');
    await submit();
    expect(fields.fullName).toHaveValue('Diego');
    expect(fields.email).toHaveValue('usuario@');
    expect(fields.password).toHaveValue('secreto-123');
    expect(fields.confirmPassword).toHaveValue('otra-clave');
  });

  it('FR-010: con nombre válido y correo inválido el foco va al correo', async () => {
    const { user, fields, submit } = setup();
    await user.type(fields.fullName, 'Diego Martínez');
    await user.type(fields.email, 'usuario@');
    await submit();
    expect(fields.email).toHaveFocus();
  });

  it('FR-021: un fallo inesperado muestra un alert genérico y conserva los valores', async () => {
    const { user, fields, submit, fillValid } = setup(createRegisterStub({ kind: 'unavailable' }));
    await fillValid();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.REGISTRATION_UNAVAILABLE);
    expect(fields.password).toHaveValue(VALID.password);
    await user.type(fields.fullName, 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('result(invalid) del caso de uso muestra los errores devueltos', async () => {
    const stub = createRegisterStub({ kind: 'invalid', errors: { email: MESSAGES.EMAIL_INVALID } });
    const { fields, submit, fillValid } = setup(stub);
    await fillValid();
    await submit();
    expect(fields.email).toHaveAccessibleDescription(MESSAGES.EMAIL_INVALID);
  });

  it('caso límite: pegar un correo inválido se valida igual que escribirlo', async () => {
    const { user, fields } = setup();
    await user.click(fields.email);
    await user.paste('usuario.com');
    await user.tab();
    expect(fields.email).toHaveAccessibleDescription(MESSAGES.EMAIL_INVALID);
  });

  it('caso límite / FR-013: un registro válido no escribe en el almacenamiento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { submit, fillValid } = setup();
    await fillValid();
    await submit();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('RegisterForm · US3 Aceptar los términos y condiciones', () => {
  it('US3-1: todo válido sin casilla → mensaje, no registra y enfoca la casilla', async () => {
    const { user, stub, fields, submit } = setup();
    await user.type(fields.fullName, VALID.fullName);
    await user.type(fields.email, VALID.email);
    await user.type(fields.password, VALID.password);
    await user.type(fields.confirmPassword, VALID.password);
    await submit();
    expect(fields.terms).toHaveAccessibleDescription(MESSAGES.TERMS_REQUIRED);
    expect(stub.register).not.toHaveBeenCalled();
    expect(fields.terms).toHaveFocus();
  });

  it('US2-1 (parte de términos): con el formulario vacío también se muestra el mensaje de términos', async () => {
    const { fields, submit } = setup();
    await submit();
    expect(fields.terms).toHaveAccessibleDescription(MESSAGES.TERMS_REQUIRED);
  });

  it('US3-2: marcar la casilla elimina el mensaje', async () => {
    const { user, fields, submit } = setup();
    await submit();
    await user.click(fields.terms);
    expect(fields.terms).not.toHaveAccessibleDescription();
  });

  it('US3-3: "términos y condiciones" avisa sin cambiar la casilla y conserva los datos', async () => {
    const { user, fields } = setup();
    await user.type(fields.fullName, VALID.fullName);
    await user.click(screen.getByRole('button', { name: 'términos y condiciones' }));
    expect(screen.getByRole('status')).toHaveTextContent(MESSAGES.FEATURE_UNAVAILABLE);
    expect(fields.terms).not.toBeChecked();
    expect(fields.fullName).toHaveValue(VALID.fullName);
  });

  it('US3-4: la casilla se marca con la barra espaciadora', async () => {
    const { user, fields } = setup();
    fields.terms.focus();
    await user.keyboard(' ');
    expect(fields.terms).toBeChecked();
  });
});

describe('RegisterForm · US4 Ir a iniciar sesión', () => {
  it('US4-1: "Inicia sesión" llama a onNavigateLogin y no registra', async () => {
    const { user, stub, onNavigateLogin } = setup();
    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(onNavigateLogin).toHaveBeenCalledOnce();
    expect(stub.register).not.toHaveBeenCalled();
  });
});

describe('RegisterForm · US6 Mostrar u ocultar las contraseñas', () => {
  /** Control de visibilidad n-ésimo (0 = contraseña, 1 = confirmación), en cualquier estado. */
  const visibilityToggle = (index: number) => {
    const toggle = screen.getAllByRole('button', { name: /^(Mostrar|Ocultar) contraseña$/ })[index];
    if (!toggle) throw new Error(`No existe el control de visibilidad ${index}`);
    return toggle;
  };

  it('US6-1 / US6-2: el control muestra y oculta la contraseña', async () => {
    const { user, fields } = setup();
    const toggle = visibilityToggle(0);
    await user.click(toggle);
    expect(fields.password).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAccessibleName('Ocultar contraseña');
    await user.click(toggle);
    expect(fields.password).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAccessibleName('Mostrar contraseña');
  });

  it('US6-3: cada campo tiene su propio control', async () => {
    const { user, fields } = setup();
    await user.click(visibilityToggle(0));
    expect(fields.password).toHaveAttribute('type', 'text');
    expect(fields.confirmPassword).toHaveAttribute('type', 'password');
    await user.click(visibilityToggle(1));
    expect(fields.confirmPassword).toHaveAttribute('type', 'text');
  });

  it('US6-4: los controles tienen aria-pressed y se alcanzan con tab', async () => {
    const { user, fields } = setup();
    const toggles = screen.getAllByRole('button', { name: 'Mostrar contraseña' });
    expect(toggles).toHaveLength(2);
    for (const toggle of toggles) expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(fields.password);
    await user.tab();
    expect(toggles[0]).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(toggles[1]).toHaveFocus();
  });
});

describe('RegisterForm · US7 Registro con Google y Apple no disponible', () => {
  it.each(['Google', 'Apple'])(
    'US7-1 / US7-2: "%s" muestra "Próximamente" y conserva los datos',
    async (provider) => {
      const onComingSoon = vi.fn();
      const { user, stub, fields } = setup(createRegisterStub(), { onComingSoon });
      await user.type(fields.fullName, VALID.fullName);
      await user.click(screen.getByRole('button', { name: provider }));
      expect(onComingSoon).toHaveBeenCalledOnce();
      expect(onComingSoon).toHaveBeenCalledWith('Próximamente');
      expect(fields.fullName).toHaveValue(VALID.fullName);
      expect(stub.register).not.toHaveBeenCalled();
    },
  );

  it('FR-015: sin onComingSoon usa la alerta nativa del navegador', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Google' }));
    expect(alert).toHaveBeenCalledWith('Próximamente');
    alert.mockRestore();
  });
});

describe('RegisterForm · teclado (FR-018)', () => {
  it('orden de tabulación según contracts/ui-register.md', async () => {
    const { user, fields } = setup();
    const toggles = screen.getAllByRole('button', { name: 'Mostrar contraseña' });
    const expected = [
      fields.fullName,
      fields.email,
      fields.password,
      toggles[0],
      fields.confirmPassword,
      toggles[1],
      fields.terms,
      screen.getByRole('button', { name: 'términos y condiciones' }),
      screen.getByRole('button', { name: 'Crear cuenta' }),
      screen.getByRole('button', { name: 'Google' }),
      screen.getByRole('button', { name: 'Apple' }),
      screen.getByRole('button', { name: 'Inicia sesión' }),
    ];
    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });
});
