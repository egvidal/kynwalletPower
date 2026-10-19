import { expect, test } from '@playwright/test';

const SECRETS = {
  fullName: 'Zoe Secreta',
  email: 'zoe@secreto.test',
  password: 'ClaveSecreta123',
};

test.describe('Registro en navegador real (002)', () => {
  test('US5-1: en escritorio se ven los dos paneles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/register');
    await expect(page.getByText('Comienza tu')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeVisible();
  });

  for (const width of [375, 320]) {
    test(`US5-2 / US5-3: a ${width}px solo el formulario con el logo y sin scroll horizontal`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/register');
      await expect(page.getByText('KynWallet')).toBeVisible();
      await expect(page.getByText('Comienza tu')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }

  test('US5-4: los datos se conservan al pasar de escritorio a móvil', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/register');
    await page.getByLabel('Nombre completo').fill('Diego Martínez');
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.getByLabel('Nombre completo')).toHaveValue('Diego Martínez');
  });

  test('US7 / FR-015: Google y Apple abren la alerta nativa "Próximamente"', async ({ page }) => {
    const messages: string[] = [];
    page.on('dialog', async (dialog) => {
      messages.push(`${dialog.type()}:${dialog.message()}`);
      await dialog.accept();
    });
    await page.goto('/register');
    await page.getByRole('button', { name: 'Google' }).click();
    await page.getByRole('button', { name: 'Apple' }).click();
    expect(messages).toEqual(['alert:Próximamente', 'alert:Próximamente']);
    await expect(page).toHaveURL(/\/register$/);
  });

  test('US1 / FR-012 / FR-023: registro completo → /login con aviso y evento sin datos personales', async ({
    page,
  }) => {
    const consoleLines: string[] = [];
    page.on('console', (message) => consoleLines.push(message.text()));

    await page.goto('/register');
    await page.getByLabel('Nombre completo').fill(SECRETS.fullName);
    await page.getByLabel('Correo electrónico').fill(SECRETS.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(SECRETS.password);
    await page.getByLabel('Confirmar contraseña').fill(SECRETS.password);
    await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones' }).check();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText(
      'Cuenta creada con éxito. Ya puedes iniciar sesión.',
    );

    const events = consoleLines
      .filter((line) => line.includes('"event"'))
      .map((line) => JSON.parse(line) as { event: string });
    expect(events.map((entry) => entry.event)).toEqual(['registration.succeeded']);
    const allConsole = consoleLines.join('\n').toLowerCase();
    for (const secret of Object.values(SECRETS)) {
      expect(allConsole).not.toContain(secret.toLowerCase());
    }

    // US1-5: el aviso es de un solo uso.
    await page.reload();
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
