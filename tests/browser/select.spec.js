import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = `<!doctype html><html class="fruit-ui" lang="en"><head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Select options</title><link rel="stylesheet" href="/src/fruitui.css">
  <style>main { padding: 16px; max-width: 440px; } form { display: grid; gap: 18px; } #clipped { height: 76px; overflow: hidden; }</style>
</head><body><main><h1>Select options</h1><form action="/select-submit">
  <div id="clipped"><label class="f-field"><span class="f-label">Mailbox</span>
    <select class="f-input" name="mailbox" required>
      <option value="">Choose a mailbox</option>
      <optgroup label="Accounts"><option value="all">All Inboxes</option><option value="work">Work</option><option value="personal">Personal</option></optgroup>
      <optgroup label="Offline accounts" disabled><option value="offline">Offline account</option></optgroup>
    </select>
  </label></div>
  <label class="f-field"><span class="f-label">Folders</span>
    <select class="f-input" name="folders[]" multiple size="3">
      <option value="inbox" selected>Inbox</option><option value="sent">Sent</option><option value="archive">Archive</option><option value="junk" disabled>Junk</option><option value="trash">Trash</option>
    </select>
  </label>
  <label class="f-field"><span class="f-label">Queue</span>
    <select class="f-input" name="queue" size="2"><option value="open" selected>Open</option><option value="waiting">Waiting</option><option value="closed">Closed</option></select>
  </label>
  <div class="f-row"><button class="f-button" type="reset">Reset</button><button class="f-button" type="submit">Save</button></div>
</form></main></body></html>`;

async function openFixture(page) {
  await page.route('**/select-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.goto('/select-fixture');
}

async function requireStyledPicker(page) {
  test.skip(!await page.evaluate(() => CSS.supports('appearance', 'base-select') && CSS.supports('selector(select::picker(select))')), 'Browser retains native option rendering');
}

const palette = {
  light: { control: 'rgb(255, 255, 255)', text: 'rgb(34, 34, 37)', secondary: 'rgb(101, 101, 108)', disabled: 'rgb(118, 118, 125)', selection: 'rgb(226, 237, 255)' },
  dark: { control: 'rgb(57, 57, 62)', text: 'rgb(243, 243, 245)', secondary: 'rgb(176, 176, 184)', disabled: 'rgb(161, 161, 171)', selection: 'rgb(38, 62, 90)' },
};

test.describe('CSS-only native selection', () => {
  test.use({ javaScriptEnabled: false });

  test('picker keyboard selection, cancellation, validation, reset and submission stay native', async ({ page }) => {
    await openFixture(page);
    await requireStyledPicker(page);
    const select = page.getByRole('combobox', { name: 'Mailbox', exact: true });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(select).toBeFocused();
    expect(await select.evaluate(element => element.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/select-fixture$/);

    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(select.locator('option[value="work"]')).toHaveCSS('background-color', 'rgb(0, 100, 208)');
    await page.keyboard.press('Enter');
    await expect(select).toHaveValue('work');
    await expect(select).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Escape');
    await expect(select).toHaveValue('work');
    await expect(select).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(select).toHaveValue('personal'); // Disabled optgroup is skipped.

    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(select).toHaveValue('');
    await expect(page.getByRole('listbox', { name: 'Folders', exact: true })).toHaveValues(['inbox']);
    await select.click();
    await select.locator('option[value="all"]').click();
    const folders = page.getByRole('listbox', { name: 'Folders', exact: true });
    await folders.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(folders).toHaveValues(['sent', 'archive']);
    await page.route('**/select-submit?*', route => route.fulfill({ contentType: 'text/html', body: '<h1>Saved selections</h1>' }));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Saved selections' })).toBeVisible();
    const submitted = new URL(page.url()).searchParams;
    expect(submitted.get('mailbox')).toBe('all');
    expect(submitted.getAll('folders[]')).toEqual(['sent', 'archive']);
  });

  test('multiple and size listboxes preserve arrow keys, range selection and visible row counts', async ({ page }) => {
    await openFixture(page);
    const folders = page.getByRole('listbox', { name: 'Folders', exact: true });
    await expect(folders).toHaveCSS('appearance', 'auto');
    await folders.focus();
    await page.keyboard.press('ArrowDown');
    await expect(folders).toHaveValues(['sent']);
    await page.keyboard.press('Shift+ArrowDown');
    await expect(folders).toHaveValues(['sent', 'archive']);
    await page.keyboard.press('ArrowDown');
    await expect(folders).toHaveValues(['trash']); // Disabled option is skipped.
    await folders.selectOption('inbox');
    for (const size of [2, 3, 4]) {
      await folders.evaluate((element, size) => { element.size = size; }, size);
      const rows = await folders.evaluate(element => {
        const style = getComputedStyle(element);
        const contentHeight = element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        return contentHeight / element.options[0].getBoundingClientRect().height;
      });
      expect(rows).toBeCloseTo(size, 0);
    }
    const queue = page.getByRole('listbox', { name: 'Queue', exact: true });
    await expect(queue).toHaveCSS('appearance', 'auto');
    await queue.focus();
    await page.keyboard.press('ArrowDown');
    await expect(queue).toHaveValue('waiting');
  });

  for (const appearance of ['light', 'dark']) {
    test(`open picker options and groups follow live ${appearance} appearance outside a clipped pane`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: appearance });
      await openFixture(page);
      await requireStyledPicker(page);
      const select = page.getByRole('combobox', { name: 'Mailbox', exact: true });
      await select.click();
      await expect(select).toHaveCSS('appearance', 'base-select');
      const work = select.locator('option[value="work"]');
      const personal = select.locator('option[value="personal"]');
      const offline = select.locator('option[value="offline"]');
      const clipped = await page.locator('#clipped').boundingBox();
      const option = await work.boundingBox();
      expect(option.y + option.height).toBeGreaterThan(clipped.y + clipped.height);
      await work.hover();
      await expect(work).toHaveCSS('background-color', 'rgb(0, 100, 208)');
      await expect(work).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(select.locator('option:checked')).toHaveCSS('background-color', palette[appearance].selection);
      await offline.hover();
      expect(await offline.evaluate(element => element.matches(':disabled'))).toBe(true);
      for (const system of [appearance, appearance === 'light' ? 'dark' : 'light']) {
        await page.emulateMedia({ colorScheme: system });
        const colors = palette[system];
        await expect(personal).toHaveCSS('background-color', colors.control);
        await expect(personal).toHaveCSS('color', colors.text);
        await expect(offline).toHaveCSS('color', colors.disabled);
        await expect(select.locator('optgroup').first()).toHaveCSS('color', colors.secondary);
        expect(await select.evaluate(element => getComputedStyle(element, '::picker(select)').backgroundColor)).toBe(colors.control);
        expect(await select.evaluate(element => element.matches(':open'))).toBe(true);
      }
      await personal.click();
      await expect(select).toHaveValue('personal');
    });
  }

  test('a narrow picker contains long options and scrolls without widening the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openFixture(page);
    await requireStyledPicker(page);
    const select = page.getByRole('combobox', { name: 'Mailbox', exact: true });
    await select.evaluate(element => {
      for (let i = 0; i < 20; i++) element.add(new Option(`A long mailbox label ${i} for customer-success@example.com`, `mailbox-${i}`));
    });
    await select.click();
    const first = await select.locator('option').first().boundingBox();
    expect(first.x).toBeGreaterThanOrEqual(0);
    expect(first.x + first.width).toBeLessThanOrEqual(320);
    expect(await select.evaluate(element => parseFloat(getComputedStyle(element, '::picker(select)').height))).toBeLessThanOrEqual(320);
    await select.locator('option[value="mailbox-19"]').click();
    await expect(select).toHaveValue('mailbox-19');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('forced colors keep the focused option and disabled choices distinct', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await openFixture(page);
    await requireStyledPicker(page);
    const select = page.getByRole('combobox', { name: 'Mailbox', exact: true });
    await select.click();
    const work = select.locator('option[value="work"]');
    await work.hover();
    const colors = await work.evaluate(element => {
      const style = getComputedStyle(element);
      return { text: style.color, background: style.backgroundColor };
    });
    expect(colors.text).not.toBe(colors.background);
    const offline = select.locator('option[value="offline"]');
    expect(await offline.evaluate(element => getComputedStyle(element).color)).not.toBe(colors.text);
    await work.click();
    await expect(select).toHaveValue('work');
  });
});

