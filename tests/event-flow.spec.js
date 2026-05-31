import { test, expect } from '@playwright/test';

test('User can create an event and see it in the list', async ({ page }) => {
  await page.goto('http://localhost:5173/create');

  await page.getByLabel(/Title:/i).fill('Playwright Party');
  await page.getByLabel(/City:/i).fill('Cluj');
  await page.locator('input[type="datetime-local"]').fill('2026-12-31T20:00');

  await page.getByRole('button', { name: /Add event/i }).click();

  await expect(page).toHaveURL(/.*events/);
  await expect(page.getByText('Playwright Party')).toBeVisible();
});