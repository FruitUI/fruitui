import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

const combo = page => page.getByRole('combobox', { name: 'Assign conversation' });
const tokens = page => page.getByRole('textbox', { name: 'Recipients', exact: true });
const signature = page => page.getByRole('textbox', { name: 'Reply signature', exact: true });
const value = (page, form, name) => page.locator(form).evaluate((form, name) => new FormData(form).get(name), name);

const runtimeErrors = new WeakMap();
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) || []).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/components.html');
  await expect(combo(page)).toBeVisible();
  await expect(signature(page)).toHaveAttribute('contenteditable', 'true');
  expect(errors).toEqual([]);
});

test('searchable choice keeps one native value and skips disabled options', async ({ page }) => {
  await combo(page).fill('Mia');
  await expect(page.getByRole('option', { name: 'Mia Patel' })).toBeVisible();
  await combo(page).press('Enter');
  await expect(combo(page)).toHaveValue('Mia Patel');
  expect(await value(page, '#combobox-example', 'assignee')).toBe('mia');
  await combo(page).click();
  await expect(page.getByRole('option', { name: 'Noah Williams' })).toHaveCount(0);
  await combo(page).press('ArrowUp');
  await combo(page).press('Enter');
  expect(await value(page, '#combobox-example', 'assignee')).toBe('alex');
});

test('choice Escape cancels pending search; external model changes and reset update the query', async ({ page }) => {
  await combo(page).fill('unmatched');
  await expect(page.locator('#component-combobox')).toContainText('No matches');
  await combo(page).press('Escape');
  await expect(combo(page)).toHaveValue('Support team');
  await page.getByRole('button', { name: 'Assign Mia externally' }).click();
  await expect(combo(page)).toHaveValue('Mia Patel');
  await page.getByRole('button', { name: 'Reset choice' }).click();
  await expect(combo(page)).toHaveValue('Support team');
  expect(await value(page, '#combobox-example', 'assignee')).toBe('support');
});

test('enhanced required validation focuses the visible query; disabled values stay out of submission', async ({
  page,
}) => {
  await page.locator('#gallery-assignee').evaluate(select => {
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#combobox-example').evaluate(form => form.requestSubmit());
  await expect(combo(page)).toBeFocused();
  await expect(combo(page)).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#gallery-assignee').evaluate(select => {
    select.disabled = true;
  });
  await expect(combo(page)).toBeDisabled();
  expect(await value(page, '#combobox-example', 'assignee')).toBeNull();
});

