import { expect, test, type Page } from '@playwright/test';

// Ścieżka Kasi (docs/SPEC.md §1, §10). Ekran główny V4: mapa, kafelki warstw i karty „Twoja sytuacja”
// (atrapa karty ma tekst „Karta w budowie.”, prawdziwe karty podmieniają ją bez zmiany testu).

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

test('Twoja sytuacja: 5 kart w kolejności, bez menu modułów, także offline', async ({ page, context }) => {
  await onboarding(page);
  const karty = page.getByRole('region', { name: 'Twoja sytuacja' }).locator('[data-testid^="karta-"]');
  await expect(karty).toHaveCount(5, { timeout: 30_000 });
  await expect(karty.first()).toHaveAttribute('data-testid', 'karta-syreny');
  await expect(page.getByRole('navigation', { name: 'Moduły' })).toHaveCount(0);

  await context.setOffline(true);
  await page.reload();
  await expect(karty).toHaveCount(5, { timeout: 30_000 });
  await expect(karty.first()).toHaveAttribute('data-testid', 'karta-syreny');
});

test('klik w kartę z trasą pokazuje opis trasy, drugi klik go chowa', async ({ page }) => {
  await onboarding(page);
  const karta = page.getByTestId('karta-schronienie');
  const glowna = karta.getByRole('button', { name: /miejsce schronienia według PSP/ });
  await expect(glowna).toBeVisible({ timeout: 30_000 });
  await glowna.click();
  await expect(karta.getByRole('status')).toHaveText(/po ulicach|w linii prostej/, { timeout: 15_000 });
  await glowna.click();
  await expect(karta.getByRole('status')).toHaveCount(0);
});
