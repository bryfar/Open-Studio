import { expect, test } from '@playwright/test';

test('ai-shorts analyze + generate + publish flow', async ({ page }) => {
  let jobsCalls = 0;

  await page.route('**/api/ai-shorts/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ job_id: 'ai-analyze-1' }),
    });
  });

  await page.route('**/api/ai-shorts/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ job_id: 'ai-generate-1' }),
    });
  });

  await page.route('**/api/publish', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, detail: 'Published successfully.' }),
    });
  });

  await page.route('**/api/jobs/*', async (route) => {
    jobsCalls += 1;
    if (jobsCalls < 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'ai-generate-1',
          status: 'processing',
          logs: ['Generating actor, voice and composition...'],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'ai-generate-1',
        status: 'complete',
        logs: ['AI generate complete.'],
        result: {
          video_url: '/artifacts/ai-generate-1/ai_short.mp4',
          artifacts: [{ path: '/artifacts/ai-generate-1/ai_short.mp4' }],
        },
      }),
    });
  });

  await page.goto('/ai-shorts');
  await expect(page.getByRole('heading', { name: 'AI Shorts' })).toBeVisible();

  await page.getByPlaceholder('Gemini key').fill('gk-test');
  await page.getByPlaceholder('fal.ai key').fill('fk-test');
  await page.getByPlaceholder('ElevenLabs key').fill('ek-test');
  await page.getByPlaceholder('Upload-Post key').fill('up-test');
  await page.getByPlaceholder('Describe your product/business').fill('AI assistant for creators');

  await page.getByRole('button', { name: 'Analyze' }).click();
  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('link', { name: 'Open generated output' })).toBeVisible();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published successfully.')).toBeVisible();
});
