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

// Karta po id; atrapa z V1 („Karta w budowie.”) pomija test, prawdziwa karta go uruchamia.
async function karta(page: Page, id: string) {
  const k = page.getByTestId(`karta-${id}`);
  await expect(k).toBeVisible({ timeout: 30_000 });
  test.skip(await k.getByText('Karta w budowie.').isVisible(), `karta „${id}” jest jeszcze atrapą`);
  return k;
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

test('Syreny: karta z wynikiem w dB, także offline', async ({ page, context }) => {
  await onboarding(page);
  await expect(await karta(page, 'syreny')).toContainText('dB');
  await context.setOffline(true);
  await page.reload();
  await expect(await karta(page, 'syreny')).toContainText('dB');
});

test('Miejsce schronienia: klik pokazuje trasę, także offline', async ({ page, context }) => {
  await onboarding(page);
  let k = await karta(page, 'schronienie');
  await k.getByRole('button').first().click();
  await expect(k.getByRole('status')).toContainText(/pieszo ok\. \d+ min/);
  await context.setOffline(true);
  await page.reload();
  k = await karta(page, 'schronienie');
  await k.getByRole('button').first().click();
  await expect(k.getByRole('status')).toContainText(/pieszo ok\. \d+ min/);
});

test('Pomoc medyczna, powietrze, bliscy: karta zawsze ma treść (także bez sieci)', async ({ page, context }) => {
  await onboarding(page);
  await context.setOffline(true);
  await page.reload();
  for (const id of ['medyczna', 'powietrze', 'bliscy']) {
    await expect(page.getByTestId(`karta-${id}`).locator('.karta-tekst')).not.toBeEmpty({ timeout: 30_000 });
  }
});

test('kafelek włącza i wyłącza warstwę', async ({ page }) => {
  await onboarding(page);
  const kafelek = page.getByRole('navigation', { name: 'Warstwy na mapie' }).getByRole('button', { name: 'AED' });
  test.skip(!(await kafelek.isVisible().catch(() => false)), 'kafelki O3 (P4) jeszcze nie na main');
  await kafelek.click();
  await expect(kafelek).toHaveAttribute('aria-pressed', 'true');
  await kafelek.click();
  await expect(kafelek).toHaveAttribute('aria-pressed', 'false');
});

// Pełna ścieżka demo na czystym profilu: lokalizacja z parametru → sprawdzanie połączenia (pobranie paczki)
// → 5 kart → okręgi syren → trasa do miejsca schronienia → po odświeżeniu bez sieci karty nadal są.
// W `vite preview` nie ma /api/live/*, więc trasa jest w linii prostej; asercje pasują do obu wariantów.
test('demo: lokalizacja → sprawdzanie połączenia → karty → okręgi syren → trasa → offline', async ({ page, context }) => {
  const bledyRysowania: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && m.text().includes('[karta] nie udało się narysować')) bledyRysowania.push(m.text());
  });

  await page.goto('/?lokalizacja=52.2457,21.0874');
  await page.getByRole('button', { name: 'Użyj mojej lokalizacji' }).click();
  // Ekran V3: „Sprawdzam połączenie…”, potem „Jest połączenie…” (z pobieraniem paczki na czystym profilu).
  await expect(page.getByRole('status').filter({ hasText: /Sprawdzam połączenie|Jest połączenie/ })).toBeVisible({ timeout: 30_000 });
  await mapaGotowa(page);
  await expect(page.getByRole('combobox', { name: 'Wybrane miejsce' })).toContainText('Lokalizacja');

  const karty = page.getByRole('region', { name: 'Twoja sytuacja' }).locator('[data-testid^="karta-"]');
  await expect(karty).toHaveCount(5, { timeout: 30_000 });
  expect(await karty.evaluateAll((el) => el.map((e) => e.getAttribute('data-testid')))).toEqual([
    'karta-syreny',
    'karta-schronienie',
    'karta-medyczna',
    'karta-powietrze',
    'karta-bliscy',
  ]);
  await expect(page.getByRole('navigation', { name: 'Moduły' })).toHaveCount(0);

  // Syreny: rozwinięcie rysuje okręgi na mapie (rysowanie jest w akcji „Pokaż na mapie”, opis okręgów w szczegółach).
  const syreny = await karta(page, 'syreny');
  await syreny.getByRole('button').first().click();
  await expect(syreny.getByText(/Syrena (cyfrowa|analogowa), .+ od Ciebie: (mieścisz się w okręgu \d+ dB|jesteś poza jej okręgiem 65 dB)\./).first()).toBeVisible();
  await expect(syreny.getByRole('button', { name: 'Pokaż na mapie' })).toBeVisible();

  // Miejsce schronienia: klik pokazuje opis trasy (karta Syreny się zwija, mapa czyści okręgi).
  const schronienie = await karta(page, 'schronienie');
  await schronienie.getByRole('button').first().click();
  await expect(schronienie.getByRole('status')).toContainText(/pieszo ok\. \d+ min/, { timeout: 15_000 });

  // Offline: te same 5 kart z zapisanej paczki, nadal bez menu modułów.
  await context.setOffline(true);
  await page.reload();
  await expect(karty).toHaveCount(5, { timeout: 30_000 });
  await expect(karty.first()).toHaveAttribute('data-testid', 'karta-syreny');
  await expect(page.getByRole('navigation', { name: 'Moduły' })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: /^Offline/ })).toBeVisible();

  expect(bledyRysowania).toEqual([]);
});
