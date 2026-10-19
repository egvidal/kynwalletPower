import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Register } from '@/application/register';
import { validateRegistration, type RegistrationErrors } from '@/domain/registration';
import {
  initialRegisterState,
  registerReducer,
  type Field,
  type TextField,
} from './registerReducer';

export function useRegisterForm(register: Register, onRegistered: () => void) {
  const [state, dispatch] = useReducer(registerReducer, initialRegisterState);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const change = useCallback((field: TextField, value: string) => {
    dispatch({ type: 'change', field, value });
  }, []);

  const blur = useCallback((field: Field) => dispatch({ type: 'blur', field }), []);

  const toggleTerms = useCallback(
    (checked: boolean) => dispatch({ type: 'toggleTerms', checked }),
    [],
  );

  const showNotice = useCallback(
    (message: string) => dispatch({ type: 'showNotice', message }),
    [],
  );

  /** Valida y, si procede, registra. Devuelve los errores para que la vista gestione el foco. */
  const submit = useCallback((): RegistrationErrors => {
    if (inFlight.current) return {};
    const errors = validateRegistration(state.values);
    dispatch({ type: 'submit' });
    if (Object.keys(errors).length > 0) return errors;

    inFlight.current = true;
    void register(state.values).then((result) => {
      inFlight.current = false;
      if (!mounted.current) return;
      if (result.kind === 'success') onRegistered();
      else dispatch({ type: 'result', result });
    });
    return {};
  }, [register, onRegistered, state.values]);

  return { state, change, blur, toggleTerms, showNotice, submit };
}
