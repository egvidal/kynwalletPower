import { expect, test, type Page } from '@playwright/test';

/** Posición vertical del titular y de la tarjeta del panel de marca. */
async function brandPositions(page: Page, path: string) {
  await page.goto(path);
  const panel = page.locator('header');
  const headline = await panel.locator('p').first().boundingBox();
  const card = await panel.locator('[aria-hidden="true"]').boundingBox();
  if (!headline || !card) throw new Error(`Panel de marca no visible en ${path}`);
  return { headline: Math.round(headline.y), card: Math.round(card.y) };
}

test.describe('Panel de marca (T058)', () => {
  for (const height of [1024, 800, 700, 600]) {
    test(`T058: titular y tarjeta a la misma altura en login y registro (1440 × ${height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height });
      const login = await brandPositions(page, '/login');
      const register = await brandPositions(page, '/register');
      expect(register).toEqual(login);
    });
  }

  test('T058: al desplazar el registro en una ventana baja, el panel queda fijo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto('/register');
    const before = await page.locator('header').boundingBox();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const after = await page.locator('header').boundingBox();
    // Tolerancia de 1px por el redondeo subpíxel del desplazamiento.
    expect(Math.abs((after?.y ?? Infinity) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(after?.height).toBe(before?.height);
  });
});
