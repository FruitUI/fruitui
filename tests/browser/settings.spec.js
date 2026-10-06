import { test, expect } from '@playwright/test';
import { expectAccessible, expectNoOverflow } from './helpers.js';

// The Settings example: grouped settings (settings.html).
const workspace = page => page.locator('#settings');
const sidebar = page => page.getByRole('navigation', { name: 'Settings', exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/settings.html');
});

test('Settings is linked from every example and its pages and mailbox tabs follow the URL', async ({ page }) => {
  for (const path of ['/', '/support.html', '/chat.html', '/admin.html', '/components.html']) {
    await page.goto(path);
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Settings', exact: true }),
    ).toHaveAttribute('href', '/settings.html');
  }
  await page.goto('/settings.html');
  await expect(sidebar(page).getByRole('link', { name: 'General' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('region', { name: 'Company' })).toBeVisible();
  await sidebar(page).getByRole('link', { name: 'Support Mailbox' }).click();
  await expect(page).toHaveURL(/#\/mailbox$/);
  const tabs = page.getByRole('navigation', { name: 'Mailbox settings' });
  await expect(tabs.getByRole('link', { name: 'General' })).toHaveAttribute('aria-current', 'page');
  // The page spaces its section tabs from the content.
  const gap = await page.evaluate(() => {
    const nav = document.querySelector('.f-page__nav').getBoundingClientRect();
    return document.querySelector('.f-page__body .f-form-section').getBoundingClientRect().top - nav.bottom;
  });
  expect(gap).toBe(24);
  await tabs.getByRole('link', { name: 'Connection' }).click();
  await expect(page).toHaveURL(/#\/mailbox\/connection$/);
  await expect(page.getByRole('region', { name: 'Sending' })).toBeVisible();
  // The SMTP rows follow the radio choice.
  await page.getByRole('radio', { name: 'The server’s mail' }).check();
  await expect(page.getByLabel('Server', { exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'SMTP', exact: true }).check();
  await expect(page.getByLabel('Server', { exact: true })).toHaveValue('smtp.forma.example');
});

test('rows label their controls and describe them, and the save bar saves, reverts and validates', async ({ page }) => {
  const status = workspace(page).locator('.settings-save [role="status"]');
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await expect(status).toHaveText('All changes saved.');
  await expect(save).toBeDisabled();
  await expect(page.getByRole('switch', { name: 'Customer Photos' })).toHaveAccessibleDescription(
    'From Gravatar, for customers without a photo.',
  );
  await expect(page.getByLabel('Date Format', { exact: true })).toHaveValue('long');

  const company = page.getByLabel('Company Name', { exact: true });
  await company.fill('North Studio');
  await page.getByRole('switch', { name: 'Show Customer Email' }).check();
  await expect(status).toHaveText('You have unsaved changes.');
  await save.click();
  await expect(status).toHaveText('All changes saved.');
  await expect(page.getByRole('status').filter({ hasText: 'Settings saved.' })).toBeVisible();

  // Revert returns to the saved values; an empty required field blocks saving.
  await company.fill('Unsaved');
  await page.getByRole('button', { name: 'Revert', exact: true }).click();
  await expect(company).toHaveValue('North Studio');
  await company.fill('');
  await save.click();
  await expect(status).toHaveText('You have unsaved changes.');
  expect(await company.evaluate(input => input.validity.valueMissing)).toBe(true);
});

test('compact layouts show the category list, then one page with a way back', async ({ page }) => {
  await page.getByRole('radio', { name: 'Phone', exact: true }).check();
  await expect(sidebar(page)).toBeVisible();
  await expect(page.locator('.settings-content')).toBeHidden();
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await expect(sidebar(page)).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Profile', level: 2 })).toBeFocused();
  // Switch rows keep the control at the trailing edge; text rows stack.
  const twoFactor = await page.getByRole('switch', { name: 'Two-Factor Authentication' }).boundingBox();
  const label = await page.locator('label[for="settings-two-factor"]').boundingBox();
  expect(twoFactor.x).toBeGreaterThan(label.x + label.width);
  const name = await page.getByLabel('Name', { exact: true }).boundingBox();
  const nameLabel = await page.locator('label[for="settings-name"]').boundingBox();
  expect(name.y).toBeGreaterThan(nameLabel.y + nameLabel.height - 1);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(sidebar(page).getByRole('link', { name: 'Profile' })).toBeFocused();
  await expectNoOverflow(page, '#settings');
});

test('the destructive action asks first', async ({ page }) => {
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Delete Account…', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete Account', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Account deletion requested' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark']) {
  test(`every settings page is accessible and fits in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const hash of [
      '#/general',
      '#/mailbox/general',
      '#/mailbox/connection',
      '#/mailbox/auto-reply',
      '#/profile',
    ]) {
      await page.goto(`/settings.html${hash}`);
      await expect(page.locator('.settings-sections').first()).toBeVisible();
      await expectAccessible(page, '#settings');
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoOverflow(page, '#settings');
  });
}

test('the settings column holds its sections and save bar at one width in a wide window', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/settings.html');
  const column = page.locator('.settings-page');
  const section = await column.locator('.f-form-section').first().boundingBox();
  const save = await column.locator('.f-page__footer').boundingBox();
  // Narrow: the content stays readable however wide the pane is, and the save bar lines up with it.
  expect(section.width).toBeLessThanOrEqual(641);
  expect(Math.abs(save.x - section.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(save.width - section.width)).toBeLessThanOrEqual(1);
  await expect(column.getByRole('button', { name: 'Save' })).toBeVisible();
});

test('the accent color previews on the whole page and Revert restores it', async ({ page }) => {
  await page.goto('/settings.html#/profile');
  const html = page.locator('html');
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await expect(html).toHaveAttribute('data-fruit-accent', 'blue');
  const fill = () => save.evaluate(button => getComputedStyle(button).backgroundColor);
  const blue = await fill();
  const group = page.getByRole('radiogroup', { name: 'Accent Color' });
  await group.getByRole('radio', { name: 'Blue' }).focus();
  // A native radio group: arrow keys move and select.
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Purple' })).toBeChecked();
  await expect(html).toHaveAttribute('data-fruit-accent', 'purple');
  // The primary button follows the accent.
  await expect.poll(fill).not.toBe(blue);
  await page.getByRole('button', { name: 'Revert' }).click();
  await expect(html).toHaveAttribute('data-fruit-accent', 'blue');
  await expect.poll(fill).toBe(blue);
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked();
});

test('Status lists what needs attention with its fix, until everything is working', async ({ page }) => {
  const status = sidebar(page).getByRole('link', { name: /^Status/ });
  await expect(status).toHaveAccessibleName('Status, 3 need attention');
  await status.click();
  await expect(page).toHaveURL(/#\/status$/);
  // No save bar: Status changes nothing to save, and its last section keeps the page's end spacing.
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeHidden();
  const end = await page.locator('.settings-scroll').evaluate(scroller => {
    scroller.scrollTop = scroller.scrollHeight;
    const last = scroller.querySelector('.settings-sections > :last-child').getBoundingClientRect();
    return scroller.getBoundingClientRect().bottom - last.bottom;
  });
  expect(end).toBeGreaterThanOrEqual(24);
  const attention = page.getByRole('region', { name: 'Needs Attention' });
  await expect(attention.locator('.settings-problem')).toHaveCount(3);
  await expect(attention.getByText('* * * * * php /var/www/forma/artisan schedule:run')).toBeVisible();
  // Each fix sits beside its problem.
  await attention.getByRole('button', { name: 'Update Database' }).click();
  await expect(attention.locator('.settings-problem')).toHaveCount(2);
  const maintenance = page.getByRole('region', { name: 'Maintenance' });
  await expect(maintenance.getByRole('button', { name: 'Update Database' })).toBeDisabled();
  await expect(maintenance).toContainText('The database is up to date.');
  await attention.getByRole('button', { name: 'Retry All' }).click();
  await expect(page.getByRole('region', { name: 'Failed Jobs' })).toContainText('No failed jobs.');
  await attention.getByRole('button', { name: 'Check Again' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Everything is working.' })).toBeVisible();
  await expect(attention).toBeHidden();
  await expect(status).toHaveAccessibleName('Status');
  await expect(page.getByRole('region', { name: 'Background Tasks' })).toContainText('Last ran 1 minute ago');
});

test('Fetch Now runs with its options in a sheet, and Sign Out Everyone asks first', async ({ page }) => {
  await page.goto('/settings.html#/status');
  await page.getByRole('button', { name: 'Fetch Now…' }).click();
  const sheet = page.getByRole('dialog', { name: 'Fetch Emails Now' });
  await expect(sheet.getByRole('spinbutton', { name: 'Days' })).toHaveValue('3');
  await sheet.locator('label').filter({ hasText: /^All$/ }).click();
  await expect(sheet.getByRole('radio', { name: 'All' })).toBeChecked();
  await sheet.getByRole('switch', { name: 'Show Debug Output' }).check();
  await sheet.getByRole('button', { name: 'Fetch', exact: true }).click();
  await expect(sheet.getByRole('status')).toContainText('Fetching all emails from the last 3 days');
  await expect(sheet.getByRole('status')).toContainText('[debug] Connecting');
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole('button', { name: 'Sign Out Everyone…' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Sign out everyone?' });
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Sign Out Everyone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Everyone was signed out.' })).toBeVisible();
});

test('Logs shows one log at a time on a wide page, with details and a confirmed clear', async ({ page }) => {
  await page.goto('/settings.html#/status');
  const narrow = await page.locator('.settings-page').evaluate(element => element.getBoundingClientRect().width);
  await sidebar(page).getByRole('link', { name: 'Logs' }).click();
  // Tables get the wide column; settings pages keep the narrow one.
  await expect
    .poll(() => page.locator('.settings-page').evaluate(element => element.getBoundingClientRect().width))
    .toBeGreaterThan(narrow);
  const table = page.getByRole('table', { name: 'Outgoing Emails' });
  await expect(table.getByRole('row')).toHaveCount(6);
  await table.getByRole('button', { name: 'Details for Reply, Oct 6, 09:12' }).click();
  const details = page.getByRole('dialog', { name: 'Reply · Oct 6, 09:12' });
  await expect(details).toContainText('Retrying in 5 minutes.');
  await details.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('combobox', { name: 'Log' }).selectOption('send-errors');
  await expect(page.getByRole('table', { name: 'Send Errors' }).getByRole('row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear Log…' }).click();
  await page
    .getByRole('alertdialog', { name: 'Clear Send Errors?' })
    .getByRole('button', { name: 'Clear Log' })
    .click();
  await expect(page.getByRole('heading', { name: 'This log is empty.' })).toBeVisible();
  // App logs are files: choose one and search its lines.
  await page.getByRole('combobox', { name: 'Log' }).selectOption('app');
  await page.getByRole('searchbox', { name: 'Search the Log' }).fill('certificate');
  await expect(page.locator('.settings-page .settings-log-lines')).toHaveText(/IMAP certificate expired/);
  await expect(page.locator('.settings-page .settings-log-lines')).not.toContainText('quota');
  await expectNoOverflow(page.locator('#settings .f-pane__scroll'));
});

for (const colorScheme of ['light', 'dark']) {
  test(`Status and Logs are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/settings.html#/status');
    await expect(page.getByRole('region', { name: 'Needs Attention' })).toBeVisible();
    await expectAccessible(page, '#settings');
    await page.goto('/settings.html#/logs');
    await expect(page.getByRole('table', { name: 'Outgoing Emails' })).toBeVisible();
    await expectAccessible(page, '#settings');
  });
}

test('a mailbox has a color from the named accents, saved and reverted with the page', async ({ page }) => {
  await page.goto('/settings.html#/mailbox');
  const group = page.getByRole('radiogroup', { name: 'Color' });
  await expect(group.getByRole('radio')).toHaveCount(8);
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked();
  await group.getByRole('radio', { name: 'Green' }).check();
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await expect(save).toBeEnabled();
  await page.getByRole('button', { name: 'Revert' }).click();
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked();
  await expect(save).toBeDisabled();
});
