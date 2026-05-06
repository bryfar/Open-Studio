import { expect, test } from '@playwright/test';

test.describe('Editor smoke flow', () => {
  test('dashboard and editor render key controls', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Projects')).toBeVisible();

    await page.goto('/editor');
    const header = page.getByRole('banner');
    await expect(header.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Record' })).toBeVisible();
    await expect(page.getByText('multimedia', { exact: false })).toBeVisible();
  });

  test('timeline accepts keyboard controls', async ({ page }) => {
    await page.goto('/editor');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    await expect(page.getByText('/')).toBeVisible();
  });
});
