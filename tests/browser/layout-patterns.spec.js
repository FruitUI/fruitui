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

test('a splitter reports committed widths and starts from a width the server rendered', async ({ page }) => {
  await page.goto('/components.html');
  const fixture = page.locator('#component-splitter');
  const handle = fixture.getByRole('separator');
  const pane = fixture.locator('#gallery-resize-pane');
  await expect(handle).toHaveAttribute('data-ready', '');
  await handle.scrollIntoViewIfNeeded();
  const resizes = [];
  await page.exposeFunction('resized', detail => resizes.push(detail));
  await fixture.evaluate(element => element.addEventListener('fruit-resize', event => window.resized(event.detail)));
  const original = Math.round(await width(pane));

  // A drag commits once, at its end.
  let box = await handle.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 45, box.y + 40, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => resizes.length).toBe(1);
  expect(resizes[0]).toEqual({ pane: 'gallery-resize-pane', variable: '--f-preview-width', value: original + 40 });

  // A cancelled drag commits nothing; keyboard steps commit once after a pause.
  box = await handle.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 25, box.y + 40, { steps: 2 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => resizes.length).toBe(2);
  expect(resizes[1].value).toBe(original + 56);

  // A double-click returns to the stylesheet's width and reports it.
  box = await handle.boundingBox();
  await page.mouse.dblclick(box.x + 5, box.y + 40);
  await expect.poll(() => resizes.length).toBe(3);
  expect(resizes[2].value).toBe(original);

  // A width rendered by the server (say from a cookie) holds from the first paint.
  await page.route('**/support.html', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'class="f-workspace support-workspace"',
      'class="f-workspace support-workspace" style="--f-list-width: 300px"',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/support.html');
  const list = page.locator('#support-list-pane');
  await expect(page.getByRole('separator', { name: 'Conversations' })).toHaveAttribute('aria-valuenow', '300');
  expect(Math.round(await width(list))).toBe(300);
});

test('floating disclosure uses native toggle, optional outside/Escape dismissal and focus return', async ({ page }) => {
  await page.goto('/components.html');
  const specimen = page.locator('#component-floating-disclosure');
  const details = specimen.locator('.f-floating-disclosure');
  const summary = details.locator('summary');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(details).toHaveAttribute('open', '');
  await details.getByRole('button', { name: 'Show Unread' }).focus();
  await page.keyboard.press('Escape');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await summary.click();
  const outside = page.locator('#component-input input');
  await outside.click();
  await expect(details).not.toHaveAttribute('open');
  await expect(outside).toBeFocused();
  await summary.click();
  await details.getByRole('button', { name: 'Show Unread' }).click();
  await expect(summary).toBeFocused();
  await expect(details).not.toHaveAttribute('open');
  await expect(details.locator('[role="menu"], [role="menuitem"]')).toHaveCount(0);
});

