import { test, expect } from '@playwright/test';

const base = '/next';

test('hub renders with nav and theme toggle', async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.locator('.app-logo')).toContainText('The Tome');

  // theme toggle flips data-theme and persists
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click('#theme-toggle');
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);

  // drawer opens and closes
  await page.click('#nav-open');
  await expect(page.locator('#nav-drawer')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('skin chips swap the ruleset skin', async ({ page }) => {
  await page.goto(`${base}/`);
  await page.click('.skin-chip[data-skin-id="vaesen"]');
  expect(await page.evaluate(() => document.documentElement.dataset.skin)).toBe('vaesen');
  // persists across reload via the pre-paint script
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.skin)).toBe('vaesen');
});

test('spell browser filters and edition toggle work', async ({ page }) => {
  await page.goto(`${base}/compendium/dnd5e/spells`);

  // island hydrates and renders the full 2014 list
  await expect(page.locator('.count')).toContainText('400 / 400');

  // matches Fireball and Delayed Blast Fireball
  await page.fill('input[type="search"]', 'fireball');
  await expect(page.locator('.spell')).toHaveCount(2);

  // open the exact Fireball card
  await page.click('.spell-head:has(.name:text-is("Fireball"))');
  await expect(page.locator('.detail')).toContainText('20-foot-radius');

  // switching edition resets filters and swaps datasets
  await page.click('.edition button:has-text("2024")');
  await expect(page.locator('.count')).toContainText('405 / 405');

  // class + level filtering respects slot progression (Warlock 5 → 3rd level max)
  await page.selectOption('select[aria-label="Class"]', 'Warlock');
  await page.selectOption('select[aria-label="Character level"]', '5');
  const levels = await page.locator('.spell .lvl').allTextContents();
  expect(levels.every((l) => l === 'C' || Number(l) <= 3)).toBe(true);
});
