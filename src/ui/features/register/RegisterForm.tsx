import { useRef, type FormEvent } from 'react';
import type { Register } from '@/application/register';
import { MESSAGES } from '@/domain/messages';
import { Alert } from '@/ui/components/Alert/Alert';
import { Button } from '@/ui/components/Button/Button';
import { Checkbox } from '@/ui/components/Checkbox/Checkbox';
import { Divider } from '@/ui/components/Divider/Divider';
import { PasswordField } from '@/ui/components/PasswordField/PasswordField';
import { SocialButton } from '@/ui/components/SocialButton/SocialButton';
import { TextField } from '@/ui/components/TextField/TextField';
import { useRegisterForm } from './useRegisterForm';
import styles from './RegisterForm.module.css';

type RegisterFormProps = {
  register: Register;
  onRegistered: () => void;
  onNavigateLogin: () => void;
  onComingSoon?: (message: string) => void;
};

/** Formulario del frame 04 · Registro (contracts/ui-register.md). */
/** Por defecto, la alerta nativa del navegador (FR-015, research.md R8). */
const nativeAlert = (message: string) => window.alert(message);

export function RegisterForm({
  register,
  onRegistered,
  onNavigateLogin,
  onComingSoon = nativeAlert,
}: RegisterFormProps) {
  const { state, change, blur, toggleTerms, showNotice, submit } = useRegisterForm(
    register,
    onRegistered,
  );
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = submit();
    // FR-010: el foco va al primer control con error, en el orden visual.
    const focusOrder = [
      [errors.fullName, fullNameRef],
      [errors.email, emailRef],
      [errors.password, passwordRef],
      [errors.confirmPassword, confirmPasswordRef],
      [errors.acceptedTerms, termsRef],
    ] as const;
    focusOrder.find(([error]) => error)?.[1].current?.focus();
  };

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h1 className={styles.title} tabIndex={-1}>
          Crea tu cuenta
        </h1>
        <p className={styles.subtitle}>Completa tus datos para comenzar</p>
      </div>

      <TextField
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        placeholder="Ej: Diego Martínez"
        ref={fullNameRef}
        value={state.values.fullName}
        error={state.fieldErrors.fullName}
        onChange={(event) => change('fullName', event.target.value)}
        onBlur={() => blur('fullName')}
      />

      <TextField
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.com"
        ref={emailRef}
        value={state.values.email}
        error={state.fieldErrors.email}
        onChange={(event) => change('email', event.target.value)}
        onBlur={() => blur('email')}
      />

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••"
        ref={passwordRef}
        value={state.values.password}
        error={state.fieldErrors.password}
        onChange={(event) => change('password', event.target.value)}
        onBlur={() => blur('password')}
      />

      <PasswordField
        label="Confirmar contraseña"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••"
        ref={confirmPasswordRef}
        value={state.values.confirmPassword}
        error={state.fieldErrors.confirmPassword}
        onChange={(event) => change('confirmPassword', event.target.value)}
        onBlur={() => blur('confirmPassword')}
      />

      <div className={styles.terms}>
        <Checkbox
          label="Acepto los"
          ref={termsRef}
          checked={state.values.acceptedTerms}
          error={state.fieldErrors.acceptedTerms}
          onChange={toggleTerms}
          onBlur={() => blur('acceptedTerms')}
          addon={
            // FR-017: los términos no tienen contenido en esta demostración.
            <Button variant="link" onClick={() => showNotice(MESSAGES.FEATURE_UNAVAILABLE)}>
              términos y condiciones
            </Button>
          }
        />
      </div>

      {state.failure && <Alert tone="error">{MESSAGES.REGISTRATION_UNAVAILABLE}</Alert>}

      <Button type="submit" loading={state.status === 'submitting'} loadingLabel="Creando cuenta…">
        Crear cuenta
      </Button>

      <div className={styles.divider}>
        <Divider>o regístrate con</Divider>
      </div>

      <div className={styles.social}>
        <SocialButton provider="Google" onClick={() => onComingSoon(MESSAGES.COMING_SOON)} />
        <SocialButton provider="Apple" onClick={() => onComingSoon(MESSAGES.COMING_SOON)} />
      </div>

      {state.notice && <Alert tone="info">{state.notice}</Alert>}

      <p className={styles.footer}>
        ¿Ya tienes cuenta?
        <Button variant="link" onClick={onNavigateLogin}>
          Inicia sesión
        </Button>
      </p>
    </form>
  );
}
