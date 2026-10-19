import { MESSAGES } from '@/domain/messages';
import {
  initialRegisterState,
  registerReducer,
  type RegisterAction,
  type RegisterFormState,
} from './registerReducer';

const run = (actions: RegisterAction[], state: RegisterFormState = initialRegisterState) =>
  actions.reduce(registerReducer, state);

const fillValid: RegisterAction[] = [
  { type: 'change', field: 'fullName', value: 'Diego Martínez' },
  { type: 'change', field: 'email', value: 'diego@example.test' },
  { type: 'change', field: 'password', value: 'secreto-123' },
  { type: 'change', field: 'confirmPassword', value: 'secreto-123' },
  { type: 'toggleTerms', checked: true },
];

describe('registerReducer · US1 (data-model.md)', () => {
  it('change y toggleTerms actualizan los valores', () => {
    const state = run(fillValid);
    expect(state.values).toEqual({
      fullName: 'Diego Martínez',
      email: 'diego@example.test',
      password: 'secreto-123',
      confirmPassword: 'secreto-123',
      acceptedTerms: true,
    });
    expect(state.fieldErrors).toEqual({});
  });

  it('submit sin errores pasa a submitting y limpia notice y failure', () => {
    const state = run([
      ...fillValid,
      { type: 'showNotice', message: MESSAGES.FEATURE_UNAVAILABLE },
      { type: 'submit' },
    ]);
    expect(state.status).toBe('submitting');
    expect(state.notice).toBeNull();
    expect(state.failure).toBe(false);
  });

  it('US1-2: submit se ignora si ya está submitting', () => {
    const submitting = run([...fillValid, { type: 'submit' }]);
    expect(registerReducer(submitting, { type: 'submit' })).toBe(submitting);
  });

  it('US2-1: submit con errores sigue en editing y marca todo como tocado', () => {
    const state = run([{ type: 'submit' }]);
    expect(state.status).toBe('editing');
    expect(Object.values(state.touched).every(Boolean)).toBe(true);
    expect(state.fieldErrors).toEqual({
      fullName: MESSAGES.FULL_NAME_REQUIRED,
      email: MESSAGES.EMAIL_REQUIRED,
      password: MESSAGES.PASSWORD_REQUIRED,
      confirmPassword: MESSAGES.CONFIRM_PASSWORD_REQUIRED,
      acceptedTerms: MESSAGES.TERMS_REQUIRED,
    });
  });

  it('result(success) mantiene el estado submitting hasta salir de la pantalla', () => {
    const state = run([
      ...fillValid,
      { type: 'submit' },
      { type: 'result', result: { kind: 'success' } },
    ]);
    expect(state.status).toBe('submitting');
  });

  it('FR-021: result(unavailable) → failed y conserva todos los valores', () => {
    const before = run([...fillValid, { type: 'submit' }]);
    const state = registerReducer(before, { type: 'result', result: { kind: 'unavailable' } });
    expect(state.status).toBe('failed');
    expect(state.failure).toBe(true);
    expect(state.values).toEqual(before.values);
  });

  it('result(invalid) → editing, todo tocado y fieldErrors = errors, conservando valores', () => {
    const before = run([...fillValid, { type: 'submit' }]);
    const errors = { email: MESSAGES.EMAIL_INVALID };
    const state = registerReducer(before, { type: 'result', result: { kind: 'invalid', errors } });
    expect(state.status).toBe('editing');
    expect(Object.values(state.touched).every(Boolean)).toBe(true);
    expect(state.fieldErrors).toEqual(errors);
    expect(state.values).toEqual(before.values);
  });
});

describe('registerReducer · US2 validación inline', () => {
  it('FR-009: blur marca el campo como tocado y muestra su error', () => {
    const state = run([{ type: 'blur', field: 'email' }]);
    expect(state.touched.email).toBe(true);
    expect(state.fieldErrors).toEqual({ email: MESSAGES.EMAIL_REQUIRED });
  });

  it('change en un campo no tocado no muestra error', () => {
    const state = run([{ type: 'change', field: 'email', value: 'usuario@' }]);
    expect(state.fieldErrors).toEqual({});
  });

  it('US2-5: cambiar la contraseña reevalúa la confirmación ya tocada', () => {
    const state = run([
      { type: 'change', field: 'password', value: 'secreto-123' },
      { type: 'change', field: 'confirmPassword', value: 'secreto-123' },
      { type: 'blur', field: 'password' },
      { type: 'blur', field: 'confirmPassword' },
      { type: 'change', field: 'password', value: 'secreto-1234' },
    ]);
    expect(state.fieldErrors.confirmPassword).toBe(MESSAGES.PASSWORDS_DO_NOT_MATCH);
  });

  it('US2-6: corregir el valor elimina su error', () => {
    const state = run([
      { type: 'change', field: 'email', value: 'usuario@' },
      { type: 'blur', field: 'email' },
      { type: 'change', field: 'email', value: 'usuario@example.test' },
    ]);
    expect(state.fieldErrors.email).toBeUndefined();
  });

  it('FR-021: un cambio tras un fallo vuelve a editing y limpia failure', () => {
    const failed = run([
      ...fillValid,
      { type: 'submit' },
      { type: 'result', result: { kind: 'unavailable' } },
    ]);
    const state = registerReducer(failed, { type: 'change', field: 'fullName', value: 'Diego M.' });
    expect(state.status).toBe('editing');
    expect(state.failure).toBe(false);
  });
});
