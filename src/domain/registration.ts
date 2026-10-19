import { MESSAGES } from './messages';
import { validateEmail, validatePassword } from './validation';

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;

/** Datos del formulario tal como los escribe el usuario (data-model.md). */
export type RegistrationData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type RegistrationErrors = Partial<Record<keyof RegistrationData, string>>;

/** Cuenta normalizada que el caso de uso entrega al puerto de registro. */
export type NewAccount = {
  fullName: string;
  email: string;
  password: string;
};

export type RegistrationResult =
  { kind: 'success' } | { kind: 'invalid'; errors: RegistrationErrors } | { kind: 'unavailable' };

function validateFullName(fullName: string): string | undefined {
  const trimmed = fullName.trim();
  if (trimmed === '') return MESSAGES.FULL_NAME_REQUIRED;
  if (trimmed.length < FULL_NAME_MIN_LENGTH) return MESSAGES.FULL_NAME_TOO_SHORT;
  if (trimmed.length > FULL_NAME_MAX_LENGTH) return MESSAGES.FULL_NAME_TOO_LONG;
  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  // Comparación exacta, sin recortar (FR-007).
  if (confirmPassword === '') return MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  if (confirmPassword !== password) return MESSAGES.PASSWORDS_DO_NOT_MATCH;
  return undefined;
}

/** Reglas de FR-004 a FR-008. Devuelve {} si los datos son válidos. */
export function validateRegistration(data: RegistrationData): RegistrationErrors {
  const candidates: RegistrationErrors = {
    fullName: validateFullName(data.fullName),
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
    acceptedTerms: data.acceptedTerms ? undefined : MESSAGES.TERMS_REQUIRED,
  };
  const errors: RegistrationErrors = {};
  for (const [field, message] of Object.entries(candidates) as [
    keyof RegistrationData,
    string | undefined,
  ][]) {
    if (message) errors[field] = message;
  }
  return errors;
}
