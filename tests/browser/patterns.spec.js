import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { expectAccessible } from './helpers.js';

test('Mail and Support consume the same conversation styles and preserve their variants', async ({ page }) => {
  for (const [path, listName, variant] of [
    ['/', 'Messages', 'filled'],
    ['/support.html', 'Conversations', 'quiet'],
  ]) {
    await page.goto(path);
    const list = page.getByRole('list', { name: listName, exact: true });
    await expect(list).toHaveClass(/f-item-list/);
    const rows = list.getByRole('button');
    await expect(rows.first()).toHaveClass(/f-item-row/);
    expect(await rows.evaluateAll(elements => elements.every(element => element.parentElement.tagName === 'LI'))).toBe(
      true,
    );
    if (variant === 'filled') await expect(rows.first()).toHaveClass(/f-item-row--filled/);
    else await expect(rows.first()).not.toHaveClass(/f-item-row--filled/);
    await page.addStyleTag({ content: '.f-item-row { --f-item-row-radius: 17px; }' });
    await expect(rows.first()).toHaveCSS('border-radius', '17px');
  }
});

test('conversation activation keeps its native button contract and independent checkbox value', async ({ page }) => {
  await page.goto('/components.html');
  const specimen = page.locator('#component-item-row');
  const row = specimen.getByRole('button', { name: /Sophie Chen/ });
  const selection = specimen.getByRole('checkbox', { name: 'Select this conversation for a bulk action' });
  await selection.check();
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(row).toHaveAttribute('aria-current', 'true');
  await expect(selection).toBeChecked();
  await page.keyboard.press('Space');
  await expect(row).not.toHaveAttribute('aria-current', 'true');
  await expect(selection).toBeChecked();
  await selection.uncheck();
  await expect(row).not.toHaveAttribute('aria-current', 'true');
  await expect(row.locator('input, a, button')).toHaveCount(0);
});

test('the shared attachment retains a real native download', async ({ page }) => {
  await page.goto('/components.html');
  const link = page.locator('#component-attachment').getByRole('link', { name: /design notes/ });
  const downloaded = page.waitForEvent('download');
  await link.click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('fruitui-design-notes.txt');
  expect(await file.failure()).toBeNull();
});

test.describe('standalone CSS patterns', () => {
  test.use({ javaScriptEnabled: false });

  for (const appearance of ['light', 'dark']) {
    test(`work without example styles or JavaScript in ${appearance} appearance at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 950 });
      await page.emulateMedia({ colorScheme: appearance });
      await loadStandalone(page);
      await expect(page.locator('html')).toHaveCSS('color-scheme', appearance);
      await expect(page.locator('.f-item-row__preview').first()).toHaveCSS('-webkit-line-clamp', '2');
      await expect(page.locator('.f-item-row__title').first()).toHaveCSS('text-overflow', 'ellipsis');
      const row = page.getByRole('button', { name: /Sophie/ });
      await row.focus();
      await expect(row).toBeFocused();
      await expect(row).toHaveCSS('outline-style', 'solid');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Filled accent deliberately stays the same in both palettes. The quiet
      // row uses the changing selection surface and verifies live CSS switching.
      const quiet = page.getByRole('button', { name: /Quiet current row/ });
      const before = await quiet.evaluate(element => getComputedStyle(element).backgroundColor);
      await page.emulateMedia({ colorScheme: appearance === 'light' ? 'dark' : 'light' });
      await expect(page.locator('html')).toHaveCSS('color-scheme', appearance === 'light' ? 'dark' : 'light');
      await expect(quiet).not.toHaveCSS('background-color', before);
    });
  }
});

for (const appearance of ['light', 'dark']) {
  test(`standalone patterns meet accessibility checks in ${appearance} appearance`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 950 });
    await page.emulateMedia({ colorScheme: appearance });
    await loadStandalone(page);
    await expect(page.locator('html')).toHaveCSS('color-scheme', appearance);
    await expectAccessible(page);
  });
}

async function loadStandalone(page) {
  // Serve a fresh document with only package CSS: no showcase stylesheet,
  // Alpine, or other application scripts. Axe scans use a JS-enabled browser;
  // the separate CSS-only checks explicitly disable browser JavaScript.
  await page.route('**/patterns-fixture', route =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en" class="fruit-ui"><head><title>Patterns</title><link rel="stylesheet" href="/src/fruitui.css"></head><body><main style="padding:16px">
        <h1>Conversations</h1><ul class="f-item-list" role="list" aria-label="Conversations">
        <li><button class="f-item-row f-item-row--filled" type="button" aria-current="true">
          <span class="f-avatar f-item-row__leading" aria-hidden="true">SC</span>
          <span class="f-item-row__top"><span class="f-item-row__title">Sophie with a very long sender name that should truncate</span><span class="f-item-row__time">10:42</span></span>
          <span class="f-item-row__subtitle">A long conversation subject that should stay on one line</span>
          <span class="f-item-row__preview">A long preview that explains a conversation across multiple lines and remains within the available space on a small screen.</span>
          <span class="f-item-row__meta">Work mailbox</span>
        </button></li><li><button class="f-item-row" type="button" aria-current="true"><span class="f-item-row__title">Quiet current row</span><span class="f-item-row__preview">A softer current state.</span></button></li></ul>
        <a class="f-attachment" href="/attachments/fruitui-design-notes.txt" download><span class="f-attachment__body">design-notes-with-a-very-long-filename-that-must-wrap.txt<small class="f-attachment__detail">Text document</small></span></a>
        <div class="f-empty-state"><h2 class="f-empty-state__title">No results</h2><p class="f-empty-state__description">Try another search.</p><div class="f-empty-state__actions"><button class="f-button" type="button">Clear filters</button></div></div>
        </main></body></html>`,
    }),
  );
  await page.goto('/patterns-fixture');
}

