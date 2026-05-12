import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Empire of Night')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('debug bridge exposes deterministic battle state', async ({ page }) => {
  await page.goto('/');

  const bridge = await page.evaluate(() => window.__empireOfNight?.version);
  expect(bridge).toBe('0.1.0-milestone-1');

  const initialScreen = await page.evaluate(() => window.__empireOfNight?.snapshot().currentScreen);
  expect(initialScreen).toBe('menu');

  await page.evaluate(() => window.__empireOfNight?.startBattle());
  await expect(page.getByText('Break the dawn vanguard')).toBeVisible();

  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  expect(battle?.phase).toBe('player');
  expect(battle?.units.some((unit) => unit.id === 'regent')).toBe(true);
  expect(battle?.enemyIntents[0]?.description).toContain('Dawn Vanguard');
});

test('opening battle can be won through deterministic actions', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle();
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.move({ x: 4, y: 3 });
    window.__empireOfNight?.attack('dawn-vanguard');
    window.__empireOfNight?.attack('dawn-vanguard');
    window.__empireOfNight?.attack('dawn-vanguard');
  });

  const result = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(result?.currentScreen).toBe('result');
  expect(result?.battle?.result).toBe('victory');
  await expect(page.getByText('The crypt gate kneels.')).toBeVisible();
});
