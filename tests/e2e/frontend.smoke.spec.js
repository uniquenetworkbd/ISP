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

test('OLT operations exposes backend capability state without inventing telemetry', async ({ page }) => {
  await page.route('**/api/olt/profiles', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      items: [
        { vendor: 'huawei', profile_status: 'vendor_profile_pending', vendor_telemetry_ready: false, mib_profile_id: null, capabilities: ['snmp_system_probe'] },
        { vendor: 'zte', profile_status: 'vendor_profile_pending', vendor_telemetry_ready: false, mib_profile_id: null, capabilities: ['snmp_system_probe'] },
        { vendor: 'vsol', profile_status: 'vendor_profile_pending', vendor_telemetry_ready: false, mib_profile_id: null, capabilities: ['snmp_system_probe'] },
        { vendor: 'bdcom', profile_status: 'vendor_profile_pending', vendor_telemetry_ready: false, mib_profile_id: null, capabilities: ['snmp_system_probe'] },
      ],
    }),
  }));
  await page.route('**/api/olt/servers', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }));
  await page.goto('./#olt', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#oltOpsCapabilities')).toContainText('Huawei');
  await expect(page.locator('#oltOpsCapabilities')).toContainText('Pending');
  await expect(page.locator('#oltOpsSummary')).toContainText('0 ready profiles');
});

test('frontend remains usable on mobile viewport', async ({ page }) => {
  await page.goto('./#dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#menuButton')).toBeVisible();
  await page.locator('#menuButton').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'visible');
});
