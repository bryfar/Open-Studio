import { expect, test } from '@playwright/test';

test('clip-generator analyze + generate flow', async ({ page }) => {
  let jobsCalls = 0;

  await page.route('**/api/clip-generator/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ job_id: 'clip-analyze-1' }),
    });
  });

  await page.route('**/api/clip-generator/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ job_id: 'clip-generate-1' }),
    });
  });

  await page.route('**/api/jobs/*', async (route) => {
    jobsCalls += 1;
    if (jobsCalls < 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'clip-generate-1',
          status: 'processing',
          logs: ['Queued clip generation job.'],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'clip-generate-1',
        status: 'complete',
        logs: ['Clip generation complete.'],
        result: {
          artifacts: [{ name: 'clip_1.mp4', url: '/artifacts/clip-generate-1/clip_1.mp4' }],
        },
      }),
    });
  });

  await page.goto('/clip-generator');
  await expect(page.getByRole('heading', { name: 'Clip Generator' })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'source.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('fake-video'),
  });
  await page.getByRole('button', { name: 'Analyze' }).click();
  await page.getByRole('button', { name: 'Generate Clips' }).click();

  await expect(page.getByText('Completado')).toBeVisible();
  await expect(page.getByRole('link', { name: 'clip_1.mp4' })).toBeVisible();
});
