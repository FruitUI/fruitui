import { test, expect } from '@playwright/test';
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
  const selection = specimen.getByRole('checkbox');
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
