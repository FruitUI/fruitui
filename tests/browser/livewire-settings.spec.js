import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// Mailbox settings as a real Livewire 4 component (examples/laravel/settings.blade.php).
const host = 'http://127.0.0.1:5180';

async function openSettings(page, query = '', heading = 'Support') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/settings${query}`);
  await expect(level(page, heading)).toBeVisible();
  return errors;
}
// A Drill-Down level, by its title.
const level = (page, name) =>
  page
    .locator('.f-drilldown__column')
    .filter({ has: page.locator('.f-drilldown__header').getByRole('heading', { name, exact: true, level: 2 }) });

test('each change saves through Livewire as it’s made, and an entry the server refuses says why in place', async ({
  page,
}) => {
  const errors = await openSettings(page);
  await expect(page.getByRole('region', { name: 'Mailbox', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Save|Revert/ })).toHaveCount(0);
  const name = page.getByLabel('Name', { exact: true });
  await expect(page.getByLabel('Signature', { exact: true })).toHaveAccessibleDescription(
    'Added below every reply from this mailbox.',
  );
  // Leaving the field saves it: the level's title follows, and so does a reload.
  await name.fill('Help desk');
  await name.blur();
  await expect(level(page, 'Help desk')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Help desk');
  // The server refuses an empty name: the Field says why, and the saved name stays.
  await name.fill('');
  await name.blur();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(/name field is required/);
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Help desk');
  expect(errors).toEqual([]);
});

test('the mailbox’s rows open its pages beside it in the URL, and a narrow window leads back', async ({ page }) => {
  const errors = await openSettings(page);
  // Each further page is a row with its current value: a link that opens in a new tab too.
  const connection = page.getByRole('link', { name: /^Connection/ });
  await expect(connection).toHaveText(/SMTP · smtp\.forma\.example/);
  await expect(connection).toHaveAttribute('href', '?section=connection');
  await expect(page.getByRole('link', { name: /^Auto Reply/ })).toHaveText(/Off/);
  await connection.click();
  await expect(page).toHaveURL(/section=connection/);
  await expect(level(page, 'Connection')).toBeVisible();
  await expect(level(page, 'Support')).toBeVisible();
  await expect(connection).toHaveAttribute('aria-current', 'page');
  // Beside the mailbox, the page needs no Back.
  await expect(level(page, 'Connection').locator('.f-back')).toBeHidden();
  await expect(page.getByRole('radio', { name: 'The server’s mail' })).toHaveAccessibleDescription(
    'Simple, but more likely to reach spam.',
  );
  await expect(page.getByLabel('Server', { exact: true })).toBeVisible();
  // A choice saves at once, and the row beside it shows it.
  await page.getByRole('radio', { name: 'The server’s mail' }).check();
  await expect(page.getByLabel('Server', { exact: true })).toHaveCount(0);
  await expect(connection).toHaveText(/The server’s mail/);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'The server’s mail' })).toBeChecked();

  await openSettings(page, '?section=auto-reply', 'Auto Reply');
  const reply = page.getByRole('switch', { name: 'Send an automatic reply' });
  await expect(reply).toHaveAccessibleDescription('To the first message of every new conversation.');
  await expect(page.getByLabel('Subject', { exact: true })).toBeDisabled();
  await reply.check();
  const subject = page.getByLabel('Subject', { exact: true });
  await expect(subject).toBeEnabled();
  await expect(page.getByRole('link', { name: /^Auto Reply/ })).toHaveText(/On/);
  // A rule only the server knows: a subject is required once automatic replies are on.
  await subject.fill('');
  await subject.blur();
  await expect(subject).toHaveAttribute('aria-invalid', 'true');
  await expect(subject).toHaveAccessibleDescription(/subject field is required/);
  await subject.fill('Thanks for writing');
  await subject.blur();
  await expect(subject).not.toHaveAttribute('aria-invalid');

  // A phone shows the page alone, with a Back Link to the mailbox that returns to its row.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(level(page, 'Support')).toBeHidden();
  const back = level(page, 'Auto Reply').getByRole('link', { name: 'Support' });
  await expect(back).toHaveAttribute('href', '?');
  await back.click();
  await expect(page).not.toHaveURL(/section=/);
  await expect(level(page, 'Auto Reply')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Auto Reply/ })).toBeFocused();
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark']) {
  test(`the Livewire settings are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const [query, heading] of [
      ['', 'Support'],
      ['?section=connection', 'Connection'],
      ['?section=auto-reply', 'Auto Reply'],
    ]) {
      await openSettings(page, query, heading);
      await expectAccessible(page);
    }
  });
}

test('Delete Mailbox asks with the layout confirmer before calling Livewire', async ({ page }) => {
  const errors = await openSettings(page);
  const dialog = page.getByRole('alertdialog', { name: 'Delete this mailbox?' });
  await page.getByRole('button', { name: 'Delete Mailbox…' }).click();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.f-toast')).toBeHidden();
  await page.getByRole('button', { name: 'Delete Mailbox…' }).click();
  await dialog.getByRole('button', { name: 'Delete Mailbox' }).click();
  await expect(page.locator('.f-toast')).toHaveText('This sample mailbox stays.');
  expect(errors).toEqual([]);
});

test('the forwarding address copies from its joined field', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permissions are a Chromium feature.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors = await openSettings(page, '?section=connection', 'Connection');
  await expect(page.getByLabel('Forwarding address', { exact: true })).toHaveValue(
    'support-7f3a@inbound.forma.example',
  );
  await page.getByRole('button', { name: 'Copy forwarding address' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('support-7f3a@inbound.forma.example');
  expect(errors).toEqual([]);
});