test('composer owns native submit while textarea preserves multiline value and required validation', async ({
  page,
}) => {
  await page.goto('/components.html');
  const form = page.getByRole('form', { name: 'Composer preview' });
  const input = form.getByRole('textbox', { name: 'Message to the Team' });
  await form.getByRole('button', { name: 'Send Preview' }).click();
  await expect(input).toBeFocused();
  await input.fill('One');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Two');
  await expect(input).toHaveValue('One\nTwo');
  await form.getByRole('button', { name: 'Send Preview' }).click();
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
<span class="f-avatar" aria-label="Forma Workspace" style="--f-avatar-radius:10px;--f-avatar-color:var(--f-text);--f-avatar-background:var(--f-surface);--f-avatar-border:1px solid var(--f-border)">F</span>
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

test('a splitter changes only the cursor for a pointer and shows its line for keyboard focus', async ({ page }) => {
  await page.goto('/components.html');
  const handle = page.locator('#component-splitter').getByRole('separator');
  const line = () => handle.evaluate(element => getComputedStyle(element, '::after').backgroundColor);
  await handle.scrollIntoViewIfNeeded();
  await expect(handle).toHaveCSS('cursor', 'col-resize');
  await handle.hover();
  expect(await line()).toBe('rgba(0, 0, 0, 0)');
  const box = await handle.boundingBox();
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await expect(handle).toHaveAttribute('data-resizing', '');
  expect(await line()).toBe('rgba(0, 0, 0, 0)');
  await page.mouse.up();
  // Focus stays on the handle for the keyboard, without the line or ring until a key is used.
  await expect(handle).toBeFocused();
  expect(await line()).toBe('rgba(0, 0, 0, 0)');
  await expect(handle).toHaveCSS('outline-style', 'none');
  await page.keyboard.press('ArrowLeft');
  expect(await line()).not.toBe('rgba(0, 0, 0, 0)');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(handle).toBeFocused();
  expect(await line()).not.toBe('rgba(0, 0, 0, 0)');
  // The divider line is the focus indicator, centered on the divider rather than a ring beside it.
  await expect(handle).toHaveCSS('outline-style', 'none');
  expect(await handle.evaluate(element => getComputedStyle(element, '::after').width)).toBe('3px');
});

test('an anchor deep in a pane scrolls only that pane, never the workspace frame', async ({ page }) => {
  const css = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  await page.setViewportSize({ width: 1000, height: 500 });
  const messages = Array.from(
    { length: 40 },
    (_, index) => `<p id="thread-${index}" style="height: 80px">Message ${index}</p>`,
  ).join('');
  await page.setContent(`<!doctype html><html class="fruit-ui"><head><style>${css}</style></head><body style="margin: 0">
    <div class="f-workspace f-workspace--fill" style="--f-workspace-rows: 64px minmax(0, 1fr); --f-workspace-columns: 200px minmax(0, 1fr)">
      <header class="f-toolbar" style="grid-column: 1 / -1">Toolbar</header>
      <nav class="f-sidebar" style="height: 900px">A column taller than the window makes the frame overflow.</nav>
      <section class="f-pane f-pane--column"><div class="f-pane__scroll" id="pane">${messages}<button id="last">Last</button></div></section>
    </div></body></html>`);
  const frame = page.locator('.f-workspace');
  // Fragment navigation, scrollIntoView and focus all scroll every scrollable ancestor.
  await page.evaluate(() => (location.hash = '#thread-30'));
  await page.evaluate(() => document.getElementById('thread-35').scrollIntoView());
  await page.locator('#last').focus();
  expect(await page.locator('#pane').evaluate(element => element.scrollTop)).toBeGreaterThan(1000);
  expect(await frame.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator('.f-toolbar')).toBeInViewport();
});

test('a wide table in a page scrolls in its own scroller instead of widening the page on a phone', async ({ page }) => {
  const css = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  await page.setViewportSize({ width: 390, height: 700 });
  const rows = Array.from(
    { length: 4 },
    (_, index) =>
      `<tr><td>Oct 7, 08:4${index}:15</td><td>Translations</td><td>xAI · grok-4-fast-reasoning</td><td>1,204 tokens</td><td>0.82 s</td><td>OK</td></tr>`,
  ).join('');
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body class="fruit-ui">
    <div class="f-page"><div class="f-page__body"><div class="wrapper">
      <div class="f-table__scroll" tabindex="0" role="region" aria-label="AI log"><table class="f-table" style="--f-table-min-width: 900px"><thead><tr><th>Date</th><th>Feature</th><th>Model</th><th>Tokens</th><th>Time</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div></div></div></body></html>`);
  const sizes = await page.evaluate(() => {
    const scroller = document.querySelector('.f-table__scroll');
    return {
      page: document.documentElement.scrollWidth,
      wrapper: Math.round(document.querySelector('.wrapper').getBoundingClientRect().width),
      scrolls: scroller.scrollWidth > scroller.clientWidth,
    };
  });
  expect(sizes.page).toBeLessThanOrEqual(390);
  expect(sizes.wrapper).toBeLessThanOrEqual(390);
  expect(sizes.scrolls).toBe(true);
});

for (const dir of ['ltr', 'rtl']) {
  test(`a splitter's handle lies beside the line, never over a scroll area's scrollbar, in ${dir}`, async ({
    page,
  }) => {
    for (const [, path, frameSelector] of examples) {
      await page.goto(path);
      await page.locator(frameSelector).evaluate((frame, dir) => (frame.dir = dir), dir);
      await expect(page.locator(`${frameSelector} .f-splitter[data-ready]`).first()).toBeVisible();
      const clashes = await page.evaluate(
        ({ frameSelector, dir }) => {
          const frame = document.querySelector(frameSelector);
          const scrollers = [...frame.querySelectorAll('*')].filter(element =>
            /(auto|scroll)/.test(getComputedStyle(element).overflowY),
          );
          const found = [];
          for (const handle of frame.querySelectorAll('.f-splitter[data-ready]')) {
            const h = handle.getBoundingClientRect();
            // A scroll area's scrollbar (overlay or classic) sits at its inline end, against the line.
            for (const scroller of scrollers) {
              const r = scroller.getBoundingClientRect();
              if (!r.width || r.bottom <= h.top || r.top >= h.bottom) continue;
              const end = dir === 'rtl' ? r.left : r.right;
              if (end > h.left + 0.5 && end < h.right - 0.5)
                found.push(`${handle.getAttribute('aria-label')} covers the end of ${scroller.className}`);
            }
            // Just inside the line, on the scrollbar side, a pointer reaches the pane, not the handle.
            const x = dir === 'rtl' ? h.right + 3 : h.left - 3;
            const hit = document.elementFromPoint(x, (h.top + h.bottom) / 2);
            if (hit === handle) found.push(`${handle.getAttribute('aria-label')} takes the point beside the line`);
            // Nor does it lie over a control, such as a button in a toolbar that spans the divider.
            for (const control of frame.querySelectorAll('button, a[href], input, select, summary')) {
              const r = control.getBoundingClientRect();
              const left = Math.max(r.left, h.left);
              const right = Math.min(r.right, h.right);
              const top = Math.max(r.top, h.top);
              const bottom = Math.min(r.bottom, h.bottom);
              if (right - left < 1 || bottom - top < 1 || getComputedStyle(control).visibility === 'hidden') continue;
              // A row as wide as its pane meets the handle at the pane's edge; a fair share or its middle may not.
              const middle = document.elementFromPoint((r.left + r.right) / 2, (top + bottom) / 2) === handle;
              const share =
                document.elementFromPoint((left + right) / 2, (top + bottom) / 2) === handle &&
                right - left > r.width / 4;
              if (middle || share)
                found.push(
                  `${handle.getAttribute('aria-label')} covers ${control.getAttribute('aria-label') || control.textContent.trim()}`,
                );
            }
          }
          return found;
        },
        { frameSelector, dir },
      );
      expect(clashes, path).toEqual([]);
    }
  });
}
