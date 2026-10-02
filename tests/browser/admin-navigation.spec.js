import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const messages = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  await page.goto('/admin.html');
  await expect(page.locator('[data-customer]')).toHaveCount(5);
});
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]); });

test('sidebar disclosures reveal independent destinations and history opens the current group', async ({ page }) => {
  const customers = group(page, 'customers');
  await customers.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(customers).not.toHaveAttribute('open', '');
  await expect(title(page)).toHaveText('Overview');
  await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(customers).toHaveAttribute('open', '');
  await group(page, 'billing').locator('summary').click();
  await nav(page).getByRole('link', { name: 'Subscriptions', exact: true }).click();
  await expect(title(page)).toHaveText('Subscriptions');
  await expect(title(page)).toBeFocused();
  await nav(page).getByRole('link', { name: 'Plans', exact: true }).click();
  await expect(page).toHaveURL(/#\/plans$/);
  await group(page, 'billing').locator('summary').click();
  await customers.locator('summary').click();
  await page.goBack();
  await expect(title(page)).toHaveText('Subscriptions');
  await expect(group(page, 'billing')).toHaveAttribute('open', '');
  await expect(customers).not.toHaveAttribute('open', '');
  await expect(nav(page).getByRole('link', { name: 'Subscriptions', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.goForward();
  await expect(title(page)).toHaveText('Plans');
});

test('segments and plan catalog drill into real filtered customer records', async ({ page }) => {
  await nav(page).getByRole('link', { name: 'Segments', exact: true }).click();
  await expect(page.locator('.admin-segments h3')).toHaveText(['14 customers', '4 customers', '2 customers']);
  await page.getByRole('button', { name: 'View trial customers', exact: true }).click();
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('trial');
  await expect(page.locator('[data-customer]')).toHaveCount(4);
  await expect(page.locator('.admin-pagination')).toContainText('1–4 of 4 customers');
  await destination(page, 'billing', 'Plans');
  await expect(page.locator('.admin-plan-catalog')).toContainText('7 customers on this plan');
  await page.getByRole('button', { name: 'View customers on Business', exact: true }).click();
  await expect(page.getByLabel('Plan filter', { exact: true })).toHaveValue('business');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('all');
  await expect(page.locator('.admin-pagination')).toContainText('1–5 of 7 customers');
  await expect(page.locator('[data-customer]')).toHaveCount(5);
  await expect(page.locator('[data-customer]').first()).toContainText('Sophie Chen');
  await page.getByRole('link', { name: 'View Sophie Chen', exact: true }).click();
  await expect(title(page)).toHaveText('Sophie Chen');
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Customers', exact: true }).click();
  await expect(title(page)).toHaveText('Customers');
  await expect(page.getByLabel('Plan filter', { exact: true })).toHaveValue('business');
});

test('customer tabs implement keyboard selection, panel focus, breadcrumbs, and browser history', async ({ page }) => {
  await page.getByRole('link', { name: 'View Sophie Chen', exact: true }).click();
  const profile = page.getByRole('tab', { name: 'Profile', exact: true });
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Profile', exact: true })).toContainText('Annual review scheduled');
  await profile.focus();
  await page.keyboard.press('ArrowLeft');
  await selectedTab(page, 'Activity');
  await page.keyboard.press('Home');
  await selectedTab(page, 'Profile');
  await page.keyboard.press('ArrowRight');
  await selectedTab(page, 'Subscription');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toContainText('sub_1001');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toContainText('$149');
  await expect(page).toHaveURL(/#\/customers\/cus_1001\/subscription$/);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toBeFocused();
  await page.getByRole('tab', { name: 'Subscription', exact: true }).focus();
  await page.keyboard.press('End');
  await selectedTab(page, 'Activity');
  await page.keyboard.press('ArrowRight');
  await selectedTab(page, 'Profile');
  await page.getByRole('tab', { name: 'Subscription', exact: true }).click();
  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toHaveText('OverviewCustomersSophie ChenSubscription');
  await breadcrumbs.getByRole('link', { name: 'Sophie Chen', exact: true }).click();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Subscription', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
});

test('record edits update detail panels and customer activity stays scoped to its identity', async ({ page }) => {
  await page.getByRole('link', { name: 'View Sophie Chen', exact: true }).click();
  await page.getByRole('button', { name: 'Edit customer', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit customer', exact: true });
  await dialog.getByLabel('Full name', { exact: true }).fill('Sophie Chen Park');
  await dialog.getByLabel('Plan', { exact: true }).selectOption('starter');
  await dialog.getByLabel('Subscription status', { exact: true }).selectOption('trial');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(title(page)).toHaveText('Sophie Chen Park');
  await expect(page.getByRole('button', { name: 'Edit customer', exact: true })).toBeFocused();
  await page.getByRole('tab', { name: 'Subscription', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toContainText('Starter');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toContainText('$29 / month');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true }).locator('.admin-detail-fields > div').filter({ hasText: 'Current monthly revenue' }).locator('dd')).toHaveText('$0');
  await page.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Activity', exact: true })).toContainText('Updated Sophie Chen Park');
  await page.getByRole('link', { name: 'Back to customers', exact: true }).click();
  await page.getByRole('link', { name: 'View Mia Patel', exact: true }).click();
  await page.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Activity', exact: true })).toContainText('No changes yet');
  await expect(page.getByRole('tabpanel', { name: 'Activity', exact: true })).not.toContainText('Sophie');
  await nav(page).getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.admin-stat dd > strong')).toHaveText(['$1,107', '13', '5', '20']);
});

test('subscription links, direct URLs, invalid destinations, and deleted-record history keep navigation valid', async ({ page }) => {
  await destination(page, 'billing', 'Subscriptions');
  await page.getByLabel('Subscription filter', { exact: true }).selectOption('trial');
  await expect(page.locator('.admin-subscription-table tbody tr')).toHaveCount(4);
  await page.getByLabel('Search subscriptions', { exact: true }).fill('sub_1002');
  await expect(page.locator('.admin-subscription-table tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: 'View subscription for Oliver Park', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toBeVisible();
  await expect(group(page, 'customers')).toHaveAttribute('open', '');
  await page.reload();
  await expect(title(page)).toHaveText('Oliver Park');
  await expect(page.getByRole('tab', { name: 'Subscription', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Delete customer', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete customer?', exact: true });
  await expect(confirmation).toContainText('Oliver Park');
  await page.keyboard.press('Escape');
  await expect(title(page)).toHaveText('Oliver Park');
  await page.getByRole('button', { name: 'Delete customer', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(title(page)).toHaveText('Customers');
  await expect(title(page)).toBeFocused();
  await expect(page.locator('.admin-pagination')).toContainText('of 19 customers');
  await page.goBack();
  await expect(page).toHaveURL(/#\/customers$/);
  await expect(title(page)).toHaveText('Customers');
  await expect(page.locator('.f-toast')).toContainText('no longer available');
  await page.goto('/admin.html#/customers/cus_1001/subscription');
  await expect(title(page)).toHaveText('Sophie Chen');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toBeVisible();
  await page.goto('/admin.html#/customers/%ZZ/profile');
  await expect(page).toHaveURL(/#\/customers$/);
  await expect(title(page)).toHaveText('Customers');
  await page.goto('/admin.html#/unknown-view');
  await expect(title(page)).toHaveText('Overview');
  await expect(page).toHaveURL(/#\/overview$/);
});

test('long customer details, breadcrumbs, groups, and tabs fit narrow layouts without losing drafts', async ({ page }) => {
  await page.getByRole('link', { name: 'View Sophie Chen', exact: true }).click();
  await page.getByRole('button', { name: 'Edit customer', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit customer', exact: true });
  await dialog.getByLabel('Full name', { exact: true }).fill('N'.repeat(80));
  await dialog.getByLabel('Company', { exact: true }).fill('C'.repeat(100));
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('tab', { name: 'Subscription', exact: true }).click();
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    await expect(page.getByRole('tab', { name: 'Subscription', exact: true })).toHaveAttribute('aria-selected', 'true');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
  await expect(nav(page).getByRole('link', { name: /^Directory/ })).toBeFocused();
  await destination(page, 'billing', 'Plans');
  await expect(page.locator('.admin-sidebar')).not.toBeVisible();
  await noOverflow(page);
  await page.goBack();
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit customer', exact: true }).click();
  await dialog.getByLabel('Internal notes', { exact: true }).fill('Draft survives resizing.');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(dialog.getByLabel('Internal notes', { exact: true })).toHaveValue('Draft survives resizing.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tabpanel', { name: 'Subscription', exact: true })).toBeVisible();
});

for (const appearance of ['light', 'dark']) {
  test(`grouped destinations, breadcrumbs, tabs, and detail states are accessible in ${appearance}`, async ({ page }) => {
    // Full-page audits across twelve states share this scenario's time budget.
    test.slow();
    await page.emulateMedia({ colorScheme: appearance });
    await nav(page).getByRole('link', { name: 'Segments', exact: true }).click();
    await expect(title(page)).toHaveText('Segments');
    await accessible(page);
    await destination(page, 'billing', 'Plans');
    await accessible(page);
    await nav(page).getByRole('link', { name: 'Subscriptions', exact: true }).click();
    await accessible(page);
    await page.getByLabel('Search subscriptions', { exact: true }).fill('no match');
    await accessible(page);
    await nav(page).getByRole('link', { name: 'Revenue', exact: true }).click();
    await expect(title(page)).toHaveText('Revenue');
    await accessible(page);
    await nav(page).getByRole('link', { name: /^Directory/ }).click();
    await page.getByRole('link', { name: 'View Sophie Chen', exact: true }).click();
    await page.getByRole('link', { name: 'Back to customers', exact: true }).hover();
    await accessible(page);
    for (const tab of ['Profile', 'Subscription', 'Activity']) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await selectedTab(page, tab);
      await page.getByRole('tab', { name: tab, exact: true }).hover();
      await accessible(page);
      if (tab === 'Subscription') {
        await page.getByRole('link', { name: 'Explore plans', exact: true }).hover();
        await accessible(page);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await accessible(page);
    await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
    await accessible(page);
  });
}

test('native grouped disclosures work in the CSS-only desktop sample', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1100 } });
  try {
    const page = await context.newPage();
    await page.goto('/admin.html');
    const customers = group(page, 'customers');
    await customers.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(customers).not.toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(customers).toHaveAttribute('open', '');
    await expect(nav(page).getByRole('link', { name: /^Directory/ })).toBeVisible();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  } finally { await context.close(); }
});

function nav(page) { return page.getByRole('navigation', { name: 'Admin navigation', exact: true }); }
function group(page, id) { return nav(page).locator(`[data-admin-group="${id}"]`); }
function title(page) { return page.locator('[x-ref="title"]'); }
async function destination(page, id, name) {
  if (!(await group(page, id).evaluate(element => element.open))) await group(page, id).locator('summary').click();
  await nav(page).getByRole('link', { name, exact: true }).click();
  await expect(title(page)).toHaveText(name);
}
async function selectedTab(page, name) {
  const tab = page.getByRole('tab', { name, exact: true });
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(tab).toBeFocused();
  await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('tablist').locator('[tabindex="0"]')).toHaveCount(1);
}
async function accessible(page) { expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]); }
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#admin').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}
