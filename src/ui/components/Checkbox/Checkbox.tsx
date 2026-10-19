import { useId, type ReactNode, type Ref } from 'react';
import styles from './Checkbox.module.css';

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  error?: string;
  /** Contenido interactivo junto a la etiqueta, fuera del <label> (research.md R9). */
  addon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function Checkbox({ label, checked, onChange, onBlur, error, addon, ref }: CheckboxProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const addonId = `${id}-addon`;
  const errorId = `${id}-error`;
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <input
          id={id}
          ref={ref}
          type="checkbox"
          className={[styles.box, error && styles.invalid].filter(Boolean).join(' ')}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={onBlur}
          // Con addon, el nombre accesible es etiqueta + addon ("Acepto los términos y condiciones").
          aria-labelledby={addon ? `${labelId} ${addonId}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <label id={labelId} htmlFor={id} className={styles.label}>
          {label}
        </label>
        {addon && (
          <span id={addonId} className={styles.addon}>
            {addon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
