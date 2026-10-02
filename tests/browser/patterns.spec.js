import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Mail and Support consume the same conversation styles and preserve their variants', async ({ page }) => {
  for (const [path, listName, variant] of [['/', 'Messages', 'filled'], ['/support.html', 'Conversations', 'quiet']]) {
    await page.goto(path);
    const list = page.getByRole('list', { name: listName, exact: true });
    await expect(list).toHaveClass(/f-conversation-list/);
    const rows = list.getByRole('button');
    await expect(rows.first()).toHaveClass(/f-conversation-row/);
    expect(await rows.evaluateAll(elements => elements.every(element => element.parentElement.tagName === 'LI'))).toBe(true);
    if (variant === 'filled') await expect(rows.first()).toHaveClass(/f-conversation-row--filled/);
    else await expect(rows.first()).not.toHaveClass(/f-conversation-row--filled/);
    await page.addStyleTag({ content: '.f-conversation-row { --f-conversation-row-radius: 17px; }' });
    await expect(rows.first()).toHaveCSS('border-radius', '17px');
  }
});

test('conversation activation keeps its native button contract and independent checkbox value', async ({ page }) => {
  await page.goto('/components.html');
  const specimen = page.locator('#component-conversation-row');
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
      await expect(page.locator('.f-conversation-row__preview').first()).toHaveCSS('-webkit-line-clamp', '2');
      await expect(page.locator('.f-conversation-row__title').first()).toHaveCSS('text-overflow', 'ellipsis');
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
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(violations).toEqual([]);
  });
}

async function loadStandalone(page) {
  // Serve a fresh document with only package CSS: no showcase stylesheet,
  // Alpine, or other application scripts. Axe scans use a JS-enabled browser;
  // the separate CSS-only checks explicitly disable browser JavaScript.
  await page.route('**/patterns-fixture', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en" class="fruit-ui"><head><title>Patterns</title><link rel="stylesheet" href="/src/fruitui.css"></head><body><main style="padding:16px">
        <h1>Conversations</h1><ul class="f-conversation-list" role="list" aria-label="Conversations">
        <li><button class="f-conversation-row f-conversation-row--filled" type="button" aria-current="true">
          <span class="f-avatar f-conversation-row__leading" aria-hidden="true">SC</span>
          <span class="f-conversation-row__top"><span class="f-conversation-row__title">Sophie with a very long sender name that should truncate</span><span class="f-conversation-row__time">10:42</span></span>
          <span class="f-conversation-row__subtitle">A long conversation subject that should stay on one line</span>
          <span class="f-conversation-row__preview">A long preview that explains a conversation across multiple lines and remains within the available space on a small screen.</span>
          <span class="f-conversation-row__meta">Work mailbox</span>
        </button></li><li><button class="f-conversation-row" type="button" aria-current="true"><span class="f-conversation-row__title">Quiet current row</span><span class="f-conversation-row__preview">A softer current state.</span></button></li></ul>
        <a class="f-attachment" href="/attachments/fruitui-design-notes.txt" download><span class="f-attachment__body">design-notes-with-a-very-long-filename-that-must-wrap.txt<small class="f-attachment__detail">Text document</small></span></a>
        <div class="f-empty-state"><h2 class="f-empty-state__title">No results</h2><p class="f-empty-state__description">Try another search.</p><div class="f-empty-state__actions"><button class="f-button" type="button">Clear filters</button></div></div>
        </main></body></html>` }));
  await page.goto('/patterns-fixture');
}
