const { test, expect } = require('@playwright/test');

test('frontend boots without uncaught page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/isp-ready/, { timeout: 10000 });
  await expect(page.locator('#pageTitle')).toContainText('Command Center');
  expect(errors).toEqual([]);
});

test('primary navigation resolves without a dead link', async ({ page }) => {
  await page.goto('./#dashboard', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-route="topology"]').click();
  await expect(page.locator('#pageTitle')).toContainText('Interactive Topology');
  await page.locator('[data-route="mikrotikServers"]').click();
  await expect(page.locator('#pageTitle')).toContainText('MikroTik');
  await page.locator('[data-route="oltServers"]').click();
  await expect(page.locator('#pageTitle')).toContainText('OLT');
});

test('frontend remains usable on mobile viewport', async ({ page }) => {
  await page.goto('./#dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#menuButton')).toBeVisible();
  await page.locator('#menuButton').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'visible');
});