test.describe('touch picker fallback', () => {
  test.use({ javaScriptEnabled: false, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('native rendering retains values and follows live system appearance', async ({ page }) => {
    await openFixture(page);
    const select = page.getByRole('combobox', { name: 'Mailbox', exact: true });
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    await expect(select).toHaveCSS('appearance', 'auto');
    await select.selectOption('work');
    await expect(select).toHaveValue('work');
    for (const appearance of ['dark', 'light']) {
      await page.emulateMedia({ colorScheme: appearance });
      await expect(select).toHaveCSS('color-scheme', appearance);
      await expect(select.locator('option[value="personal"]')).toHaveCSS('color', palette[appearance].text);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

for (const appearance of ['light', 'dark']) {
  test(`open select options meet automated accessibility checks in ${appearance}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: appearance });
    await openFixture(page);
    await requireStyledPicker(page);
    await page.getByRole('combobox', { name: 'Mailbox', exact: true }).click();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(violations).toEqual([]);
  });
}

test('real native picker selection updates status through the existing Alpine support form', async ({ page }) => {
  await page.goto('/support.html');
  await requireStyledPicker(page);
  const select = page.getByRole('combobox', { name: 'Conversation status', exact: true });
  await select.click();
  await select.locator('option[value="waiting"]').click();
  await expect(page.locator('button.support-ticket')).toHaveCount(5);
  await expect(page.locator('#support-queues').getByRole('button', { name: /^Waiting/ })).toContainText('3');
  await page.locator('#support-queues').getByRole('button', { name: /^Waiting/ }).click();
  await page.locator('button.support-ticket[data-ticket-id="1042"]').click();
  await expect(select).toHaveValue('waiting');
});
