import { test, expect } from '@playwright/test';
import { expectAccessible, expectNoOverflow } from './helpers.js';
import { readFile } from 'node:fs/promises';

const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const messages = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  await page.goto('/admin.html');
  await expect(rows(page)).toHaveCount(5);
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('Admin is linked alongside every example and summary statistics match current subscriptions', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation.getByRole('link', { name: 'Admin', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(stats(page)).toHaveText(['$1,256', '14', '4', '20']);
  await expect(page.locator('.admin-plan-bars li')).toHaveText([/Starter4.*29%/, /Studio5.*36%/, /Business5.*36%/]);
  for (const path of ['/', '/support.html', '/chat.html', '/components.html']) {
    await page.goto(path);
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Admin', exact: true }),
    ).toHaveAttribute('href', '/admin.html');
  }
});

test('create and edit forms keep native values and update current stats, plans, and activity', async ({ page }) => {
  await addCustomer(page, {
    name: 'Taylor Reed',
    email: 'taylor@new.example',
    company: 'New Studio',
    plan: 'starter',
    status: 'active',
    notes: 'Prefers a morning call.',
    updates: true,
  });
  await expect(stats(page)).toHaveText(['$1,285', '15', '4', '21']);
  await expect(page.getByRole('button', { name: 'Add Customer', exact: true })).toBeFocused();
  await expect(page.locator('.admin-plan-bars li').first()).toContainText('Starter5');
  await page.getByRole('button', { name: 'Edit Taylor Reed', exact: true }).click();
  const dialog = customerDialog(page);
  await expect(dialog.getByLabel('Internal Notes', { exact: true })).toHaveValue('Prefers a morning call.');
  await expect(dialog.getByLabel('Send product updates', { exact: true })).toBeChecked();
  await dialog.getByLabel('Full Name', { exact: true }).fill('Taylor Reed Jr.');
  await dialog.getByLabel('Subscription Status', { exact: true }).selectOption('trial');
  await dialog.getByLabel('Plan', { exact: true }).selectOption('business');
  await dialog.getByLabel('Send product updates', { exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(stats(page)).toHaveText(['$1,256', '14', '5', '21']);
  await expect(rows(page).first()).toContainText('Taylor Reed Jr.');
  await page.getByRole('button', { name: 'Edit Taylor Reed Jr.', exact: true }).click();
  await expect(dialog.getByLabel('Plan', { exact: true })).toHaveValue('business');
  await expect(dialog.getByLabel('Send product updates', { exact: true })).not.toBeChecked();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await adminNav(page)
    .getByRole('link', { name: /^Activity/ })
    .click();
  await expect(page.locator('.admin-activity-list li')).toHaveCount(2);
  await expect(page.locator('.admin-activity-list li').first()).toContainText('Updated Taylor Reed Jr.');
});

test('native validation, whitespace, duplicate emails, and cancellation leave records intact', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Customer', exact: true }).click();
  const dialog = customerDialog(page);
  await dialog.getByRole('button', { name: 'Create Customer', exact: true }).click();
  await expect(dialog.getByLabel('Full Name', { exact: true })).toBeFocused();
  await fillCustomer(dialog, { name: 'New Customer', email: 'invalid', company: 'A Company' });
  await dialog.getByRole('button', { name: 'Create Customer', exact: true }).click();
  expect(await dialog.getByLabel('Email Address', { exact: true }).evaluate(input => input.validity.typeMismatch)).toBe(
    true,
  );
  await dialog.getByLabel('Email Address', { exact: true }).fill('SOPHIE@STUDIONORTH.EXAMPLE');
  await dialog.getByRole('button', { name: 'Create Customer', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('A customer with this email address already exists.');
  await expect(dialog.getByLabel('Email Address', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Email Address', { exact: true }).fill('new@company.example');
  await dialog.getByLabel('Full Name', { exact: true }).fill('   ');
  await dialog.getByRole('button', { name: 'Create Customer', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter a name and a company.');
  await page.keyboard.press('Escape');
  await expect(stats(page).last()).toHaveText('20');
  await page.getByRole('button', { name: 'Edit Sophie Chen', exact: true }).click();
  await dialog.getByLabel('Full Name', { exact: true }).fill('An unsaved name');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Sophie Chen', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Sophie Chen', exact: true })).toBeFocused();
});

test('table sorting, search, status filters, empty state, and page size use the same records', async ({ page }) => {
  const table = page.locator('.admin-table:not(.admin-subscription-table)');
  await table.getByRole('button', { name: 'Customer', exact: true }).click();
  await expect(table.getByRole('columnheader', { name: 'Customer', exact: true })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await expect(rows(page).first()).toContainText('Abigail Harris');
  await table.getByRole('button', { name: 'Customer', exact: true }).click();
  await expect(rows(page).first()).toContainText('Sophie Chen');
  await page.getByLabel('Status', { exact: true }).selectOption('trial');
  await expect(rows(page)).toHaveCount(4);
  await expect(page.locator('.admin-pagination')).toContainText('1–4 of 4 customers');
  await page.getByLabel('Search Customers', { exact: true }).fill('fieldwork');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('Oliver Park');
  await page.getByLabel('Search Customers', { exact: true }).fill('not-found');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No Customers Found', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset Filters', exact: true }).click();
  await page.getByLabel('Customers per Page', { exact: true }).selectOption('10');
  await expect(rows(page)).toHaveCount(10);
  await expect(page.locator('.admin-page-controls')).toContainText('1 / 2');
  await page.getByLabel('Search Customers', { exact: true }).fill('mia@daybreak');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('Mia Patel');
});

test('page selection is independent of rows, spans pages, and deletes exactly the confirmed selection', async ({
  page,
}) => {
  const selectPage = page.getByRole('checkbox', { name: 'Select all customers on this page', exact: true });
  await page.getByRole('checkbox', { name: 'Select Sophie Chen', exact: true }).check();
  expect(await selectPage.evaluate(input => input.indeterminate)).toBe(true);
  await selectPage.check();
  await expect(page.locator('.admin-bulk-actions')).toContainText('5 selected across pages');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('[x-ref="tableRegion"]')).toBeFocused();
  await expect(selectPage).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Select Lucas Martin', exact: true }).check();
  await page.getByRole('button', { name: 'Delete Selected', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete customers?', exact: true });
  await expect(confirmation).toContainText('Delete 6 customers');
  await expect(confirmation.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.admin-bulk-actions')).toContainText('6 selected');
  await page.getByRole('button', { name: 'Delete Selected', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(stats(page)).toHaveText(['$850', '10', '2', '14']);
  await expect(page.locator('.admin-bulk-actions')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Customer', exact: true })).toBeFocused();
  await page.getByLabel('Search Customers', { exact: true }).fill('sophie');
  await expect(rows(page)).toHaveCount(0);
});

test('deleting the last page clamps pagination and filtering clears stale selection', async ({ page }) => {
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('.admin-page-controls')).toContainText('4 / 4');
  await page.getByRole('checkbox', { name: 'Select all customers on this page', exact: true }).check();
  await page.getByRole('button', { name: 'Delete Selected', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.admin-pagination')).toContainText('11–15 of 15 customers');
  await expect(page.locator('.admin-page-controls')).toContainText('3 / 3');
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Select all customers on this page', exact: true }).check();
  await page.getByLabel('Status', { exact: true }).selectOption('trial');
  await expect(page.locator('.admin-bulk-actions')).not.toBeVisible();
  await expect(page.locator('.admin-pagination')).toContainText('1–3 of 3 customers');
});

test('CSV exports the full filtered result and preserves quoting while neutralizing formulas', async ({ page }) => {
  await addCustomer(page, {
    name: '=SUM(1+1)',
    email: 'csv@company.example',
    company: 'A "quoted", company',
    status: 'trial',
  });
  const all = await downloadCsv(page);
  expect(all.split('\r\n')).toHaveLength(22);
  expect(all).toContain('"\'=SUM(1+1)"');
  expect(all).toContain('"A ""quoted"", company"');
  await page.getByLabel('Status', { exact: true }).selectOption('trial');
  const trial = await downloadCsv(page);
  expect(trial.split('\r\n')).toHaveLength(6);
  expect(trial).toContain('"Trial","0"');
  expect(trial).not.toContain('sophie@studionorth.example');
  await page.getByLabel('Search Customers', { exact: true }).fill('csv@company');
  expect((await downloadCsv(page)).split('\r\n')).toHaveLength(2);
});

test('workspace settings save native switch values, reset to the saved values, and log changes', async ({ page }) => {
  await adminNav(page).getByRole('link', { name: 'Workspace', exact: true }).click();
  await page.getByLabel('Workspace Name', { exact: true }).fill('North Studio');
  await page.getByLabel('Contact Email', { exact: true }).fill('owner@north.example');
  await page.getByRole('switch', { name: /^Weekly Digest/ }).uncheck();
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
  await expect(page.locator('.admin-team strong')).toHaveText('North Studio');
  await page.getByLabel('Workspace Name', { exact: true }).fill('Unsaved name');
  await page.getByRole('switch', { name: /^Weekly Digest/ }).check();
  await page.getByRole('switch', { name: /^Security Updates/ }).uncheck();
  await page.getByRole('button', { name: 'Reset Changes', exact: true }).click();
  await expect(page.getByLabel('Workspace Name', { exact: true })).toHaveValue('North Studio');
  await expect(page.getByRole('switch', { name: /^Weekly Digest/ })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: /^Security Updates/ })).toBeChecked();
  await page.getByLabel('Workspace Name', { exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
  expect(await page.getByLabel('Workspace Name', { exact: true }).evaluate(input => input.validity.customError)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Reset Changes', exact: true }).click();
  expect(await page.getByLabel('Workspace Name', { exact: true }).evaluate(input => input.validity.valid)).toBe(true);
  await adminNav(page)
    .getByRole('link', { name: /^Activity/ })
    .click();
  await expect(page.locator('.admin-activity-list')).toContainText('Updated workspace settings');
  await expect(page.locator('.admin-activity-list')).toContainText('owner@north.example');
});

test('revenue period, month inspection, and accessible chart data share the historical sample', async ({ page }) => {
  await page.getByRole('button', { name: 'April 2026: $980', exact: true }).click();
  await expect(page.locator('.admin-chart-value')).toHaveText('$980April 2026');
  await expect(page.getByRole('button', { name: 'April 2026: $980', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Revenue Period', { exact: true }).selectOption('3');
  await expect(page.locator('.admin-chart-months button')).toHaveCount(3);
  await expect(page.locator('.admin-chart-value')).toHaveText('$1,717September 2026');
  await page.locator('.admin-chart-data summary').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.admin-chart-data')).toHaveAttribute('open', '');
  await expect(page.locator('.admin-chart-data tbody tr:visible')).toHaveCount(3);
  await expect(page.locator('.admin-chart-data tbody')).toContainText('July 2026');
  await addCustomer(page, {
    name: 'Revenue Test',
    email: 'revenue@company.example',
    company: 'Company',
    status: 'active',
    plan: 'business',
  });
  await expect(stats(page).first()).toHaveText('$1,405');
  await expect(page.locator('.admin-chart-value')).toHaveText('$1,717September 2026');
});

test('navigation, forms, and table scrolling preserve state through narrow containers and viewport changes', async ({
  page,
}) => {
  await page.getByLabel('Status', { exact: true }).selectOption('trial');
  await page.getByRole('checkbox', { name: 'Select Oliver Park', exact: true }).check();
  await page.getByRole('button', { name: 'Edit Oliver Park', exact: true }).click();
  await customerDialog(page).getByLabel('Internal Notes', { exact: true }).fill('An unsaved draft across sizes.');
  for (const width of [320, 390, 720, 820, 1100, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(customerDialog(page).getByLabel('Internal Notes', { exact: true })).toHaveValue(
      'An unsaved draft across sizes.',
    );
    await expectNoOverflow(page, '#admin');
  }
  await page.keyboard.press('Escape');
  await page.locator('.admin-container').evaluate(element => {
    element.style.maxWidth = '320px';
  });
  await expectNoOverflow(page, '#admin');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('trial');
  await expect(page.getByRole('checkbox', { name: 'Select Oliver Park', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
  await expect(adminNav(page).getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  await adminNav(page).getByRole('link', { name: 'Workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workspace Settings', exact: true, level: 2 })).toBeFocused();
  await expect(page.locator('.admin-sidebar')).not.toBeVisible();
  await expectNoOverflow(page, '#admin');
  await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Toggle admin navigation', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
  await adminNav(page)
    .getByRole('link', { name: /^Directory/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Customers', exact: true, level: 2 })).toBeFocused();
  // x-show reveals the panel on the next frame; focus() doesn't await visibility.
  await expect(page.locator('[x-ref="tableRegion"]')).toBeVisible();
  await page.locator('[x-ref="tableRegion"]').focus();
  await expect(page.locator('[x-ref="tableRegion"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => page.locator('[x-ref="tableRegion"]').evaluate(element => element.scrollLeft))
    .toBeGreaterThan(0);
  await expectNoOverflow(page, '#admin');
});

for (const appearance of ['light', 'dark']) {
  test(`dashboard, selection, hover, error forms, deletion, settings, and phone views are accessible in ${appearance}`, async ({
    page,
  }) => {
    // Full-page audits across eleven states share this scenario's time budget.
    test.slow();
    await page.emulateMedia({ colorScheme: appearance });
    await expectAccessible(page);
    await page.locator('.admin-chart-data summary').click();
    await expectAccessible(page);
    await page.getByRole('checkbox', { name: 'Select Sophie Chen', exact: true }).check();
    await rows(page).first().hover();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Edit Sophie Chen', exact: true }).click();
    const dialog = customerDialog(page);
    await dialog.getByLabel('Email Address', { exact: true }).fill('mia@daybreak.example');
    await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Delete Sophie Chen', exact: true }).click();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await adminNav(page).getByRole('link', { name: 'Workspace', exact: true }).click();
    await page.getByRole('switch', { name: /^Weekly Digest/ }).uncheck();
    await expectAccessible(page);
    await adminNav(page)
      .getByRole('link', { name: /^Activity/ })
      .click();
    await expectAccessible(page);
    await adminNav(page).getByRole('link', { name: 'Overview', exact: true }).click();
    await page.getByLabel('Search Customers', { exact: true }).fill('missing');
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Reset Filters', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Add Customer', exact: true }).click();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Toggle admin navigation', exact: true }).click();
    await expectAccessible(page);
  });
}

test('CSS-only Overview keeps native chart disclosure, sample records, and live system dark mode', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/admin.html');
    await expect(page.locator('.admin-table:not(.admin-subscription-table) tbody')).toContainText('Sophie Chen');
    await expect(page.getByRole('button', { name: 'Add Customer', exact: true })).toBeDisabled();
    await page.locator('.admin-chart-data summary').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.admin-chart-data')).toHaveAttribute('open', '');
    await expect(page.locator('.admin-chart-data tbody')).toContainText('April 2026');
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      await expect(page.locator('html')).toHaveCSS('color-scheme', scheme);
      await expect(page.locator('#admin')).toHaveCSS(
        'background-color',
        scheme === 'light' ? 'rgb(243, 243, 245)' : 'rgb(36, 36, 39)',
      );
      await expectNoOverflow(page, '#admin');
    }
  } finally {
    await context.close();
  }
});

function adminNav(page) {
  return page.getByRole('navigation', { name: 'Admin navigation', exact: true });
}
function rows(page) {
  return page.locator('.admin-table tbody tr[data-customer]');
}
function stats(page) {
  return page.locator('.admin-stat dd > strong');
}
function customerDialog(page) {
  return page.locator('dialog').filter({ has: page.locator('#admin-customer-dialog-title') });
}
async function fillCustomer(dialog, values) {
  await dialog.getByLabel('Full Name', { exact: true }).fill(values.name);
  await dialog.getByLabel('Email Address', { exact: true }).fill(values.email);
  await dialog.getByLabel('Company', { exact: true }).fill(values.company);
  if (values.plan) await dialog.getByLabel('Plan', { exact: true }).selectOption(values.plan);
  if (values.status) await dialog.getByLabel('Subscription Status', { exact: true }).selectOption(values.status);
  if (values.notes) await dialog.getByLabel('Internal Notes', { exact: true }).fill(values.notes);
  if (values.updates) await dialog.getByLabel('Send product updates', { exact: true }).check();
}
async function addCustomer(page, values) {
  await page.getByRole('button', { name: 'Add Customer', exact: true }).click();
  const dialog = customerDialog(page);
  await fillCustomer(dialog, values);
  await dialog.getByRole('button', { name: 'Create Customer', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function downloadCsv(page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('fruitui-customers.csv');
  return readFile(await download.path(), 'utf8');
}