test('token entry publishes a newline string, rejects invalid entries, and supports keyboard removal', async ({
  page,
}) => {
  await tokens(page).fill('mia@example.com');
  await tokens(page).press('Enter');
  expect(await value(page, '#token-example', 'recipients')).toBe('sophie@example.com\nmia@example.com');
  await tokens(page).fill('bad-address');
  await tokens(page).press(',');
  await expect(tokens(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#component-token-field [role=status]')).toHaveText('Enter an email address.');
  expect(await value(page, '#token-example', 'recipients')).not.toContain('bad-address');
  await tokens(page).press('Escape');
  await tokens(page).press('Backspace');
  const remove = page.getByRole('button', { name: 'Remove mia@example.com' });
  await expect(remove).toBeFocused();
  await remove.press('Enter');
  await expect(tokens(page)).toBeFocused();
  expect(await value(page, '#token-example', 'recipients')).toBe('sophie@example.com');
});

test('pasted tokens deduplicate and external updates, readonly, and resets preserve native state', async ({ page }) => {
  await tokens(page).evaluate(input => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', 'sophie@example.com,mia@example.com\nnoah@example.com');
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    // Firefox discards clipboardData in synthetic constructors. Supply the native event interface.
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    input.dispatchEvent(event);
  });
  expect(await value(page, '#token-example', 'recipients')).toBe(
    'sophie@example.com\nmia@example.com\nnoah@example.com',
  );
  await page.getByRole('button', { name: 'Set recipients externally' }).click();
  await expect(page.locator('#component-token-field .f-chip')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Remove mia@example.com' })).toBeVisible();
  await page.locator('#gallery-recipients').evaluate(textarea => {
    textarea.readOnly = true;
  });
  await expect(tokens(page)).toHaveAttribute('readonly');
  await expect(page.getByRole('button', { name: 'Remove mia@example.com' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset recipients' }).click();
  expect(await value(page, '#token-example', 'recipients')).toBe('sophie@example.com');
});

test('menu opens with arrows, skips disabled commands, supports typeahead and restores focus', async ({ page }) => {
  const root = page.locator('#component-menu');
  const trigger = root.getByText('More actions', { exact: true });
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(root.getByRole('menuitem', { name: 'Archive', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(root.getByRole('menuitem', { name: 'Mark unread' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(root.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
  await page.keyboard.press('a');
  await expect(root.getByRole('menuitem', { name: 'Archive', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('ArrowUp');
  await page.keyboard.press('Space');
  await expect(root.getByRole('status')).toHaveText('Deleted');
  await expect(trigger).toBeFocused();
});

test('menu Tab leaves and outside dismissal closes; tooltip responds to focus and Escape', async ({ page }) => {
  const root = page.locator('#component-menu');
  const trigger = root.getByText('More actions', { exact: true });
  await trigger.click();
  await page.keyboard.press('Tab');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.locator('#component-menu h2').click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const tooltip = page.getByRole('tooltip');
  const button = page.locator('#component-tooltip button');
  await button.focus();
  await expect(tooltip).toBeVisible();
  await button.press('Escape');
  await expect(tooltip).toBeHidden();
  await button.press('Tab');
  await button.focus();
  await expect(tooltip).toBeVisible();
  await button.press('Tab');
  await button.hover();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
});

test('in-page tabs change panels with keyboard while section links stay links', async ({ page }) => {
  const profile = page.getByRole('tab', { name: 'Profile', exact: true });
  await profile.focus();
  await profile.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'History' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Two conversations');
  await page.keyboard.press('Home');
  await expect(profile).toBeFocused();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#component-section-nav a')).toHaveCount(3);
  await expect(page.locator('#component-section-nav [role=tab]')).toHaveCount(0);
});

test('rich editing submits HTML and supports formatting, external updates, reset and readonly', async ({ page }) => {
  await signature(page).fill('Hello Sophie');
  await signature(page).press('ControlOrMeta+a');
  await page.locator('#component-editor').getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(signature(page).locator('strong')).toHaveText('Hello Sophie');
  expect(await value(page, '#editor-example', 'signature')).toContain('<strong>Hello Sophie</strong>');
  await page.getByRole('button', { name: 'Set signature externally' }).click();
  await expect(signature(page)).toHaveText('Mia Patel');
  await page.getByRole('button', { name: 'Reset signature' }).click();
  await expect(signature(page)).toContainText('Alex Morgan');
  await page.locator('#gallery-editor').evaluate(textarea => {
    textarea.readOnly = true;
  });
  await expect(signature(page)).toHaveAttribute('contenteditable', 'false');
  await expect(page.locator('#component-editor').getByRole('button', { name: 'Bold', exact: true })).toBeDisabled();
  await page.locator('#gallery-editor').evaluate(textarea => {
    textarea.disabled = true;
  });
  await expect(signature(page)).toHaveAttribute('tabindex', '-1');
  expect(await value(page, '#editor-example', 'signature')).toBeNull();
});

test('upload composition reads real files and supports cancel, retry, error and removal', async ({ page }) => {
  const root = page.locator('#component-upload');
  await root
    .locator('input[type=file]')
    .setInputFiles({ name: 'brief.txt', mimeType: 'text/plain', buffer: Buffer.from('FruitUI brief') });
  await expect(root.locator('.f-upload__row')).toContainText('brief.txt');
  await root.getByRole('button', { name: 'Cancel brief.txt' }).click();
  await expect(root.locator('.f-upload__row')).toHaveAttribute('data-state', 'cancelled');
  await root.getByRole('button', { name: 'Retry' }).click();
  await root.getByRole('button', { name: 'Simulate error' }).click();
  await expect(root.locator('.f-upload__row')).toHaveAttribute('data-state', 'error');
  await root.getByRole('button', { name: 'Retry' }).click();
  await expect(root.locator('.f-upload__row')).toHaveAttribute('data-state', 'complete', { timeout: 7000 });
  await expect(root.getByRole('link', { name: 'Download local file' })).toHaveAttribute('href', /^blob:/);
  await root.getByRole('button', { name: 'Remove brief.txt' }).click();
  await expect(root.locator('.f-upload__row')).toHaveCount(0);
});

for (const scheme of ['light', 'dark']) {
  test(`new controls remain accessible and fit a small phone in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 320, height: 800 });
    await combo(page).click();
    await expect(page.locator('#component-combobox').getByRole('listbox')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expectAccessible(
      page,
      '#component-combobox',
      '#component-token-field',
      '#component-editor',
      '#component-tabs',
      '#component-alert',
      '#component-pagination',
      '#component-prose',
    );
  });
}

test('helper destruction restores the native controls and removes generated UI', async ({ page }) => {
  await page
    .locator('#component-combobox .f-combobox, #component-token-field .f-token-field, #component-editor .f-editor')
    .evaluateAll(async roots => {
      const { default: Alpine } = await import('/node_modules/alpinejs/dist/module.esm.js');
      for (const root of roots) Alpine.destroyTree(root);
    });
  await expect(page.locator('#gallery-assignee')).toBeVisible();
  await expect(page.locator('#component-combobox input[role=combobox]')).toHaveCount(0);
  await expect(page.locator('#gallery-recipients')).toBeVisible();
  await expect(page.locator('#component-token-field .f-token-field__entry')).toHaveCount(0);
  await expect(page.locator('#gallery-editor')).toBeVisible();
  await expect(page.locator('#component-editor .tiptap')).toHaveCount(0);
});

test('forced colors preserve choice focus and reduced motion slows activity animation', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await combo(page).focus();
  await combo(page).press('ArrowDown');
  const active = await combo(page).getAttribute('aria-activedescendant');
  await expect(page.locator(`[id="${active}"]`)).toBeVisible();
  await expect(combo(page)).toBeFocused();
  const spinner = page.locator('#component-spinner .f-spinner');
  // Activity indicators keep showing progress under reduced motion, more slowly.
  expect(await spinner.evaluate(el => getComputedStyle(el).animationDuration)).toBe('2.4s');
  await combo(page).press('Enter');
  expect(await value(page, '#combobox-example', 'assignee')).not.toBeNull();
});

test.describe('CSS-only fallbacks', () => {
  // A separate context checks the same serialized controls without enhancement.
  test('single choice and serialized token/HTML values remain native editable controls', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/components.html');
    await expect(page.locator('#gallery-assignee')).toBeVisible();
    await page.locator('#gallery-assignee').selectOption('mia');
    expect(await value(page, '#combobox-example', 'assignee')).toBe('mia');
    await expect(page.locator('#gallery-recipients')).toBeVisible();
    await page.locator('#gallery-recipients').fill('alex@example.com\nmia@example.com');
    expect(await value(page, '#token-example', 'recipients')).toBe('alex@example.com\nmia@example.com');
    await expect(page.locator('#gallery-editor')).toBeVisible();
    await expect(page.locator('#gallery-editor')).toHaveValue('<p>Thanks,<br><strong>Alex Morgan</strong></p>');
    await context.close();
  });
});

test('menus include groups, separators, checked items, links and shortcut hints', async ({ page }) => {
  const root = page.locator('#component-menu-item');
  const trigger = root.getByText('View', { exact: true });
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(root.getByRole('menuitemradio', { name: 'Date' })).toBeFocused();
  await expect(root.getByRole('menuitemradio', { name: 'Date' })).toHaveAttribute('aria-checked', 'true');
  await expect(root.getByRole('group', { name: 'Sort by' })).toBeVisible();
  await expect(root.getByRole('separator')).toHaveCount(2);
  await page.keyboard.press('s');
  await expect(root.getByRole('menuitemradio', { name: 'Sender' })).toBeFocused();
  // Typeahead accumulates and ignores the shortcut hint.
  await page.keyboard.press('h');
  await expect(root.getByRole('menuitemcheckbox', { name: 'Show previews' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();
  await expect(root.getByText('Sorted by date, without previews')).toBeVisible();
  await trigger.press('ArrowUp');
  await expect(root.getByRole('menuitem', { name: 'Open Support' })).toBeFocused();
  await page.keyboard.press('Escape');
  await trigger.click();
  await root.getByRole('menuitemradio', { name: 'Sender' }).click();
  await expect(root.getByText('Sorted by sender, without previews')).toBeVisible();
  await trigger.click();
  await expect(root.getByRole('menuitemradio', { name: 'Sender' })).toHaveAttribute('aria-checked', 'true');
  await expect(root.getByRole('menuitemcheckbox', { name: 'Show previews' })).toHaveAttribute('aria-checked', 'false');
});

test('autocomplete suggests mentions and saved replies and inserts them into the native field', async ({ page }) => {
  const reply = page.getByRole('textbox', { name: 'Reply', exact: true });
  await expect(reply).toHaveAttribute('aria-autocomplete', 'list');
  await reply.fill('Thanks @m');
  const suggestions = page.getByRole('listbox', { name: 'Suggestions' });
  await expect(suggestions).toBeVisible();
  // Word-start matches, with label prefixes first: Mia, then Alex Morgan.
  await expect(suggestions.getByRole('option')).toHaveText(['Mia Patel@mia', 'Alex Morgan@alex']);
  await expect(reply).toHaveAttribute('aria-haspopup', 'listbox');
  await expect(page.locator('#component-autocomplete [role="status"]').first()).toHaveText('2 suggestions');
  await reply.press('ArrowDown');
  await expect(reply).toHaveAttribute('aria-activedescendant', /-1$/);
  await reply.press('Enter');
  await expect(reply).toHaveValue('Thanks @alex ');
  await expect(suggestions).toBeHidden();
  await reply.pressSequentially('and @a');
  await expect(suggestions.getByRole('option')).toHaveText(['Alex Morgan@alex']);
  await reply.press('Escape');
  await expect(suggestions).toBeHidden();
  await expect(reply).toHaveValue('Thanks @alex and @a');
  const saved = page.getByRole('textbox', { name: 'Saved reply' });
  await saved.fill('/sc');
  await page.getByRole('option', { name: /screenshot/ }).click();
  await expect(saved).toHaveValue('Could you send a screenshot of what you see? ');
});
