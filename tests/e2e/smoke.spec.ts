import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Empire of Night')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
});
