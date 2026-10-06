import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Representative unlayered legacy rules, including specificity traps from Bootstrap-style resets.
const legacy = `body{font-family:Arial;font-size:14px;line-height:1.42857143;color:#333;background:#fff}a{color:#337ab7;text-decoration:none}button,input,select,textarea{font:inherit;color:inherit}button{overflow:visible;text-transform:none}input{line-height:normal}label{display:inline-block;max-width:100%;font-weight:700}`;
const layout = readFileSync(new URL('../../build/layout.compat.css', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../build/core.compat.css', import.meta.url), 'utf8');

for (const colorScheme of ['light', 'dark'])
  test(`compatibility CSS preserves FruitUI controls and leaves legacy content scoped out in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.route('**/compatibility-fixture', route =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html lang="en"><head><title>Legacy host</title><style>${legacy}</style><style>${css}${layout}</style></head><body><a id="legacy" href="#">Legacy link</a><main class="fruit-ui"><h1>FruitUI scope</h1><button class="f-button">Save</button><input class="f-input" aria-label="Name"><label class="f-label">Owner</label><nav class="f-sidebar"><a class="f-sidebar__item" href="#">Inbox</a></nav><div class="f-prose"><p>Rich content</p></div></main></body></html>`,
      }),
    );
    await page.goto('/compatibility-fixture');
    await expect(page.locator('#legacy')).toHaveCSS('color', 'rgb(51, 122, 183)');
    await expect(page.locator('.f-button')).toHaveCSS('font-size', '16px');
    await expect(page.locator('.f-button')).toHaveCSS('line-height', '24px');
    await expect(page.locator('.f-input')).toHaveCSS('line-height', '24px');
    await expect(page.locator('.f-label')).toHaveCSS('font-weight', '500');
    await expect(page.locator('.f-sidebar__item')).toHaveCSS(
      'color',
      colorScheme === 'dark' ? 'rgb(204, 204, 207)' : 'rgb(34, 34, 37)',
    );
    await expect(page.locator('.f-input')).toHaveCSS(
      'background-color',
      colorScheme === 'dark' ? 'rgb(46, 46, 50)' : 'rgb(255, 255, 255)',
    );
    await expect(page.locator('.f-prose')).toHaveCSS('line-height', '26.4px');
  });

test('core stylesheet includes shared rich content but excludes optional editor and Mail presentation', () => {
  expect(css).toContain('.f-prose');
  expect(css).not.toContain('.f-editor');
  expect(css).not.toContain('.f-mail ');
  expect(css).not.toMatch(/@layer\b/);
  expect(css).not.toContain('.f-workspace');
  expect(layout).toContain('.f-workspace');
});

test('the all-in-one stylesheet leaves the Mail reference layout opt-in', () => {
  const all = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  const mail = readFileSync(new URL('../../build/mail.css', import.meta.url), 'utf8');
  expect(all).toContain('.f-workspace');
  expect(all).toContain('.f-editor');
  expect(all).not.toContain('.f-mail ');
  expect(mail).toContain('.f-mail ');
});

test('browser globals register on an existing Alpine instance without starting it', async ({ page }) => {
  await page.goto('/components.html');
  await page.addScriptTag({ url: '/build/alpine.global.js' });
  await page.addScriptTag({ url: '/build/editor.global.js' });
  expect(
    await page.evaluate(() => {
      const names = [];
      const host = { data: name => names.push(name), magic: name => names.push(`$${name}`) };
      window.FruitUI.default(host);
      window.FruitEditor(host);
      return names;
    }),
  ).toEqual(expect.arrayContaining(['fruitToast', 'fruitTabs', 'fruitCombobox', 'fruitEditor']));
});
