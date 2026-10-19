import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '@/test/a11y';
import { Checkbox } from './Checkbox';

function Controlled() {
  const [checked, setChecked] = useState(false);
  return <Checkbox label="Recordarme" checked={checked} onChange={setChecked} />;
}

describe('Checkbox', () => {
  it('US5-2: casilla con etiqueta que alterna su estado', async () => {
    render(<Controlled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Recordarme' });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(screen.getByText('Recordarme'));
    expect(checkbox).not.toBeChecked();
  });

  it('FR-015: no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<Controlled />);
    await expectNoA11yViolations(container);
  });

  it('R9: con error la casilla es inválida y lo describe', () => {
    render(<Checkbox label="Acepto" checked={false} onChange={() => {}} error="Obligatoria" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Acepto' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('Obligatoria');
  });

  it('R9: el addon completa el nombre accesible sin cambiar la casilla al activarlo', async () => {
    const onChange = vi.fn();
    const onAddon = vi.fn();
    render(
      <Checkbox
        label="Acepto los"
        checked={false}
        onChange={onChange}
        addon={
          <button type="button" onClick={onAddon}>
            términos y condiciones
          </button>
        }
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Acepto los términos y condiciones' });
    await userEvent.click(screen.getByRole('button', { name: 'términos y condiciones' }));
    expect(onAddon).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
    expect(checkbox).not.toBeChecked();
  });

  it('R9: ref apunta al input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Acepto" checked={false} onChange={() => {}} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('checkbox', { name: 'Acepto' }));
  });

  it('R9: con addon y error no tiene violaciones de accesibilidad', async () => {
    const { container } = render(
      <Checkbox
        label="Acepto los"
        checked={false}
        onChange={() => {}}
        error="Obligatoria"
        addon={<button type="button">términos y condiciones</button>}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
