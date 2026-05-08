import { expect, test } from '@playwright/test';

test('editor shows subtitle native tools and interchange export action', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Subtítulos' }).click();
  const subtitlePanel = page.locator('div').filter({ hasText: 'Subtítulos nativos (cues) con import/export SRT/VTT.' }).first();
  await expect(subtitlePanel).toBeVisible();
  await expect(page.getByPlaceholder('Pega aquí SRT/VTT o usa Export para generarlo...')).toBeVisible();
  await expect(page.getByText('Cues actuales:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'OTIO/MLT', exact: true })).toBeVisible();
});

test('timeline supports creating and selecting markers', async ({ page }) => {
  await page.goto('/editor');
  const addMarkerButton = page.getByTitle('Agregar marcador en cabezal (Shift+M)');
  await addMarkerButton.scrollIntoViewIfNeeded();
  await addMarkerButton.dispatchEvent('click');
  await expect(page.getByTitle(/Marker 1/)).toBeVisible();
});

test('timeline pro exposes snap target toggles', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Timeline Pro' }).click();
  await expect(page.getByText('Snap targets')).toBeVisible();
  await expect(page.getByLabel('Clip edges')).toBeVisible();
  await expect(page.getByLabel('Markers')).toBeVisible();
  await expect(page.getByLabel('Regions')).toBeVisible();
});

test('header exposes interchange import action', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByRole('button', { name: 'Import OTIO/MLT' })).toBeVisible();
});

test('multicam panel exposes sync and angle cut workflow', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Multicam' }).click();
  await expect(page.getByRole('button', { name: 'Sincronizar offsets de cámara' })).toBeVisible();
  await expect(page.getByText('Cámara activa: Cam 1')).toBeVisible();
  await page.getByRole('button', { name: 'Insertar angle cut en playhead' }).click();
  await expect(page.getByText('Cortes: 1')).toBeVisible();
});

test('timeline enforces multipista guards for ripple and locked split', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/editor');

  const addVideo = page.getByTitle('Agregar clip de vídeo');
  await addVideo.scrollIntoViewIfNeeded();
  for (let i = 0; i < 3; i++) {
    await addVideo.click();
  }

  const initialLefts = await page.evaluate(() => {
    const clipNodes = Array.from(document.querySelectorAll('div')).filter((el) => {
      const style = (el as HTMLElement).style;
      if (!style.left || !style.width) return false;
      const label = el.querySelector('span');
      return Boolean(label?.textContent?.includes('Vídeo'));
    });
    return clipNodes
      .map((el) => parseFloat((el as HTMLElement).style.left || '0'))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  });
  expect(initialLefts.length).toBeGreaterThanOrEqual(3);
  for (let i = 1; i < initialLefts.length; i++) {
    expect(initialLefts[i]).toBeGreaterThan(initialLefts[i - 1]);
  }

  await page.getByTitle('Herramientas de timeline').click();
  await page.getByRole('button', { name: 'Ripple', exact: true }).click({ force: true });

  const videoLabels = page.locator('span').filter({ hasText: 'Vídeo' });
  await videoLabels.nth(0).click();
  await videoLabels.nth(1).click({ modifiers: ['Control'] });
  await page.keyboard.press('Delete');

  const afterDeleteLefts = await page.evaluate(() => {
    const clipNodes = Array.from(document.querySelectorAll('div')).filter((el) => {
      const style = (el as HTMLElement).style;
      if (!style.left || !style.width) return false;
      const label = el.querySelector('span');
      return Boolean(label?.textContent?.includes('Vídeo'));
    });
    return clipNodes
      .map((el) => parseFloat((el as HTMLElement).style.left || '0'))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  });
  expect(afterDeleteLefts.length).toBeGreaterThanOrEqual(1);
  expect(afterDeleteLefts.length).toBeLessThan(initialLefts.length);
  for (let i = 1; i < afterDeleteLefts.length; i++) {
    expect(afterDeleteLefts[i]).toBeGreaterThan(afterDeleteLefts[i - 1]);
  }

  const beforeSplitCount = await videoLabels.count();
  await page.getByTitle('Bloquear pista').first().click();
  await page.keyboard.press('KeyS');
  const afterSplitCount = await videoLabels.count();
  expect(afterSplitCount).toBe(beforeSplitCount);
});