test('named dialogs and the toaster respond to browser events without Livewire', async ({ page }) => {
  await page.goto('/components.html');
  await page.getByRole('button', { name: 'Open named dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Archive this conversation?' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Show toast' }).click();
  const toaster = page.getByRole('status').filter({ hasText: 'Conversation archived.' });
  await expect(toaster).toBeVisible();
  expect(await toaster.evaluate(element => element.matches(':popover-open'))).toBe(true);
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent('fruit-dialog-open', { detail: { name: 'missing' } })),
  );
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('a toast announced while a modal dialog is open appears above it', async ({ page }) => {
  await page.goto('/components.html');
  await page.getByRole('button', { name: 'Open named dialog' }).click();
  await expect(page.getByRole('dialog', { name: 'Archive this conversation?' })).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent('fruit-toast', { detail: { message: 'Above the dialog' } })),
  );
  const toast = page.getByRole('status').filter({ hasText: 'Above the dialog' });
  await expect(toast).toBeVisible();
  // Shown after the modal, the popover sits above it in the top layer. (Hit testing still targets the
  // dialog, because a modal makes the rest of the document inert.)
  expect(await toast.evaluate(element => element.matches(':popover-open'))).toBe(true);
});

test('print keeps the conversation and leaves application chrome off paper', async ({ page }) => {
  await page.goto('/support.html');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.support-sidebar')).toBeHidden();
  await expect(page.locator('.support-composer')).toBeHidden();
  await expect(page.locator('.f-workspace').first()).toHaveCSS('display', 'block');
  await expect(page.getByText('Beginning of this conversation')).toBeAttached();
  await expect(page.locator('.support-thread')).toBeVisible();
});

for (const [name, url, frame] of [
  ['Mail', '/', '#mail'],
  ['Support', '/support.html', '#support'],
  ['Chat', '/chat.html', '#chat'],
  ['Admin', '/admin.html', '#admin'],
]) {
  test(`${name} switches between its responsive layout and a phone-sized preview`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    const workspace = page.locator(frame);
    expect((await workspace.boundingBox()).width).toBeGreaterThan(900);
    await page.getByRole('radio', { name: 'Phone', exact: true }).check();
    await expect.poll(async () => Math.round((await workspace.boundingBox()).width)).toBe(390);
    expect((await workspace.boundingBox()).height).toBeLessThanOrEqual(820);
    expect(await workspace.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.getByRole('radio', { name: 'Responsive', exact: true }).check();
    await expect.poll(async () => (await workspace.boundingBox()).width).toBeGreaterThan(900);
    expect(errors).toEqual([]);
  });
}

