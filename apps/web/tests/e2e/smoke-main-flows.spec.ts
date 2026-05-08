import { expect, test } from '@playwright/test';

test('smoke dashboard route', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard de Open Studio' })).toBeVisible();
});

test('smoke editor route', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText('Open Studio').first()).toBeVisible();
});

test('smoke clip-generator route', async ({ page }) => {
  await page.goto('/clip-generator');
  await expect(page.getByRole('heading', { name: 'Clip Generator' })).toBeVisible();
});

test('smoke ai-shorts route', async ({ page }) => {
  await page.goto('/ai-shorts');
  await expect(page.getByRole('heading', { name: 'AI Shorts' })).toBeVisible();
});
