import { expect, test, type Page } from '@playwright/test';

// Ścieżka Kasi (docs/SPEC.md §1, §10). Test szkieletu działa zawsze; testy modułów same się
// włączają, gdy moduł trafi na main (atrapa „Moduł w budowie” = pominięcie z adnotacją).

async function onboarding(page: Page) {
  await page.goto('/');
  await page.getByLabel('Dom').fill('Grochowska 200');
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Pobierz paczkę offline' }).click();
  await expect(page.getByText(/Paczka offline z dnia/)).toBeVisible({ timeout: 90_000 });
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await mapaGotowa(page);
}

async function mapaGotowa(page: Page) {
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(page.locator('.mapa-stan')).toHaveCount(0, { timeout: 60_000 });
}

async function otworzModul(page: Page, nazwa: string) {
  await page.getByRole('navigation', { name: 'Moduły' }).getByRole('button', { name: nazwa }).click();
  const panel = page.getByRole('region', { name: nazwa });
  test.skip(await panel.getByText('Moduł w budowie').isVisible(), `moduł „${nazwa}” jeszcze nie jest na main`);
  return panel;
}

test('szkielet: onboarding, paczka offline, mapa działa po odświeżeniu bez sieci', async ({ page, context }) => {
  await onboarding(page);
  await expect(page.getByRole('combobox', { name: 'Wybrane miejsce' })).toContainText('Grochowska 200');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: /^Offline/ })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Wybrane miejsce' })).toContainText('Grochowska 200');
  await mapaGotowa(page);
});

test('?offline=1 pokazuje tryb offline mimo sieci', async ({ page }) => {
  await onboarding(page);
  await page.goto('/?offline=1');
  await expect(page.getByRole('status').filter({ hasText: 'Offline (symulacja)' })).toBeVisible();
  await mapaGotowa(page);
});

test('Syreny: wynik dla adresu, także offline', async ({ page, context }) => {
  await onboarding(page);
  const panel = await otworzModul(page, 'Syreny');
  await expect(panel.getByTestId('wynik-syreny')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect((await otworzModul(page, 'Syreny')).getByTestId('wynik-syreny')).toBeVisible();
});

test('Pomoc: 3 najbliższe punkty, także offline', async ({ page, context }) => {
  await onboarding(page);
  const panel = await otworzModul(page, 'Pomoc');
  const lista = panel.getByTestId('lista-punktow');
  test.skip(!(await lista.isVisible({ timeout: 10_000 }).catch(() => false)), 'brak paczki punktów (O3-B1) na main');
  await expect(lista.getByRole('listitem')).toHaveCount(3);
  await context.setOffline(true);
  await page.reload();
  await expect((await otworzModul(page, 'Pomoc')).getByTestId('lista-punktow').getByRole('listitem')).toHaveCount(3);
});

test('Dojazd: karta dla pary adresów', async ({ page }) => {
  await onboarding(page);
  const panel = await otworzModul(page, 'Dojazd');
  await expect(panel).not.toBeEmpty();
});

test('Na żywo: bez sieci nigdy pusty panel', async ({ page, context }) => {
  await onboarding(page);
  await otworzModul(page, 'Na żywo');
  await context.setOffline(true);
  await page.reload();
  const panel = await otworzModul(page, 'Na żywo');
  await expect(panel.getByText(/stan na|brak sieci/i).first()).toBeVisible();
});