test('item links are real links with current state, and list items carry a checkbox and a trailing toggle', async ({
  page,
}) => {
  await page.goto('/components.html');
  const list = page.getByRole('list', { name: 'Linked conversations' });
  const link = list.getByRole('link', { name: /Jordan Lee/ });
  await expect(link).toHaveAttribute('href', '#component-item-row');
  await expect(link).toHaveAttribute('aria-current', 'page');
  await expect(link).toHaveCSS('text-decoration-line', 'none');
  // The list item draws the current background across the checkbox, the row and the toggle.
  const item = list.locator('li');
  await expect(item).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(link).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const star = list.getByRole('button', { name: 'Star Jordan Lee' });
  const [title, toggle] = await Promise.all([link.locator('.f-item-row__title').boundingBox(), star.boundingBox()]);
  expect(Math.abs(title.y + title.height / 2 - (toggle.y + toggle.height / 2))).toBeLessThan(2);
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect(list.getByRole('checkbox', { name: 'Select Jordan Lee' })).not.toBeChecked();
});

test('the selection bar follows a script-set count and hides at zero', async ({ page }) => {
  await page.goto('/components.html');
  const card = page.locator('#component-selection-bar');
  const bar = card.getByRole('region', { name: 'Selected conversations' });
  await expect(bar.getByRole('status')).toHaveText('1 selected');
  await card.getByRole('checkbox', { name: 'Select Sophie Chen' }).check();
  await expect(bar.getByRole('status')).toHaveText('2 selected');
  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bar).toBeHidden();
  // Plain DOM scripts (jQuery included) set the attribute directly.
  await card.locator('.f-selection-bar').evaluate(element => (element.dataset.count = '3'));
  await expect(bar.getByRole('status')).toHaveText('3 selected');
});

test('a message overflow menu opens from its actions and keeps them visible while open', async ({ page }) => {
  await page.goto('/components.html');
  const message = page.locator('#component-message').getByRole('article', { name: 'Customer message' });
  const actions = message.locator('.f-message__actions');
  const opacity = () => actions.evaluate(element => getComputedStyle(element).opacity);
  await message.hover();
  await message.getByRole('button', { name: 'More actions' }).click();
  const menu = page.getByRole('menu', { name: 'More actions for Sophie Chen’s message' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Show original' })).toBeFocused();
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe('1');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  // Header lines and thread events read as text beside the messages.
  await expect(message.locator('.f-message__headers')).toContainText('Cc: mia@studio-north.example');
  await expect(page.locator('#component-message .f-message-event')).toContainText(
    'Mia Patel assigned this to Alex Morgan',
  );
});

test('a thread separates messages, and sent, own, note and generated messages each look distinct', async ({ page }) => {
  await page.goto('/components.html');
  const card = page.locator('#component-thread');
  const entries = card.locator('.f-thread > li');
  await expect(entries).toHaveCount(7);
  const lines = await entries.evaluateAll(items => items.map(item => getComputedStyle(item).borderTopWidth));
  // Lines only between plain messages; events and cards sit without them.
  expect(lines).toEqual(['0px', '0px', '0px', '0px', '0px', '1px', '0px']);
  // The space between messages is larger than a blank line between paragraphs.
  const [question, answer] = await entries.evaluateAll(items =>
    items.slice(4, 6).map(item => item.querySelector('.f-message').getBoundingClientRect()),
  );
  expect(answer.top - question.bottom).toBeGreaterThanOrEqual(40);

  const style = (name, read) => card.getByRole('article', { name }).first().evaluate(read);
  const bar = element => {
    const before = getComputedStyle(element, '::before');
    return [before.borderInlineStartWidth, before.borderInlineStartColor];
  };
  const accent = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--f-accent)';
    document.querySelector('.fruit-ui body, body').append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  // Sent: your own in the accent, a teammate's in a neutral color; customers have no bar.
  const [ownWidth, ownColor] = await style('Your reply', bar);
  const [teamWidth, teamColor] = await style('Reply from Mia Patel', bar);
  expect([ownWidth, teamWidth]).toEqual(['3px', '3px']);
  expect(ownColor).toBe(accent);
  expect(teamColor).not.toBe(accent);
  expect((await style('Customer message', bar))[0]).toBe('0px');
  // Not sent: a yellow note and an indigo generated card, each named in its meta text.
  const background = element => getComputedStyle(element).backgroundColor;
  const note = await style('Internal note', background);
  const generated = await style('Generated summary', background);
  expect(new Set([note, generated, 'rgba(0, 0, 0, 0)']).size).toBe(3);
  await expect(card.getByRole('article', { name: 'Generated summary' })).toContainText('Generated, not sent');
  expect((await style('Generated summary', bar))[0]).toBe('0px');
});

test('the Support thread lists its entries without a line before the first', async ({ page }) => {
  await page.goto('/support.html');
  const first = page.locator('.support-thread .f-thread > li').first();
  await expect(first).toBeVisible();
  expect(await first.evaluate(element => getComputedStyle(element).borderTopWidth)).toBe('0px');
  await page.locator('#support-reply').fill('Happy to help.');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.locator('.support-thread .f-message--outgoing').last()).toContainText('Happy to help.');
});

