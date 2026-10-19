import {
  validateRegistration,
  type RegistrationData,
  type RegistrationErrors,
  type RegistrationResult,
} from '@/domain/registration';

export type Field = keyof RegistrationData;
export type TextField = Exclude<Field, 'acceptedTerms'>;

export type RegisterFormState = {
  status: 'editing' | 'submitting' | 'failed';
  values: RegistrationData;
  touched: Record<Field, boolean>;
  fieldErrors: RegistrationErrors;
  notice: string | null;
  failure: boolean;
};

export type RegisterAction =
  | { type: 'change'; field: TextField; value: string }
  | { type: 'blur'; field: Field }
  | { type: 'toggleTerms'; checked: boolean }
  | { type: 'showNotice'; message: string }
  | { type: 'submit' }
  | { type: 'result'; result: RegistrationResult };

const untouched: Record<Field, boolean> = {
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
  acceptedTerms: false,
};

const allTouched: Record<Field, boolean> = {
  fullName: true,
  email: true,
  password: true,
  confirmPassword: true,
  acceptedTerms: true,
};

export const initialRegisterState: RegisterFormState = {
  status: 'editing',
  values: { fullName: '', email: '', password: '', confirmPassword: '', acceptedTerms: false },
  touched: untouched,
  fieldErrors: {},
  notice: null,
  failure: false,
};

/** Errores visibles: solo los de campos ya tocados (FR-009). */
function visibleErrors(
  values: RegistrationData,
  touched: Record<Field, boolean>,
): RegistrationErrors {
  const errors = validateRegistration(values);
  const visible: RegistrationErrors = {};
  for (const field of Object.keys(errors) as Field[]) {
    if (touched[field]) visible[field] = errors[field];
  }
  return visible;
}

/** Cambia valores y recalcula los errores visibles; sale del estado de fallo (data-model.md). */
function withValues(state: RegisterFormState, values: RegistrationData): RegisterFormState {
  return {
    ...state,
    status: state.status === 'failed' ? 'editing' : state.status,
    failure: false,
    values,
    // Incluye la confirmación cuando cambia la contraseña (US2-5).
    fieldErrors: visibleErrors(values, state.touched),
  };
}

/** Máquina de estados del formulario de registro (data-model.md, RegisterFormState). */
export function registerReducer(
  state: RegisterFormState,
  action: RegisterAction,
): RegisterFormState {
  switch (action.type) {
    case 'change':
      return withValues(state, { ...state.values, [action.field]: action.value });

    case 'toggleTerms':
      return withValues(state, { ...state.values, acceptedTerms: action.checked });

    case 'blur': {
      const touched = { ...state.touched, [action.field]: true };
      return { ...state, touched, fieldErrors: visibleErrors(state.values, touched) };
    }

    case 'showNotice':
      return { ...state, notice: action.message };

    case 'submit': {
      if (state.status === 'submitting') return state;
      const fieldErrors = visibleErrors(state.values, allTouched);
      // FR-010: no se registra mientras existan errores de validación.
      const status = Object.keys(fieldErrors).length > 0 ? 'editing' : 'submitting';
      return { ...state, status, touched: allTouched, fieldErrors, notice: null, failure: false };
    }

    case 'result':
      switch (action.result.kind) {
        case 'success':
          // La pantalla se abandona (onRegistered); el botón sigue ocupado hasta entonces.
          return state;
        case 'invalid':
          return {
            ...state,
            status: 'editing',
            touched: allTouched,
            fieldErrors: action.result.errors,
          };
        case 'unavailable':
          // Caso límite: los datos escritos se conservan, contraseñas incluidas.
          return { ...state, status: 'failed', failure: true };
      }
  }
}
