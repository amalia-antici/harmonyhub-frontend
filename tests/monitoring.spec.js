import { test, expect } from '@playwright/test';

test('Monitoring: should store the last viewed event in a cookie', async ({ page, context }) => {
  await page.goto('http://localhost:5173/events');

  const firstEventTitle = page.locator('.event-title').first();
  const eventName = await firstEventTitle.innerText();


  await page.locator('.event-row-container').first().getByRole('button', { name: /Edit/i }).click();
  
  await page.waitForTimeout(500); 

  const cookies = await context.cookies();
  const activityCookie = cookies.find(c => c.name === 'last_viewed_event');

  expect(activityCookie, 'Cookie "last_viewed_event" should be set').toBeDefined();
  expect(decodeURIComponent(activityCookie.value)).toBe(eventName);
  
  await page.goto('http://localhost:5173/'); 
  await expect(page.getByText(`Continue looking at: ${eventName}`)).toBeVisible();
});