test('a thread event shows its actions on hover or focus and keeps them while their menu is open', async ({ page }) => {
  await page.goto('/components.html');
  const event = page.locator('#component-message-event .f-message-event').first();
  const actions = event.getByRole('group', { name: 'Event actions' });
  const opacity = () => actions.evaluate(element => getComputedStyle(element).opacity);
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe('0');
  // The actions keep the line its own height.
  const plain = await page.locator('#component-message-event .f-message-event').nth(1).boundingBox();
  expect((await event.boundingBox()).height).toBeLessThanOrEqual(plain.height + 1);
  await event.hover();
  await expect.poll(opacity).toBe('1');
  await event.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Outgoing emails' })).toBeFocused();
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe('1');
  await page.keyboard.press('Escape');
});

test('toast tones lead with an icon, announce errors assertively and keep them twice as long', async ({ page }) => {
  await page.clock.install();
  await page.goto('/components.html');
  const toast = page.locator('#component-toast .f-toast[x-data]');
  const card = page.locator('#component-toast');
  const icon = () => toast.evaluate(element => getComputedStyle(element, '::before').content);

  await card.getByRole('button', { name: 'Error' }).click();
  await expect(toast).toHaveText('Could not connect to the IMAP server.');
  await expect(toast).toHaveAttribute('data-tone', 'danger');
  await expect(toast).toHaveAttribute('aria-live', 'assertive');
  expect(await icon()).toBe('""');
  // The default 4 seconds have passed; an error is still showing until 8.
  await page.mouse.move(0, 0);
  await page.clock.runFor(6000);
  await expect(toast).toBeVisible();
  await page.clock.runFor(2500);
  await expect(toast).toBeHidden();

  await card.getByRole('button', { name: 'Success' }).click();
  await expect(toast).toHaveAttribute('data-tone', 'success');
  await expect(toast).toHaveAttribute('aria-live', 'polite');
  await card.getByRole('button', { name: 'Show toast' }).click();
  await expect(toast).toHaveText('Conversation archived.');
  await expect(toast).not.toHaveAttribute('data-tone');
  expect(await icon()).toBe('none');
});

