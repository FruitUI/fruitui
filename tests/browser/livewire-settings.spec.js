import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// Mailbox settings as a real Livewire 4 component (examples/laravel/settings.blade.php).
const host = 'http://127.0.0.1:5180';

async function openSettings(page, query = '') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/settings${query}`);
  await expect(page.getByRole('heading', { name: 'Support Mailbox', level: 1 })).toBeVisible();
  return errors;
}

test('grouped Field rows save through Livewire, report errors in place and show unsaved changes', async ({ page }) => {
  const errors = await openSettings(page);
  await expect(page.getByRole('region', { name: 'Mailbox' })).toBeVisible();
  const name = page.getByLabel('Name', { exact: true });
  await expect(page.getByLabel('Signature', { exact: true })).toHaveAccessibleDescription(
    'Added below every reply from this mailbox.',
  );
  await expect(page.getByText('Changes are saved when you press Save.')).toBeVisible();
  await name.fill('Help desk');
  await expect(page.getByText('You have unsaved changes.')).toBeVisible();
  // An empty required field is stopped by the browser before Livewire is called.
  await name.fill('');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await name.evaluate(input => input.validity.valueMissing)).toBe(true);
  await name.fill('Help desk');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.f-toast')).toHaveText('Settings saved.');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Help desk');
  expect(errors).toEqual([]);
});

test('mailbox tabs live in the URL and choices change the rows that follow', async ({ page }) => {
  const errors = await openSettings(page);
  const tabs = page.getByRole('navigation', { name: 'Mailbox settings' });
  await tabs.getByRole('link', { name: 'Connection' }).click();
  await expect(page).toHaveURL(/tab=connection/);
  await expect(tabs.getByRole('link', { name: 'Connection' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('radio', { name: 'The server’s mail' })).toHaveAccessibleDescription(
    'Simple, but more likely to reach spam.',
  );
  await expect(page.getByLabel('Server', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'The server’s mail' }).check();
  await expect(page.getByLabel('Server', { exact: true })).toHaveCount(0);

  await openSettings(page, '?tab=auto-reply');
  const reply = page.getByRole('switch', { name: 'Send an automatic reply' });
  await expect(reply).toHaveAccessibleDescription('To the first message of every new conversation.');
  await expect(page.getByLabel('Subject', { exact: true })).toBeDisabled();
  await reply.check();
  const subject = page.getByLabel('Subject', { exact: true });
  await expect(subject).toBeEnabled();
  // A rule only the server knows: a subject is required once automatic replies are on.
  await subject.fill('');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(subject).toHaveAttribute('aria-invalid', 'true');
  await expect(subject).toHaveAccessibleDescription(/subject field is required/);
  await subject.fill('Thanks for writing');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(subject).not.toHaveAttribute('aria-invalid');
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark']) {
  test(`the Livewire settings are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const tab of ['general', 'connection', 'auto-reply']) {
      await openSettings(page, `?tab=${tab}`);
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
  const errors = await openSettings(page, '?tab=connection');
  await expect(page.getByLabel('Forwarding address', { exact: true })).toHaveValue(
    'support-7f3a@inbound.forma.example',
  );
  await page.getByRole('button', { name: 'Copy forwarding address' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('support-7f3a@inbound.forma.example');
  expect(errors).toEqual([]);
});
