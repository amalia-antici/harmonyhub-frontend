import { test, expect } from '@playwright/test';

test('User can edit an existing event and see updated details', async ({ page }) => {
  await page.goto('http://localhost:5173/events');

  //find the first Edit button directly
  await page.getByRole('button', { name: /Edit/i }).first().click();

  //change the title
  const titleInput = page.getByLabel(/Title:/i);
  await titleInput.clear();
  await titleInput.fill('Updated Magic Show');

  //save changes
  await page.getByRole('button', { name: /Update event/i }).click();

  //verify the list
  await expect(page.getByText('Updated Magic Show')).toBeVisible();
});