test('the confirmer asks once per request and answers each in turn', async ({ page }) => {
  await page.goto('/components.html');
  const card = page.locator('#component-confirm');
  const answer = card.getByRole('status');
  const dialog = page.getByRole('alertdialog');

  await card.getByRole('button', { name: 'Delete conversation…' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName('Delete this conversation?');
  await expect(dialog).toHaveAccessibleDescription('It moves to Trash, where it stays for 30 days.');
  // A destructive question starts on Cancel, so Enter never deletes by accident.
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Delete' })).toHaveClass(/f-button--danger/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(answer).toHaveText('Kept.');

  await card.getByRole('button', { name: 'Delete conversation…' }).click();
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(answer).toHaveText('Deleted.');

  // Any other question starts on its action; without a message there is no description.
  await card.getByRole('button', { name: 'Mark all as read…' }).click();
  await expect(dialog.getByRole('button', { name: 'Mark as Read' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Mark as Read' })).toHaveClass(/f-button--primary/);
  await expect(dialog.locator('.f-confirm__message')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(answer).toHaveText('All read.');

  // Requests made together (here through the outlet's own event) wait their turn and resolve in order.
  const answers = page.evaluate(() => {
    const ask = title =>
      new Promise(resolve =>
        window.dispatchEvent(
          new CustomEvent('fruit-confirm', { detail: { title, message: '', tone: 'default', resolve } }),
        ),
      );
    return Promise.all([ask('First?'), ask('Second?')]);
  });
  await expect(dialog).toHaveAccessibleName('First?');
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(dialog).toHaveAccessibleName('Second?');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  expect(await answers).toEqual([true, false]);
});

test('without a confirmer on the page, confirm() asks with the browser', async ({ page }) => {
  await page.route('**/confirm-fixture', route =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en" class="fruit-ui"><body><button x-data
        @click="$confirm({ title: 'Leave this page?', message: 'Your draft is kept.' }).then(confirmed => $el.dataset.answer = confirmed)">Leave</button></body></html>`,
    }),
  );
  await page.goto('/confirm-fixture');
  for (const path of ['build/livewire.global.js', 'node_modules/alpinejs/dist/cdn.min.js'])
    await page.addScriptTag({ path: fileURLToPath(new URL(`../../${path}`, import.meta.url)) });
  const asked = [];
  page.once('dialog', dialog => {
    asked.push(dialog.message());
    dialog.accept();
  });
  await page.getByRole('button', { name: 'Leave' }).click();
  await expect(page.getByRole('button', { name: 'Leave' })).toHaveAttribute('data-answer', 'true');
  expect(asked).toEqual(['Leave this page?\n\nYour draft is kept.']);
  // Code outside Alpine uses the same helpers through the global build.
  page.once('dialog', dialog => dialog.dismiss());
  expect(await page.evaluate(() => window.FruitUI.confirm({ title: 'Discard draft?', tone: 'danger' }))).toBe(false);
  expect(
    await page.evaluate(
      () =>
        new Promise(resolve => {
          window.addEventListener('fruit-toast', event => resolve(event.detail), { once: true });
          window.FruitUI.toast('Saved.', { tone: 'success' });
        }),
    ),
  ).toEqual({ message: 'Saved.', tone: 'success' });
  // Invalid requests fail loudly; Alpine reports expression errors as page errors.
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => {
    for (const expression of [
      "$confirm({ title: 'Go?', tone: 'loud' })",
      "$confirm({ message: 'No title' })",
      "$toast('Hi', { tone: 'loud' })",
    ])
      window.Alpine.evaluate(document.body, expression);
  });
  await expect
    .poll(() => errors.join(' '))
    .toMatch(/confirm tone must be one of[\s\S]*needs a title[\s\S]*toast tone must be one of/);
});

test('a copy button copies its value, confirms in place and reports failures', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async text => {
          if (window.failCopy) throw new Error('Denied');
          window.copied.push(text);
        },
      },
    });
  });
  await page.clock.install();
  await page.goto('/components.html');
  const card = page.locator('#component-copy-button');
  const invite = card.getByRole('button', { name: 'Copy invite link' });
  const status = value => card.locator(`.f-copy:has([data-fruit-copy="${value}"])`).getByRole('status');
  const events = [];
  await page.exposeFunction('copiedEvent', value => events.push(value));
  await card.evaluate(element =>
    element.addEventListener('fruit-copied', event => window.copiedEvent(event.detail.value)),
  );

  await invite.click();
  expect(await page.evaluate(() => window.copied)).toEqual(['https://forma.example/invite/7f3a']);
  await expect(card.getByRole('button', { name: 'Copied' })).toBeVisible();
  await expect(status('https://forma.example/invite/7f3a')).toHaveText('Copied');
  await expect.poll(() => events).toEqual(['https://forma.example/invite/7f3a']);
  await page.clock.runFor(2100);
  await expect(invite).toBeVisible();
  await expect(status('https://forma.example/invite/7f3a')).toHaveText('');

  // An icon button keeps its name and swaps its icon.
  const secret = card.getByRole('button', { name: 'Copy webhook secret' });
  await secret.press('Enter');
  expect(await page.evaluate(() => window.copied.at(-1))).toBe('whsec_7f3a91c2b8');
  await expect(secret.locator('.f-copy__done-icon')).toBeVisible();
  await expect(secret.locator('.f-copy__icon')).toBeHidden();

  await page.evaluate(() => (window.failCopy = true));
  await card.getByRole('button', { name: 'Copy number' }).click();
  await expect(status('#1042')).toHaveText('Could not copy');
  await expect(card.getByRole('button', { name: 'Copy number' })).toBeVisible();
});

test('a Field label slot with markup still names its control', async ({ page }) => {
  await page.goto('/components.html');
  const field = page.locator('#component-field').getByRole('textbox', { name: 'Type DELETE to confirm' });
  await expect(field).toHaveAccessibleDescription('This removes the workspace for everyone.');
  await page.locator('#component-field').getByText('DELETE', { exact: true }).click();
  await expect(field).toBeFocused();
});

test('a selectable list selects with modifier clicks and keys and the header swaps to the selection bar', async ({
  page,
}) => {
  await page.goto('/components.html');
  const card = page.locator('#component-list-header');
  const row = name => card.getByRole('button', { name: new RegExp(name) });
  const bar = card.getByRole('region', { name: 'Selected conversations' });
  const values = () =>
    card.locator('input[type=checkbox]').evaluateAll(boxes => boxes.filter(box => box.checked).map(box => box.value));
  const select = card.getByRole('button', { name: 'Select', exact: true });

  await row('Emma Thompson').click({ modifiers: ['ControlOrMeta'] });
  expect(await values()).toEqual(['1042', '1040']);
  await expect(bar.getByRole('status')).toHaveText('2 selected');
  await expect(select).toBeHidden();
  await row('Jordan Lee').click({ modifiers: ['ControlOrMeta'] });
  await row('Emma Thompson').click({ modifiers: ['ControlOrMeta'] });
  expect(await values()).toEqual(['1042', '1041']);
  await row('Daniel Brooks').click({ modifiers: ['Shift'] });
  expect(await values()).toEqual(['1042', '1041', '1040', '1039']);
  await expect(row('Daniel Brooks')).toBeFocused();
  // Checked items take the current highlight.
  const background = name => row(name).evaluate(button => getComputedStyle(button.closest('li')).backgroundColor);
  expect(await background('Daniel Brooks')).not.toBe('rgba(0, 0, 0, 0)');
  await page.keyboard.press('Escape');
  expect(await values()).toEqual([]);
  await expect(select).toBeVisible();

  await row('Jordan Lee').focus();
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  expect(await values()).toEqual(['1041', '1040', '1039']);
  await page.keyboard.press('Shift+ArrowUp');
  expect(await values()).toEqual(['1041', '1040']);
  await page.keyboard.press('ControlOrMeta+a');
  expect(await values()).toEqual(['1042', '1041', '1040', '1039']);
  // A plain click clears the selection; the row then acts as usual.
  await row('Sophie Chen').click();
  expect(await values()).toEqual([]);

  // Select shows the checkboxes, and a plain click toggles.
  const shown = () =>
    card
      .locator('.f-check')
      .first()
      .evaluate(label => label.getBoundingClientRect().width > 1);
  expect(await shown()).toBe(false);
  await select.click();
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  expect(await shown()).toBe(true);
  await row('Jordan Lee').click();
  expect(await values()).toEqual(['1041']);
  await card.getByRole('button', { name: 'Clear selection' }).click();
  await select.click();
  expect(await shown()).toBe(false);
  // A checkbox reached with Tab shows while it has focus.
  await row('Sophie Chen').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(card.getByRole('checkbox', { name: 'Select Sophie Chen' })).toBeFocused();
  expect(await shown()).toBe(true);
});
