import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// The Support reference interface as a real Livewire 4 component (examples/laravel/support-desk.blade.php).
const host = 'http://127.0.0.1:5180';

async function openDesk(page, mailbox = 'all') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/support/${mailbox}`);
  await expect(page.getByRole('combobox', { name: 'Assigned to' })).toBeVisible();
  return errors;
}

const list = page => page.getByRole('list', { name: /All open|Unassigned|Assigned to me|Closed/ });
const conversation = page => page.getByRole('region', { name: 'Conversation', exact: true });

test('opening conversations re-renders enhanced controls without duplicating or exposing them', async ({ page }) => {
  const errors = await openDesk(page);
  const assignee = page.getByRole('combobox', { name: 'Assigned to' });
  await expect(assignee).toHaveValue('Alex Morgan');
  await expect(page.locator('#support-assignee')).toBeHidden();

  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('Sign-in after changing our domain');
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toHaveAttribute('aria-current', 'true');
  await expect(assignee).toHaveValue('Unassigned');
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(1);
  await expect(page.locator('.f-token-field__entry')).toHaveCount(1);
  await expect(page.locator('#support-assignee')).toBeHidden();
  await expect(page.locator('#support-cc')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a live combobox commit updates the server, the list and announces a toast', async ({ page }) => {
  const errors = await openDesk(page);
  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  const assignee = page.getByRole('combobox', { name: 'Assigned to' });
  await expect(assignee).toHaveValue('Unassigned');
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toContainText('Mia Patel');
  await expect(assignee).toHaveValue('Mia Patel');
  const unassigned = page.getByRole('link', { name: /Unassigned/ });
  await expect(unassigned.locator('.f-badge')).toHaveText('2');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Assigned to' })).toHaveValue('Alex Morgan');
  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  await expect(page.getByRole('combobox', { name: 'Assigned to' })).toHaveValue('Mia Patel');
  expect(errors).toEqual([]);
});

test('server validation errors reach Field associations and clear after a valid reply', async ({ page }) => {
  const errors = await openDesk(page);
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(reply).toHaveAttribute('aria-invalid', 'true');
  await expect(reply).toHaveAccessibleDescription('Write a reply before sending.');

  const cc = page.getByRole('textbox', { name: 'Cc' });
  await cc.fill('not-an-address');
  await cc.press('Enter');
  await reply.fill('Thanks, we will move you over today.');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(cc).toHaveAttribute('aria-invalid', 'true');
  await expect(cc).toHaveAccessibleDescription(
    /Enter or comma adds an address\. “not-an-address” is not an email address\./,
  );
  await expect(reply).not.toHaveAttribute('aria-invalid');
  await expect(reply).toHaveValue('Thanks, we will move you over today.');

  await page.getByRole('button', { name: 'Remove not-an-address' }).click();
  await cc.fill('studio@example.com');
  await cc.press('Enter');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Sophie Chen.' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Messages' }).getByRole('listitem')).toHaveCount(2);
  await expect(reply).toHaveValue('');
  await expect(reply).not.toHaveAttribute('aria-invalid');
  await expect(cc).not.toHaveAttribute('aria-invalid');
  await expect(page.getByRole('button', { name: 'Remove studio@example.com' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a server-opened dialog stays open through morphs, then closing redirects with a flashed toast', async ({
  page,
}) => {
  const errors = await openDesk(page);
  await page.evaluate(() => {
    window.fruitNavigationMarker = true;
  });
  await page.getByRole('button', { name: 'Close conversation' }).click();
  const dialog = page.getByRole('dialog', { name: 'Close this conversation?' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Reason').selectOption('duplicate');
  await expect(dialog.locator('#close-summary')).toHaveText('It will move to Closed as duplicate.');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);

  await dialog.getByRole('button', { name: 'Close conversation' }).click();
  await expect(page).toHaveURL(`${host}/support/closed`);
  await expect(page.getByRole('status').filter({ hasText: 'Conversation #1042 closed as duplicate.' })).toBeVisible();
  await expect(conversation(page).getByRole('alert').or(conversation(page).locator('.f-alert'))).toContainText(
    'closed as duplicate',
  );
  await expect(page.getByRole('link', { name: /Closed/ })).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => window.fruitNavigationMarker)).toBe(true);
  expect(errors).toEqual([]);
});

test('wire:navigate swaps mailboxes without reloading and enhancements initialize once', async ({ page }) => {
  const errors = await openDesk(page);
  await page.evaluate(() => {
    window.fruitNavigationMarker = true;
  });
  await page.getByRole('link', { name: /Unassigned/ }).click();
  await expect(page).toHaveURL(`${host}/support/unassigned`);
  await expect(list(page)).toHaveAccessibleName('Unassigned');
  await expect(list(page).getByRole('listitem')).toHaveCount(3);
  await expect(page.getByRole('link', { name: /Unassigned/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('combobox', { name: 'Assigned to' })).toHaveValue('Unassigned');
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(`${host}/support/all`);
  await expect(page.getByRole('combobox', { name: 'Assigned to' })).toHaveValue('Alex Morgan');
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.fruitNavigationMarker)).toBe(true);

  await page.getByRole('link', { name: /Assigned to me/ }).click();
  await expect(page).toHaveURL(`${host}/support/mine`);
  await expect(list(page)).toHaveAccessibleName('Assigned to me');
  const assignee = page.getByRole('combobox', { name: 'Assigned to' });
  await assignee.fill('Noah');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Noah Williams.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('search and Livewire pagination use the FruitUI paginator view', async ({ page }) => {
  const errors = await openDesk(page);
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expect(pagination).toContainText('1–4 of 7');
  await expect(pagination.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  await pagination.getByRole('button', { name: 'Next' }).click();
  await expect(pagination).toContainText('5–7 of 7');
  await expect(pagination.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  await expect(list(page).getByRole('listitem')).toHaveCount(3);
  await expect(pagination.getByRole('button', { name: 'Next' })).toBeDisabled();

  await page.getByRole('searchbox', { name: 'Search conversations' }).fill('calendar');
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await expect(list(page)).toContainText('Lena Wilson');
  await expect(pagination).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search conversations' }).fill('nothing matches');
  await expect(page.getByRole('heading', { name: 'No conversations' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark']) {
  test(`the Livewire Support desk is accessible in ${colorScheme} appearance, including its dialog`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openDesk(page);
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectAccessible(page, 'dialog');
  });
}

test('controls keep their appearance while Livewire locks a submitting form', async ({ page }) => {
  const errors = await openDesk(page);
  let release;
  const held = new Promise(resolve => (release = resolve));
  await page.route('**/livewire*/update', async route => {
    await held;
    await route.continue();
  });
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  const before = await reply.evaluate(element => getComputedStyle(element).backgroundColor);
  await reply.fill('Thanks, we will move you over today.');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByRole('button', { name: 'Send reply' })).toHaveAttribute('data-loading', 'true');
  await expect(reply).toHaveAttribute('readonly');
  expect(await reply.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(before);
  await expect(page.getByRole('button', { name: 'Send reply' })).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: 'Send reply' })).toHaveCSS('cursor', 'progress');
  release();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Sophie Chen.' })).toBeVisible();
  await expect(reply).not.toHaveAttribute('readonly');
  expect(errors).toEqual([]);
});

test('a dialog bound with wire:model closes natively and reopens from the server', async ({ page }) => {
  const errors = await openDesk(page);
  const dialog = page.getByRole('dialog', { name: 'Close this conversation?' });
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test('Livewire marks the current wire:navigate link and FruitUI styles it', async ({ page }) => {
  await openDesk(page);
  const unassigned = page.getByRole('link', { name: /Unassigned/ });
  const idle = await unassigned.evaluate(element => getComputedStyle(element).backgroundColor);
  await unassigned.click();
  await expect(page).toHaveURL(`${host}/support/unassigned`);
  await expect(unassigned).toHaveAttribute('data-current', '');
  await expect(unassigned).not.toHaveCSS('background-color', idle);
});

test('the desk works with Livewire’s injected scripts and the self-registering FruitUI entry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/injected/support/all`);
  const assignee = page.getByRole('combobox', { name: 'Assigned to' });
  await expect(assignee).toHaveValue('Alex Morgan');
  await expect(page.locator('#field-assignee, #support-assignee')).toBeHidden();
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await expect(page.getByRole('dialog', { name: 'Close this conversation?' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('bulk selection shows the selection bar and closes the chosen conversations', async ({ page }) => {
  const errors = await openDesk(page);
  await expect(page.getByRole('region', { name: 'Selected conversations' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Select Jordan Lee' }).check();
  await page.getByRole('checkbox', { name: 'Select Daniel Brooks' }).check();
  const bar = page.getByRole('region', { name: 'Selected conversations' });
  await expect(bar.getByRole('status')).toHaveText('2 selected');
  await bar.getByRole('button', { name: 'Close selected' }).click();
  await expect(page.getByRole('status').filter({ hasText: '2 conversations closed.' })).toBeVisible();
  await expect(bar).toHaveCount(0);
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Closed/ }).locator('.f-badge')).toHaveText('2');
  expect(errors).toEqual([]);
});

test('mention autocomplete survives Livewire re-renders and its insertion reaches the server', async ({ page }) => {
  const errors = await openDesk(page);
  const assignee = page.getByRole('combobox', { name: 'Assigned to' });
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  await expect(reply).toHaveAttribute('aria-autocomplete', 'list');
  await reply.fill('Looping in @no');
  await page.getByRole('option', { name: /Noah Williams/ }).click();
  await expect(reply).toHaveValue('Looping in @noah ');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByRole('list', { name: 'Messages' })).toContainText('Looping in @noah');
  await expect(reply).toHaveAttribute('aria-autocomplete', 'list');
  expect(errors).toEqual([]);
});
