import { test, expect } from '@playwright/test';
import { expectAccessible, tokenColor } from './helpers.js';

// The Support reference interface as a real Livewire 4 component (examples/laravel/support-desk.blade.php).
const host = 'http://127.0.0.1:5180';

async function openDesk(page, mailbox = 'all') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/support/${mailbox}`);
  await expect(page.getByRole('combobox', { name: 'Assigned To' })).toBeVisible();
  return errors;
}

const list = page => page.getByRole('list', { name: /All Open|Unassigned|Assigned to Me|Closed/ });
const conversation = page => page.getByRole('region', { name: 'Conversation', exact: true });

test('opening conversations re-renders enhanced controls without duplicating or exposing them', async ({ page }) => {
  const errors = await openDesk(page);
  const assignee = page.getByRole('combobox', { name: 'Assigned To' });
  await expect(assignee).toHaveValue('Alex Morgan');
  await expect(page.locator('#support-assignee')).toBeHidden();

  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('Sign-in after changing our domain');
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toHaveAttribute('aria-current', 'true');
  await expect(assignee).toHaveValue('Unassigned');
  // Assigned to and Merge into, each enhanced once.
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(2);
  // Cc and Bcc, each enhanced once.
  await expect(page.locator('.f-token-field__entry')).toHaveCount(2);
  await expect(page.locator('#support-assignee')).toBeHidden();
  await expect(page.locator('#support-cc')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a live combobox commit updates the server, the list and announces a toast', async ({ page }) => {
  const errors = await openDesk(page);
  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  const assignee = page.getByRole('combobox', { name: 'Assigned To' });
  await expect(assignee).toHaveValue('Unassigned');
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toContainText('Mia Patel');
  await expect(assignee).toHaveValue('Mia Patel');
  // The thread records the assignment as an event between messages.
  await expect(conversation(page).locator('.f-message-event')).toContainText('Alex Morgan assigned this to Mia Patel');
  const unassigned = page.getByRole('link', { name: /Unassigned/ });
  await expect(unassigned.locator('.f-badge')).toHaveText('2');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Assigned To' })).toHaveValue('Alex Morgan');
  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  await expect(page.getByRole('combobox', { name: 'Assigned To' })).toHaveValue('Mia Patel');
  expect(errors).toEqual([]);
});

test('server validation errors reach Field associations and clear after a valid reply', async ({ page }) => {
  const errors = await openDesk(page);
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(reply).toHaveAttribute('aria-invalid', 'true');
  await expect(reply).toHaveAccessibleDescription('Write a reply before sending.');

  // Cc and Bcc rows show on demand from the To row.
  await page.getByRole('button', { name: 'Cc/Bcc' }).click();
  const cc = page.getByRole('textbox', { name: 'Cc', exact: true });
  await expect(cc).toBeFocused();
  await cc.fill('not-an-address');
  await cc.press('Enter');
  await reply.fill('Thanks, we will move you over today.');
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(cc).toHaveAttribute('aria-invalid', 'true');
  await expect(cc).toHaveAccessibleDescription('The Cc field contains an invalid entry: not-an-address.');
  await expect(reply).not.toHaveAttribute('aria-invalid');
  await expect(reply).toHaveValue('Thanks, we will move you over today.');

  await page.getByRole('button', { name: 'Remove not-an-address' }).click();
  await cc.fill('studio@example.com');
  await cc.press('Enter');
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Sophie Chen.' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Messages' }).getByRole('listitem')).toHaveCount(2);
  // Newest first: the reply just sent leads the thread below the composer.
  await expect(page.getByRole('list', { name: 'Messages' }).getByRole('listitem').first()).toContainText(
    'Thanks, we will move you over today.',
  );
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
  await page.getByRole('button', { name: 'Close Conversation' }).click();
  const dialog = page.getByRole('dialog', { name: 'Close this conversation?' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Reason').selectOption('duplicate');
  await expect(dialog.locator('#close-summary')).toHaveText('It will move to Closed as duplicate.');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);

  await dialog.getByRole('button', { name: 'Close Conversation' }).click();
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
  await expect(page.getByRole('combobox', { name: 'Assigned To' })).toHaveValue('Unassigned');
  // Assigned to and Merge into, each enhanced once.
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(2);

  await page.goBack();
  await expect(page).toHaveURL(`${host}/support/all`);
  await expect(page.getByRole('combobox', { name: 'Assigned To' })).toHaveValue('Alex Morgan');
  // Assigned to and Merge into, each enhanced once.
  await expect(page.locator('.f-combobox input[role="combobox"]')).toHaveCount(2);
  expect(await page.evaluate(() => window.fruitNavigationMarker)).toBe(true);

  await page.getByRole('link', { name: /Assigned to Me/ }).click();
  await expect(page).toHaveURL(`${host}/support/mine`);
  await expect(list(page)).toHaveAccessibleName('Assigned to Me');
  const assignee = page.getByRole('combobox', { name: 'Assigned To' });
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

  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('calendar');
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await expect(list(page)).toContainText('Lena Wilson');
  await expect(pagination).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('nothing matches');
  await expect(page.getByRole('heading', { name: 'No Conversations' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark']) {
  test(`the Livewire Support desk is accessible in ${colorScheme} appearance, including its dialog`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openDesk(page);
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Close Conversation' }).click();
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
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(page.getByRole('button', { name: 'Send Reply' })).toHaveAttribute('data-loading', 'true');
  await expect(reply).toHaveAttribute('readonly');
  expect(await reply.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(before);
  await expect(page.getByRole('button', { name: 'Send Reply' })).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: 'Send Reply' })).toHaveCSS('cursor', 'progress');
  release();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Sophie Chen.' })).toBeVisible();
  await expect(reply).not.toHaveAttribute('readonly');
  expect(errors).toEqual([]);
});

test('a dialog bound with wire:model closes natively and reopens from the server', async ({ page }) => {
  const errors = await openDesk(page);
  const dialog = page.getByRole('dialog', { name: 'Close this conversation?' });
  await page.getByRole('button', { name: 'Close Conversation' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Close Conversation' }).click();
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
  const assignee = page.getByRole('combobox', { name: 'Assigned To' });
  await expect(assignee).toHaveValue('Alex Morgan');
  await expect(page.locator('#field-assignee, #support-assignee')).toBeHidden();
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Conversation' }).click();
  await expect(page.getByRole('dialog', { name: 'Close this conversation?' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Cmd/Ctrl+click and Shift+click select conversations and the list header becomes the selection bar', async ({
  page,
}) => {
  const errors = await openDesk(page);
  const bar = page.getByRole('region', { name: 'Selected conversations' });
  const row = name => list(page).getByRole('button', { name: new RegExp(name) });
  await expect(bar).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible();
  // The checkboxes stay out of sight until Select is pressed.
  const shown = name =>
    page.getByRole('checkbox', { name }).evaluate(input => input.closest('.f-check').getBoundingClientRect().width > 1);
  expect(await shown('Select Jordan Lee')).toBe(false);

  // Script-made ids (here the Assign menu's) survive server updates, so the menu is not replaced.
  await page.evaluate(() => (window.assignMenu = document.querySelector('.f-selection-bar [role="menu"]')));
  // The open conversation joins the first Cmd/Ctrl+click; Shift+click adds the range from there.
  await row('Jordan Lee').click({ modifiers: ['ControlOrMeta'] });
  await expect(bar.getByRole('status')).toHaveText('2 selected');
  expect(await page.evaluate(() => window.assignMenu.isConnected)).toBe(true);
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('A little help with our team plan');
  await row('Daniel Brooks').click({ modifiers: ['Shift'] });
  await expect(bar.getByRole('status')).toHaveText('4 selected');
  await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeHidden();
  await bar.getByRole('button', { name: 'Assign' }).click();
  await page.getByRole('menuitem', { name: 'Mia Patel' }).click();
  await expect(page.getByRole('status').filter({ hasText: '4 conversations assigned to Mia Patel.' })).toBeVisible();
  await expect(bar).toHaveCount(0);
  await expect(row('Daniel Brooks')).toContainText('Mia Patel');

  // Shift+arrows extend from the focused row; Escape clears; a plain click opens as usual.
  await row('Jordan Lee').focus();
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(bar.getByRole('status')).toHaveText('3 selected');
  await page.keyboard.press('Escape');
  await expect(bar).toHaveCount(0);
  await row('Emma Thompson').click();
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('A new home for our workspace');
  expect(errors).toEqual([]);
});

test('Select shows the checkboxes, a plain click toggles, and the chosen conversations close', async ({ page }) => {
  const errors = await openDesk(page);
  const select = page.getByRole('button', { name: 'Select', exact: true });
  await select.click();
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  const jordan = page.getByRole('checkbox', { name: 'Select Jordan Lee' });
  expect(await jordan.evaluate(input => input.closest('.f-check').getBoundingClientRect().width)).toBeGreaterThan(1);
  await list(page)
    .getByRole('button', { name: /Daniel Brooks/ })
    .click();
  await jordan.check();
  const bar = page.getByRole('region', { name: 'Selected conversations' });
  await expect(bar.getByRole('status')).toHaveText('2 selected');
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('A little help with our team plan');
  await bar.getByRole('button', { name: 'Close Selected' }).click();
  await expect(page.getByRole('status').filter({ hasText: '2 conversations closed.' })).toBeVisible();
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Closed/ }).locator('.f-badge')).toHaveText('2');
  // Select mode survives the server re-render.
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('mention autocomplete survives Livewire re-renders and its insertion reaches the server', async ({ page }) => {
  const errors = await openDesk(page);
  const assignee = page.getByRole('combobox', { name: 'Assigned To' });
  await assignee.fill('Mia');
  await assignee.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Assigned to Mia Patel.' })).toBeVisible();
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  await expect(reply).toHaveAttribute('aria-autocomplete', 'list');
  await reply.fill('Looping in @no');
  await page.getByRole('option', { name: /Noah Williams/ }).click();
  await expect(reply).toHaveValue('Looping in @noah ');
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(page.getByRole('list', { name: 'Messages' })).toContainText('Looping in @noah');
  await expect(reply).toHaveAttribute('aria-autocomplete', 'list');
  expect(errors).toEqual([]);
});

test('the command palette navigates with wire:navigate and runs Livewire actions', async ({ page }) => {
  const errors = await openDesk(page);
  await page.evaluate(() => {
    window.fruitNavigationMarker = true;
  });
  await page.keyboard.press('ControlOrMeta+k');
  const palette = page.getByRole('dialog', { name: 'Go To' });
  await palette.getByRole('combobox').fill('unas');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`${host}/support/unassigned`);
  expect(await page.evaluate(() => window.fruitNavigationMarker)).toBe(true);
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('dialog', { name: 'Go To' }).getByRole('combobox').fill('close conv');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Close this conversation?' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('changing page scrolls the conversation pane back to the start of the list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  const errors = await openDesk(page);
  // A short workspace makes the list scroll; a stylesheet survives Livewire morphs.
  await page.addStyleTag({ content: '.support-desk .f-workspace { --f-workspace-height: 420px !important; }' });
  const pane = page.getByRole('region', { name: 'Conversations' }).locator('.f-pane__scroll');
  await pane.evaluate(element => element.scrollTo({ top: element.scrollHeight }));
  expect(await pane.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('navigation', { name: 'Pagination' }).getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('5–7 of 7');
  await expect.poll(() => pane.evaluate(element => element.scrollTop)).toBe(0);
  expect(errors).toEqual([]);
});

test('a persisted sidebar keeps its element across wire:navigate and follows the current page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${host}/shell/inbox`);
  const sidebar = page.getByRole('navigation', { name: 'App' });
  await sidebar.evaluate(element => {
    element.dataset.marker = 'kept';
  });
  const inbox = sidebar.getByRole('link', { name: 'Inbox' });
  const preferences = sidebar.getByRole('link', { name: 'Preferences' });
  await expect(inbox).toHaveAttribute('aria-current', 'page');
  const current = await inbox.evaluate(element => getComputedStyle(element).backgroundColor);
  await preferences.click();
  await expect(page).toHaveURL(`${host}/shell/preferences`);
  await expect(page.getByRole('switch', { name: 'Show message previews' })).toBeVisible();
  await expect(sidebar).toHaveAttribute('data-marker', 'kept');
  // The persisted markup keeps its server aria-current; Livewire's data-current shows the page.
  await expect(preferences).toHaveAttribute('data-current', '');
  await expect(inbox).not.toHaveAttribute('data-current');
  await expect(preferences).toHaveCSS('background-color', current);
  expect(errors).toEqual([]);
});

