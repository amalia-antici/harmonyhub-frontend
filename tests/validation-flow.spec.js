import { test, expect } from '@playwright/test';

test('User sees errors on empty submit and can fix them', async ({ page }) => {
  await page.goto('http://localhost:5173/create');

  //submit empty form 
  await page.getByRole('button', { name: /Add event/i }).click();

  await expect(page.getByText(/Title is required/i)).toBeVisible();
  await expect(page.getByText(/City is required/i)).toBeVisible();

  //fix just one error
  await page.getByLabel(/Title:/i).fill('Recovery Concert');
  
  await page.getByRole('button', { name: /Add event/i }).click();
  await expect(page.getByText(/Title is required/i)).not.toBeVisible();
  await expect(page.getByText(/City is required/i)).toBeVisible(); // Still there!
});