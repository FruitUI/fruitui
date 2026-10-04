import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import { readFileSync } from 'node:fs';

const examples = [
  ['Mail', '/', '#mail', 280],
  ['Support', '/support.html', '#support', 280],
  ['Chat', '/chat.html', '#chat', 300],
  ['Admin', '/admin.html', '#admin', 420],
];
const width = async element => (await element.boundingBox()).width;

for (const appearance of ['light', 'dark']) {
  for (const [name, path, frameSelector, reserve] of examples) {
    test(`${name} shared splitters resize with pointer and keyboard in ${appearance} and hide on phones`, async ({
      page,
    }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.emulateMedia({ colorScheme: appearance });
      await page.goto(path);
      const frame = page.locator(frameSelector);
      await expect(frame).toHaveClass(/f-workspace/);
      const splitters = frame.locator('.f-splitter[role="separator"]');
      await expect.poll(() => splitters.count()).toBeGreaterThan(0);
      for (const handle of await splitters.all()) {
        await expect(handle).toHaveAttribute('aria-valuenow', /\d+/);
        const pane = page.locator(`#${await handle.getAttribute('aria-controls')}`);
        const original = await width(pane);
        const start = await handle.boundingBox();
        const sign = (await handle.getAttribute('data-edge')) === 'start' ? -1 : 1;
        await page.mouse.move(start.x + start.width / 2, start.y + 100);
        await page.mouse.down();
        await page.mouse.move(start.x + start.width / 2 + 24 * sign, start.y + 100, { steps: 4 });
        await page.mouse.up();
        await expect.poll(() => width(pane)).toBeCloseTo(original + 24, 0);
        await expect(handle).toBeFocused();
        const afterDrag = await width(pane);
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => width(pane)).toBeCloseTo(afterDrag + 8 * sign, 0);
        await page.keyboard.press('Home');
        await expect.poll(() => width(pane)).toBeCloseTo(Number(await handle.getAttribute('aria-valuemin')), 0);
        await page.keyboard.press('End');
        await expect.poll(() => width(pane)).toBeCloseTo(Number(await handle.getAttribute('aria-valuemax')), 0);
        await expect(handle).toHaveAttribute('aria-valuetext', /pixels$/);
        expect(await frame.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      }
      const flexible = frame.locator(
        name === 'Mail'
          ? '#mail-reader'
          : name === 'Support'
            ? '#support-conversation'
            : name === 'Chat'
              ? '#chat-conversation'
              : '#admin-content',
      );
      expect(await width(flexible)).toBeGreaterThanOrEqual(reserve - 1);
      await page.setViewportSize({ width: 1000, height: 1100 });
      await expect.poll(async () => await width(flexible)).toBeGreaterThanOrEqual(reserve - 1);
      expect(await frame.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(frame.locator('.f-splitter[role="separator"]:visible')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.setViewportSize({ width: 1440, height: 1100 });
      await expect(frame.getByRole('separator').first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test('visible splitters expose their value without waiting for an animation frame', async ({ page }) => {
  // Some engines audit or read the page before the first frame; ARIA values must already be present.
  await page.addInitScript(() => (window.requestAnimationFrame = () => 0));
  await page.goto('/chat.html');
  const splitters = page.locator('#chat .f-splitter[role="separator"]:visible');
  await expect(splitters.first()).toHaveAttribute('data-ready', '');
  for (const handle of await splitters.all()) {
    await expect(handle).toHaveAttribute('aria-valuenow', /^\d+$/);
    await expect(handle).toHaveAttribute('aria-valuemax', /^\d+$/);
  }
});

test('splitter cancellation restores width and RTL follows physical divider movement', async ({ page }) => {
  await page.goto('/components.html');
  const fixture = page.locator('#component-splitter');
  const handle = fixture.getByRole('separator');
  const pane = fixture.locator('#gallery-resize-pane');
  await expect(handle).toHaveAttribute('data-ready', '');
  await handle.scrollIntoViewIfNeeded();
  const original = await width(pane);
  let box = await handle.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 45, box.y + 40, { steps: 4 });
  await expect.poll(() => width(pane)).toBeCloseTo(original + 40, 0);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect.poll(() => width(pane)).toBeCloseTo(original, 0);
  await expect(fixture.locator('.f-workspace')).not.toHaveAttribute('data-resizing');
  await fixture.locator('.f-workspace').evaluate(e => (e.dir = 'rtl'));
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => width(pane)).toBeCloseTo(original + 8, 0);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(() => width(pane)).toBeCloseTo(original + 40, 0);
  box = await handle.boundingBox();
  await page.mouse.dblclick(box.x + 5, box.y + 40);
  await expect.poll(() => width(pane)).toBeCloseTo(original, 0);
});

test('floating disclosure uses native toggle, optional outside/Escape dismissal and focus return', async ({ page }) => {
  await page.goto('/components.html');
  const specimen = page.locator('#component-floating-disclosure');
  const details = specimen.locator('.f-floating-disclosure');
  const summary = details.locator('summary');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(details).toHaveAttribute('open', '');
  await details.getByRole('button', { name: 'Show unread' }).focus();
  await page.keyboard.press('Escape');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await summary.click();
  const outside = page.locator('#component-input input');
  await outside.click();
  await expect(details).not.toHaveAttribute('open');
  await expect(outside).toBeFocused();
  await summary.click();
  await details.getByRole('button', { name: 'Show unread' }).click();
  await expect(summary).toBeFocused();
  await expect(details).not.toHaveAttribute('open');
  await expect(details.locator('[role="menu"], [role="menuitem"]')).toHaveCount(0);
});

test('composer owns native submit while textarea preserves multiline value and required validation', async ({
  page,
}) => {
  await page.goto('/components.html');
  const form = page.getByRole('form', { name: 'Composer preview' });
  const input = form.getByRole('textbox', { name: 'Message to the team' });
  await form.getByRole('button', { name: 'Send preview' }).click();
  await expect(input).toBeFocused();
  await input.fill('One');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Two');
  await expect(input).toHaveValue('One\nTwo');
  await form.getByRole('button', { name: 'Send preview' }).click();
  await expect(form.locator('output')).toContainText('One\nTwo');
  await expect(input).toHaveValue('');
});

const standalone = `<!doctype html><html lang="en" class="fruit-ui"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Layout patterns</title><link rel="stylesheet" href="/src/fruitui.css"></head><body><main style="padding:16px">
<h1>Workspace</h1><section class="f-workspace" aria-label="Standalone workspace" style="--f-workspace-columns: minmax(0,1fr); --f-workspace-height:480px">
<div class="f-pane f-pane--column"><header class="f-toolbar">History</header><div class="f-pane__scroll" tabindex="0" role="region" aria-label="History" style="--f-pane-scroll-padding:16px">
<dl class="f-description-list"><div><dt>Email</dt><dd>averylongaddressforourcustomer@example.com</dd></div><div><dt>Plan</dt><dd>Team</dd></div></dl>
<div class="f-table__scroll" tabindex="0" role="region" aria-label="Records"><table class="f-table" style="--f-table-min-width:500px"><caption>Records</caption><thead><tr><th scope="col">Name</th><th scope="col">Plan</th></tr></thead><tbody><tr data-selected="true"><th scope="row">Sophie</th><td>Team</td></tr></tbody></table></div><p style="margin-top:250px">Last message.</p></div>
<form class="f-composer" aria-label="Reply" style="--f-composer-padding:12px"><label for="standalone-message">Reply</label><textarea id="standalone-message" class="f-input f-composer__input" name="reply" required aria-describedby="help"></textarea><footer class="f-composer__footer"><span id="help" class="f-help">Enter inserts a line.</span><button class="f-button f-button--primary" type="submit">Send</button></footer></form></div>
<div class="f-splitter" style="grid-column:1" role="separator" tabindex="0" aria-label="Navigation" aria-orientation="vertical"></div></section>
<details class="f-floating-disclosure"><summary class="f-button">Options</summary><div class="f-floating-disclosure__content"><button class="f-button" type="button">Independent action</button></div></details>
<span class="f-avatar" aria-label="Forma workspace" style="--f-avatar-radius:10px;--f-avatar-color:var(--f-text);--f-avatar-background:var(--f-surface);--f-avatar-border:1px solid var(--f-border)">F</span>
</main></body></html>`;
async function loadStandalone(page) {
  await page.route('**/layout-fixture', route => route.fulfill({ contentType: 'text/html', body: standalone }));
  await page.goto('/layout-fixture');
}

test.describe('CSS-only extracted layouts', () => {
  test.use({ javaScriptEnabled: false });
  for (const appearance of ['light', 'dark']) {
    test(`work at 320px and switch appearance live in ${appearance}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.emulateMedia({ colorScheme: appearance });
      await loadStandalone(page);
      await expect(page.getByRole('separator')).toHaveCount(0);
      const history = page.getByRole('region', { name: 'History', exact: true });
      await history.focus();
      await expect(history).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => history.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
      const records = page.getByRole('region', { name: 'Records', exact: true });
      await records.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => records.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
      const summary = page.locator('summary');
      await summary.click();
      await expect(page.locator('details')).toHaveAttribute('open', '');
      await expect(page.getByRole('button', { name: 'Independent action' })).toBeVisible();
      const frame = page.locator('.f-workspace');
      const before = await frame.evaluate(e => getComputedStyle(e).backgroundColor);
      await page.emulateMedia({ colorScheme: appearance === 'light' ? 'dark' : 'light' });
      await expect.poll(() => frame.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
});

for (const appearance of ['light', 'dark']) {
  test(`standalone extracted arrangements are accessible in ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: appearance });
    await loadStandalone(page);
    await page.locator('summary').click();
    await expectAccessible(page);
  });
}

test('a fill workspace is the whole window and its panes scroll on their own', async ({ page }) => {
  const css = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body class="fruit-ui">
    <section class="f-workspace f-workspace--fill" style="--f-workspace-columns: 200px minmax(0, 1fr)">
      <nav class="f-pane f-pane--scroll"><div style="height: 2000px">Mailboxes</div></nav>
      <div class="f-pane f-pane--scroll"><div style="height: 3000px">Conversation</div></div>
    </section></body></html>`);
  const workspace = page.locator('.f-workspace');
  expect((await workspace.boundingBox()).height).toBe(700);
  await expect(workspace).toHaveCSS('border-top-width', '0px');
  await expect(workspace).toHaveCSS('border-top-left-radius', '0px');
  await expect(workspace).toHaveCSS('box-shadow', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(700);
});