test('the lazy history island loads behind a skeleton, follows the open ticket and skips other updates', async ({
  page,
}) => {
  const errors = await openDesk(page);
  const history = conversation(page).getByRole('region', { name: 'Earlier Conversations' });
  await expect(history.getByRole('list', { name: 'Earlier Conversations' })).toContainText('Moving to annual billing');
  await expect(history).not.toHaveAttribute('aria-busy');
  await expect(conversation(page).locator('.f-skeleton')).toHaveCount(0);

  await list(page)
    .getByRole('button', { name: /Jordan Lee/ })
    .click();
  await expect(history).toContainText('No earlier conversations with Jordan Lee.');
  await list(page)
    .getByRole('button', { name: /Emma Thompson/ })
    .click();
  await expect(history).toContainText('Exporting last year’s projects');

  // An unrelated update re-renders the component but leaves the island's DOM alone.
  await history.evaluate(element => (element.dataset.probe = 'kept'));
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('Emma');
  await expect(list(page).getByRole('button')).toHaveCount(1);
  await expect(history).toHaveAttribute('data-probe', 'kept');
  await expect(history).toContainText('Exporting last year’s projects');
  expect(errors).toEqual([]);
});

test('a ticket row context menu runs Livewire actions for that ticket', async ({ page }) => {
  const errors = await openDesk(page);
  const row = list(page).getByRole('button', { name: /Jordan Lee/ });
  await row.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Conversation actions' }).filter({ visible: true });
  await menu.getByRole('menuitem', { name: 'Close Conversation' }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 conversation closed.' })).toBeVisible();
  await expect(list(page).getByRole('button', { name: /Jordan Lee/ })).toHaveCount(0);

  await list(page)
    .getByRole('button', { name: /Emma Thompson/ })
    .click({ button: 'right' });
  await menu.getByRole('menuitem', { name: 'Open Conversation' }).click();
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('A new home for our workspace');
  expect(errors).toEqual([]);
});

test('a message action quotes it into the Livewire reply', async ({ page }) => {
  const errors = await openDesk(page);
  const message = conversation(page).getByRole('article', { name: 'Message from Sophie Chen' });
  await message.hover();
  await message.getByRole('button', { name: 'Quote Sophie Chen in reply', exact: true }).click();
  const reply = page.getByRole('textbox', { name: 'Reply to Sophie Chen' });
  await expect(reply).toHaveValue(/^> We’re growing the studio/);
  await expect(reply).toBeFocused();
  expect(errors).toEqual([]);
});

test('the Cc field asks the server for contacts while typing and adds the chosen address', async ({ page }) => {
  const errors = await openDesk(page);
  await page.getByRole('button', { name: 'Cc/Bcc' }).click();
  const cc = page.getByRole('textbox', { name: 'Cc', exact: true });
  await cc.pressSequentially('ortiz');
  const option = page.getByRole('listbox', { name: 'Suggestions' }).getByRole('option', { name: /Ana Ortiz/ });
  await expect(option).toBeVisible();
  // Server results show as supplied: "ortiz" matches the name, not the start of the address.
  await expect(option).toContainText('ana@studio-north.example');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove ana@studio-north.example' })).toBeVisible();
  await expect(cc).toHaveValue('');
  await page.getByRole('textbox', { name: 'Reply to Sophie Chen' }).fill('Looping in Ana from your team.');
  await page.getByRole('button', { name: 'Send Reply' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Sophie Chen.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove ana@studio-north.example' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Merge into searches conversations on the server and keeps the choice while results change', async ({ page }) => {
  const errors = await openDesk(page);
  const merge = page.getByRole('combobox', { name: 'Merge Into' });
  await page.getByRole('button', { name: 'Merge', exact: true }).click();
  await expect(merge).toHaveAccessibleDescription(/Choose a conversation to merge into\./);

  await merge.pressSequentially('invoices');
  const list = page.getByRole('listbox', { name: 'Merge Into' });
  await expect(list.getByRole('option')).toHaveText(['#1039 Invoices for last quarter · Daniel Brooks']);
  await page.keyboard.press('Enter');
  await expect(merge).toHaveValue('#1039 Invoices for last quarter · Daniel Brooks');

  // A new search replaces the results while the list stays open; the chosen conversation stays.
  await merge.fill('');
  await merge.pressSequentially('calendar');
  await expect(list.getByRole('option')).toHaveText([
    '#1039 Invoices for last quarter · Daniel Brooks',
    '#1036 Calendar sync stopped · Lena Wilson',
  ]);
  await expect(list).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(merge).toHaveValue('#1039 Invoices for last quarter · Daniel Brooks');
  await page.getByRole('button', { name: 'Merge', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Conversation #1042 merged into #1039.' })).toBeVisible();
  await expect(merge).toHaveValue('');
  expect(errors).toEqual([]);
});

test('a chat-channel conversation opens in the Chat view at its newest message and follows replies', async ({
  page,
}) => {
  const errors = await openDesk(page);
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('Lena');
  await list(page)
    .getByRole('button', { name: /Lena Wilson/ })
    .click();
  const history = conversation(page).getByRole('region', { name: 'Chat with Lena Wilson' });
  await expect(history).toBeVisible();
  // A chat's header leads with the person and the channel, not a subject; its history and composer
  // sit on the chat surface, apart from an email's plain one.
  await expect(conversation(page).getByRole('heading', { level: 1 })).toHaveText('Lena Wilson');
  await expect(conversation(page).locator('.f-toolbar')).toContainText('Website Chat');
  const surface = await tokenColor(page, '--f-grouped-background');
  await expect(history).toHaveCSS('background-color', surface);
  await expect(conversation(page).locator('.f-composer')).toHaveCSS('background-color', surface);
  expect(await history.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  const fromEnd = () => history.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight);
  // Oldest first; the history opens at the newest message.
  const messages = history.getByRole('article');
  await expect(messages.first()).toContainText('Since Monday new events no longer appear');
  await expect(messages.last()).toContainText('last week’s are still missing');
  // A run from one person shows the name once; the second message keeps it for screen readers.
  const followUp = messages.filter({ hasText: 'Let me ask Noah' });
  await expect(followUp).toHaveClass(/f-message--continued/);
  await expect(followUp.locator('.f-message__author')).toHaveText('Alex Morgan');
  expect(
    await followUp.locator('.f-message__identity').evaluate(element => element.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(1);
  await expect(followUp.locator('.f-message__time')).toHaveCSS('opacity', '0');
  await followUp.hover();
  await expect(followUp.locator('.f-message__time')).toHaveCSS('opacity', '1');
  await expect.poll(fromEnd).toBeLessThan(2);
  // Enter sends from the docked composer; Livewire's re-render adds the reply at the bottom, in view.
  const composer = conversation(page).getByRole('textbox', { name: 'Message Lena Wilson' });
  await composer.fill('Thanks! I’ll restore last week’s events from the backup now.');
  await composer.press('Enter');
  await expect(messages.last()).toContainText('restore last week’s events');
  await expect.poll(fromEnd).toBeLessThan(2);
  await expect(composer).toHaveValue('');
  // A too-short reply keeps the error with the composer.
  await composer.fill('Hi');
  await composer.press('Enter');
  await expect(composer).toHaveAttribute('aria-invalid', 'true');
  await expect(conversation(page).getByText('Write at least three characters.')).toBeVisible();
  await expectAccessible(page, '.support-desk');
  expect(errors).toEqual([]);
});
