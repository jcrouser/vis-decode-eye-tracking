/* eslint-disable no-await-in-loop */
import { test, expect } from '@playwright/test';
import { nextClick, resetClientStudyState } from './utils';

test('pilot allows committed selections and limits feedback to practice', async ({ page }) => {
  await resetClientStudyState(page);
  await page.goto('/vis-decode-eye-tracking');
  await expect(page.getByRole('heading', { name: 'Visual decoding pilot', exact: true })).toBeVisible();
  await nextClick(page);
  for (let block = 0; block < 5; block += 1) {
    for (let trial = 0; trial < 8; trial += 1) {
      const next = page.getByRole('button', { name: 'Next', exact: true });
      await expect(next).toBeDisabled();
      const slider = page.locator('[data-source="slider-check"]');
      await expect(slider).toBeVisible();
      await slider.click({ position: { x: 260, y: 8 } });
      await expect(next).toBeEnabled();
      const feedback = page.getByRole('button', { name: 'Show target' });
      if (trial < 2) {
        await feedback.click();
        await expect(page.locator('line[stroke="#238443"]')).toBeVisible();
      } else {
        await expect(feedback).toHaveCount(0);
      }
      await nextClick(page);
    }
  }
  await expect(page.getByRole('heading', { name: 'Pilot complete', exact: true })).toBeVisible();
});
