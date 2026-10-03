import { test, expect } from '@playwright/test';
import { expectAccessible, tokenColor } from './helpers.js';

const fixture = `<!doctype html><html class="fruit-ui" lang="en"><head>
  <meta name="viewport" content="width=device-width, initial-scale=1"><title>Native controls</title>
  <link rel="stylesheet" href="/src/fruitui.css">
  <style>main { padding: 20px; max-width: 600px; } form, .specimens { display: grid; gap: 16px; } h1 { margin-bottom: 20px; }</style>
</head><body><main><h1>Native controls</h1><form action="http://127.0.0.1:5180/native-submit" method="post" enctype="multipart/form-data">
  <fieldset class="f-fieldset"><legend>Notifications</legend><div class="f-row">
    <label class="f-check"><input type="checkbox" name="sounds" value="1" checked>Sound</label>
    <label class="f-check"><input type="checkbox" name="previews" value="1" aria-invalid="true">Preview</label>
  </div></fieldset>
  <fieldset class="f-fieldset"><legend>Density</legend><div class="f-row">
    <label class="f-check"><input type="radio" name="density" value="comfortable" checked>Comfortable</label>
    <label class="f-check"><input type="radio" name="density" value="compact">Compact</label>
  </div></fieldset>
  <fieldset class="f-fieldset" disabled><legend>Unavailable <label class="f-check"><input type="checkbox" name="legend" value="1">Legend exception</label></legend>
    <label class="f-field"><span class="f-label">Disabled field</span><input class="f-input" name="disabled" value="excluded"></label>
    <label class="f-check"><input type="checkbox" name="disabled-choice" checked>Disabled choice</label>
  </fieldset>
  <label class="f-field"><span class="f-label">Workspace ID</span><input class="f-input" name="workspace" value="forma" readonly></label>
  <label class="f-field"><span class="f-label">Email</span><input class="f-input" type="email" name="email" autocomplete="email" value="alex@example.com"></label>
  <label class="f-field"><span class="f-label">Files</span><input class="f-input f-file" type="file" name="files[]" accept=".txt" multiple></label>
  <label class="f-field"><span class="f-label">Seats</span><input class="f-input" type="number" name="seats" min="1" max="9" step="2" value="3" required></label>
  <label class="f-field"><span class="f-label">Date</span><input class="f-input" type="date" name="date" value="2026-10-02" min="2026-10-01"></label>
  <label class="f-field"><span class="f-label">Scheduled at</span><input class="f-input" type="datetime-local" name="scheduled" value="2026-10-02T09:30"></label>
  <label class="f-field"><span class="f-label">Month</span><input class="f-input" type="month" name="month" value="2026-10"></label>
  <label class="f-field"><span class="f-label">Week</span><input class="f-input" type="week" name="week" value="2026-W40"></label>
  <label class="f-field"><span class="f-label">Time</span><input class="f-input" type="time" name="time" value="18:30" step="60"></label>
  <label class="f-field"><span class="f-label">Color</span><input class="f-input f-color" type="color" name="color" value="#006cde"></label>
  <label class="f-field"><span class="f-label">Scale</span><input class="f-range" type="range" name="scale" min="0" max="100" step="10" value="40"></label>
  <div class="f-row"><button class="f-button" type="reset">Reset</button><button class="f-button" type="submit">Save</button></div>
</form><div class="specimens">
  <label class="f-field"><span class="f-label">Import progress</span><progress class="f-progress" value="4" max="10">4 of 10</progress></label>
  <label class="f-field"><span class="f-label">Connecting</span><progress class="f-progress">Connecting</progress></label>
  <label class="f-field"><span class="f-label">Storage</span><meter class="f-meter" min="0" max="100" low="60" high="85" optimum="20" value="35">35 GB</meter></label>
  <p>Use <code>wire:model</code> or press <kbd>Return</kbd>.</p><blockquote><p>A quoted passage.</p></blockquote><hr><pre tabindex="0" role="region" aria-label="Code example"><code>const ready = true;</code></pre>
</div></main></body></html>`;

async function openFixture(page) {
  await page.route('**/native-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.goto('/native-fixture');
}

test.describe('CSS-only native forms', () => {
  test.use({ javaScriptEnabled: false });

  test('styled choices retain keyboard, mixed state, group values, disabled inheritance and reset', async ({
    page,
  }) => {
    await openFixture(page);
    const sound = page.getByRole('checkbox', { name: 'Sound', exact: true });
    await sound.focus();
    await page.keyboard.press('Space');
    await expect(sound).not.toBeChecked();
    await sound.evaluate(element => {
      element.indeterminate = true;
    });
    expect(await sound.evaluate(element => element.matches(':indeterminate'))).toBe(true);
    await expect(sound).toHaveCSS('background-color', await tokenColor(page, '--f-accent-fill'));
    await page.keyboard.press('Space');
    await expect(sound).toBeChecked();
    expect(await sound.evaluate(element => element.indeterminate)).toBe(false);
    await page.getByRole('radio', { name: 'Comfortable', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Compact', exact: true })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Comfortable', exact: true })).not.toBeChecked();
    await expect(page.getByRole('group', { name: 'Notifications', exact: true })).toBeVisible();
    await expect(page.getByLabel('Disabled field', { exact: true })).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: 'Disabled choice', exact: true })).toBeDisabled();
    await page.getByRole('checkbox', { name: 'Legend exception', exact: true }).check();
    const values = await page.locator('form').evaluate(form => Object.fromEntries(new FormData(form)));
    expect(values.density).toBe('compact');
    expect(values.legend).toBe('1');
    expect(values).not.toHaveProperty('disabled');
    expect(values).not.toHaveProperty('disabled-choice');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(sound).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Comfortable', exact: true })).toBeChecked();
  });

  test('numeric and range stepping, validation and readonly submission remain native', async ({ page }) => {
    await openFixture(page);
    const seats = page.getByRole('spinbutton', { name: 'Seats', exact: true });
    await seats.focus();
    await page.keyboard.press('ArrowUp');
    await expect(seats).toHaveValue('5');
    await seats.fill('4');
    expect(await seats.evaluate(element => element.validity.stepMismatch)).toBe(true);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/native-fixture$/);
    await expect(seats).toBeFocused();
    await seats.fill('5');
    const range = page.getByRole('slider', { name: 'Scale', exact: true });
    await range.evaluate(element => {
      element.setAttribute('aria-invalid', 'true');
    });
    await range.focus();
    await page.keyboard.press('ArrowRight');
    await expect(range).toHaveValue('50');
    await expect(range).toHaveCSS('outline-width', '3px'); // Error styling must preserve keyboard focus.
    await page.keyboard.press('End');
    await expect(range).toHaveValue('100');
    await page.keyboard.press('Home');
    await expect(range).toHaveValue('0');
    const readonly = page.getByRole('textbox', { name: 'Workspace ID', exact: true });
    await readonly.focus();
    await page.keyboard.type('changed');
    await expect(readonly).toHaveValue('forma');
    await expect(readonly).toBeFocused();
    expect(await readonly.evaluate(element => new FormData(element.form).get('workspace'))).toBe('forma');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(seats).toHaveValue('3');
    await expect(range).toHaveValue('40');
  });

  test('file, calendar, time and color values reach an actual multipart form submission', async ({ page }) => {
    await openFixture(page);
    await page.getByLabel('Files', { exact: true }).setInputFiles([
      { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.from('first attachment') },
      { name: 'second.txt', mimeType: 'text/plain', buffer: Buffer.from('second attachment') },
    ]);
    await page.getByLabel('Date', { exact: true }).fill('2026-10-12');
    await page.getByLabel('Time', { exact: true }).fill('09:45');
    await page.getByLabel('Color', { exact: true }).fill('#ff8800');
    const requestPromise = page.waitForRequest('**/native-submit');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const request = await requestPromise;
    expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=');
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible();
    // Read what PHP actually receives; WebKit's protocol omits file bytes from postDataBuffer.
    const received = JSON.parse(await page.locator('#received').textContent());
    expect(received.files).toEqual([
      { name: 'first.txt', content: 'first attachment' },
      { name: 'second.txt', content: 'second attachment' },
    ]);
    for (const value of ['2026-10-12', '2026-10-02T09:30', '2026-10', '2026-W40', '09:45', '#ff8800', 'forma'])
      expect(Object.values(received.values)).toContain(value);
    expect(received.values).not.toHaveProperty('excluded');
  });

  for (const theme of ['light', 'dark']) {
    test(`native parts, states and rich text follow ${theme} and live system changes`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await openFixture(page);
      for (const appearance of [theme, theme === 'light' ? 'dark' : 'light']) {
        await page.emulateMedia({ colorScheme: appearance });
        const dark = appearance === 'dark';
        await expect(page.getByLabel('Workspace ID', { exact: true })).toHaveCSS(
          'background-color',
          dark ? 'rgb(45, 45, 49)' : 'rgb(243, 243, 245)',
        );
        await expect(page.getByLabel('Workspace ID', { exact: true })).toHaveCSS(
          'color',
          dark ? 'rgb(176, 176, 184)' : 'rgb(101, 101, 108)',
        );
        for (const name of ['Files', 'Seats', 'Date', 'Time', 'Color']) {
          await expect(page.getByLabel(name, { exact: true })).toHaveCSS('color-scheme', appearance);
          await expect(page.getByLabel(name, { exact: true })).toHaveCSS(
            'background-color',
            dark ? 'rgb(57, 57, 62)' : 'rgb(255, 255, 255)',
          );
        }
        await expect(page.locator('pre')).toHaveCSS(
          'background-color',
          dark ? 'rgb(45, 45, 49)' : 'rgb(243, 243, 245)',
        );
        await expect(page.locator('blockquote')).toHaveCSS('color', dark ? 'rgb(176, 176, 184)' : 'rgb(101, 101, 108)');
        const fileButton = await page
          .getByLabel('Files', { exact: true })
          .evaluate(element => getComputedStyle(element, '::file-selector-button').color);
        expect(fileButton).toBe(dark ? 'rgb(243, 243, 245)' : 'rgb(34, 34, 37)');
        const sound = page.getByRole('checkbox', { name: 'Sound', exact: true });
        await expect(sound).toHaveCSS('background-color', await tokenColor(page, '--f-accent-fill'));
        expect(await sound.evaluate(element => getComputedStyle(element, '::before').visibility)).toBe('visible');
        const radio = page.getByRole('radio', { name: 'Comfortable', exact: true });
        await expect(radio).toHaveCSS('border-radius', '50%');
        await expect(page.getByRole('checkbox', { name: 'Disabled choice', exact: true })).toHaveCSS('opacity', '0.45');
        for (const name of ['Color', 'Scale']) {
          const control = page.getByLabel(name, { exact: true });
          await control.evaluate(element => {
            element.disabled = true;
          });
          await expect(control).toHaveCSS('cursor', 'not-allowed');
          await expect(control).toHaveCSS('opacity', '0.45');
          await control.evaluate(element => {
            element.disabled = false;
          });
        }
        await page.getByRole('checkbox', { name: 'Preview', exact: true }).focus();
        await expect(page.getByRole('checkbox', { name: 'Preview', exact: true })).toHaveCSS(
          'border-color',
          dark ? 'rgb(255, 129, 121)' : 'rgb(197, 47, 39)',
        );
      }
    });
  }

  test('progress and meter preserve their native measurement and indeterminate contracts', async ({ page }) => {
    await openFixture(page);
    const progress = page.getByRole('progressbar', { name: 'Import progress', exact: true });
    expect(await progress.evaluate(element => element.position)).toBe(0.4);
    const connecting = page.getByRole('progressbar', { name: 'Connecting', exact: true });
    expect(await connecting.evaluate(element => element.position)).toBe(-1);
    expect(await connecting.evaluate(element => element.matches(':indeterminate'))).toBe(true);
    await expect(connecting).toHaveCSS('animation-name', 'f-progress-pulse');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(connecting).toHaveCSS('animation-name', 'none');
    const meter = page.getByRole('meter', { name: 'Storage', exact: true });
    expect(
      await meter.evaluate(element => ({
        value: element.value,
        min: element.min,
        max: element.max,
        low: element.low,
        high: element.high,
        optimum: element.optimum,
      })),
    ).toEqual({ value: 35, min: 0, max: 100, low: 60, high: 85, optimum: 20 });
    await meter.evaluate(element => {
      element.value = 150;
    });
    expect(await meter.evaluate(element => element.value)).toBe(100); // Native clamping, no synthetic ARIA value.
  });

  test('forced colors retain native choice marks and visible indicators', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await openFixture(page);
    const choice = page.getByRole('checkbox', { name: 'Sound', exact: true });
    await expect(choice).toHaveCSS('appearance', 'auto');
    await choice.focus();
    await page.keyboard.press('Space');
    await expect(choice).not.toBeChecked();
    const progress = page.getByRole('progressbar', { name: 'Import progress', exact: true });
    await expect(progress).toHaveCSS('outline-style', 'solid');
    expect(await progress.evaluate(element => getComputedStyle(element).outlineColor)).not.toBe(
      await progress.evaluate(element => getComputedStyle(element).backgroundColor),
    );
  });
});

for (const theme of ['light', 'dark']) {
  test(`new controls and rich text are accessible and fit the gallery at 320px in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/components.html');
    await expectAccessible(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const name of [
      'file',
      'number',
      'date',
      'time',
      'color',
      'range',
      'progress',
      'meter',
      'fieldset',
      'typography',
    ]) {
      const card = page.locator(`#component-${name}`);
      await card.scrollIntoViewIfNeeded();
      const box = await card.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
  });
}

test('autofill keeps the shared palette and remains editable', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Autofill injection requires Chromium CDP; native editing is covered on all engines',
  );
  await openFixture(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[name=email]' });
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['autofill'] });
  const email = page.getByLabel('Email', { exact: true });
  expect(await email.evaluate(element => element.matches(':autofill'))).toBe(true);
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(email).toHaveCSS(
      '-webkit-text-fill-color',
      theme === 'dark' ? 'rgb(243, 243, 245)' : 'rgb(34, 34, 37)',
    );
    await expect(email).toHaveCSS(
      'box-shadow',
      `rgb(${theme === 'dark' ? '57, 57, 62' : '255, 255, 255'}) 0px 0px 0px 1000px inset`,
    );
  }
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  await email.fill('morgan@example.com');
  await expect(email).toHaveValue('morgan@example.com');
});

test('styled search cancellation updates the existing Alpine search', async ({ page }) => {
  await page.goto('/admin.html');
  test.skip(
    !(await page.evaluate(() => CSS.supports('selector(input::-webkit-search-cancel-button)'))),
    'This browser retains its own search editing controls',
  );
  const search = page.getByRole('searchbox', { name: 'Search customers', exact: true });
  await search.fill('Sophie');
  await expect(page.locator('tr[data-customer]')).toHaveCount(1);
  const box = await search.boundingBox();
  await search.click({ position: { x: box.width - 18, y: box.height / 2 } });
  await expect(search).toHaveValue('');
  await expect(page.locator('tr[data-customer]')).toHaveCount(5);
});

test('a drop zone assigns accepted dropped files to its native input and sends change', async ({ page }) => {
  await page.goto('/components.html');
  const zone = page.locator('#component-dropzone .f-dropzone');
  const drop = async names =>
    zone.evaluate((element, names) => {
      const transfer = new DataTransfer();
      for (const name of names)
        transfer.items.add(
          new File(['FruitUI'], name, {
            type: name.endsWith('.png') ? 'image/png' : name.endsWith('.txt') ? 'text/plain' : 'application/zip',
          }),
        );
      for (const type of ['dragenter', 'dragover', 'drop'])
        element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }, names);
  await drop(['notes.txt', 'archive.zip', 'photo.png']);
  await expect(page.locator('#component-dropzone').getByRole('status')).toHaveText('notes.txt, photo.png');
  expect(await zone.locator('input').evaluate(input => input.files.length)).toBe(2);
  await expect(zone).not.toHaveAttribute('data-dragging');
  await expect(page.getByLabel('Attachments', { exact: true }).first()).toHaveAttribute('type', 'file');
});

test('Mail compose accepts dropped attachments through its existing upload handler', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /compose|new message/i })
    .first()
    .click();
  const zone = page.locator('.f-dropzone').first();
  await zone.evaluate(element => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['FruitUI'], 'brief.txt', { type: 'text/plain' }));
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(page.locator('.f-upload__row').first()).toContainText('brief.txt');
});

test('date, time and color fields share the text field frame in every engine', async ({ page }) => {
  await page.goto('/components.html');
  const frame = selector =>
    page
      .locator(selector)
      .first()
      .evaluate(element => {
        const style = getComputedStyle(element);
        return {
          appearance: style.appearance,
          radius: style.borderTopLeftRadius,
          height: element.getBoundingClientRect().height,
        };
      });
  const text = await frame('#component-input input');
  for (const selector of [
    '#component-date input[type=date]',
    '#component-date input[type=datetime-local]',
    '#component-time input',
    '#component-color input',
  ]) {
    const control = await frame(selector);
    // WebKit otherwise keeps a native frame that ignores the shared radius and padding.
    expect(control.appearance, selector).toBe('none');
    expect(control.radius, selector).toBe(text.radius);
    expect(Math.abs(control.height - text.height), selector).toBeLessThanOrEqual(1);
  }
});

test('the date picker replaces the browser popup with a calendar that keeps native typing and value', async ({
  page,
}) => {
  await page.goto('/components.html');
  const date = page.locator('#component-date input[type=date]');
  const changes = [];
  await page.exposeFunction('recordChange', value => changes.push(value));
  await date.evaluate(element => element.addEventListener('change', () => window.recordChange(element.value)));
  const calendar = page.getByRole('dialog', { name: 'Choose date' }).first();

  // A click opens FruitUI's calendar instead of the browser's picker; focus stays in the field.
  await date.click();
  await expect(calendar).toBeVisible();
  expect(await date.evaluate(element => element.matches(':open'))).toBe(false);
  await expect(date).toBeFocused();
  const grid = calendar.getByRole('grid', { name: 'October 2026' });
  await expect(grid.getByRole('gridcell', { selected: true })).toHaveText('2');

  // Alt+Down moves into the grid; arrows, PageDown and Enter choose a day and return focus.
  await date.press('Alt+ArrowDown');
  await expect(grid.getByRole('button', { name: /October 2, 2026/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('PageDown');
  await expect(calendar.getByRole('grid', { name: 'November 2026' })).toBeVisible();
  await expect(calendar.getByRole('button', { name: /November 9, 2026/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(calendar).toBeHidden();
  await expect(date).toHaveValue('2026-11-09');
  await expect(date).toBeFocused();
  expect(changes).toEqual(['2026-11-09']);

  // Typed values move the open calendar; Escape closes it and keeps focus in the field.
  await date.click();
  await date.fill('2027-02-14');
  await expect(calendar.getByRole('grid', { name: 'February 2027' })).toBeVisible();
  await date.press('Escape');
  await expect(calendar).toBeHidden();
  await expect(date).toBeFocused();

  // Days outside min/max cannot be chosen; a press outside closes without changing the value.
  await date.evaluate(element => (element.max = '2027-02-20'));
  await date.click();
  const late = calendar.getByRole('button', { name: /February 21, 2027/ });
  await expect(late).toHaveAttribute('aria-disabled', 'true');
  await late.click({ force: true });
  await expect(date).toHaveValue('2027-02-14');
  await page.mouse.click(5, 5);
  await expect(calendar).toBeHidden();
});

test('a date-time picker keeps the typed time when a day is chosen', async ({ page }) => {
  await page.goto('/components.html');
  const scheduled = page.locator('#component-date input[type=datetime-local]');
  await scheduled.click();
  const calendar = page.getByRole('dialog', { name: 'Choose date' });
  await calendar.getByRole('button', { name: /October 15, 2026/ }).click();
  await expect(scheduled).toHaveValue('2026-10-15T09:30');
});

test('the color picker offers swatches and a custom editor in one popover', async ({ page }) => {
  await page.goto('/components.html');
  await page.evaluate(() => {
    window.pickerOpened = 0;
    HTMLInputElement.prototype.showPicker = function () {
      window.pickerOpened++;
    };
  });
  const color = page.locator('#component-color input[type=color]');
  const palette = page.getByRole('dialog', { name: 'Choose color' });
  await color.click();
  await expect(palette).toBeVisible();
  expect(await color.evaluate(element => element.matches(':open'))).toBe(false);
  const swatches = palette.getByRole('listbox', { name: 'Colors' });
  await expect(swatches.getByRole('option')).toHaveCount(13);
  await expect(swatches.getByRole('option', { name: 'Red' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(swatches.getByRole('option', { name: 'Blue' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(palette).toBeHidden();
  await expect(color).toHaveValue('#007aff');
  await expect(color).toBeFocused();

  // Other… expands the editor in the same popover, never the browser's chooser.
  await color.press('Enter');
  await expect(swatches.getByRole('option', { name: 'Blue', selected: true })).toBeFocused();
  await palette.getByRole('button', { name: 'Other…' }).click();
  const area = palette.getByRole('slider', { name: 'Saturation and brightness' });
  await expect(area).toBeFocused();
  await expect(area).toHaveAttribute('aria-valuetext', 'Saturation 100%, brightness 100%');
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(area).toHaveAttribute('aria-valuetext', 'Saturation 90%, brightness 100%');
  await expect(color).toHaveValue('#1987ff');
  const hue = palette.getByRole('slider', { name: 'Hue' });
  await hue.fill('0');
  await expect(color).toHaveValue('#ff1919');
  const hex = palette.getByRole('textbox', { name: 'Hex' });
  await hex.fill('#34c759');
  await expect(color).toHaveValue('#34c759');
  await expect(hue).toHaveValue('135');

  // Dragging in the area sets saturation and brightness under the pointer.
  const box = await area.boundingBox();
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(area).toHaveAttribute('aria-valuetext', /^Saturation 5\d%, brightness 5\d%$/);
  await hex.press('Enter');
  await expect(palette).toBeHidden();
  expect(await page.evaluate(() => window.pickerOpened)).toBe(0);

  // Reopening starts from the swatches again.
  await color.click();
  await expect(palette.getByRole('button', { name: 'Other…' })).toBeVisible();
  await expect(area).toBeHidden();
});

test('time fields stay typed without a browser popup button', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only Chromium draws a time picker button that CSS can hide.');
  await page.goto('/components.html');
  // The field's end, where Chromium draws its clock button, holds no icon pixels.
  const time = page.locator('#component-time input');
  await time.scrollIntoViewIfNeeded();
  const box = await time.boundingBox();
  const image = await page.screenshot({
    clip: { x: box.x + box.width - 36, y: box.y + 4, width: 32, height: box.height - 8 },
  });
  const iconPixels = await page.evaluate(async source => {
    const picture = new Image();
    picture.src = `data:image/png;base64,${source}`;
    await picture.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width: picture.width, height: picture.height });
    const context = canvas.getContext('2d');
    context.drawImage(picture, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let dark = 0;
    for (let index = 0; index < data.length; index += 4)
      if (data[index] + data[index + 1] + data[index + 2] < 300) dark++;
    return dark;
  }, image.toString('base64'));
  expect(iconPixels).toBe(0);
});

for (const colorScheme of ['light', 'dark']) {
  test(`open date and color pickers are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/components.html');
    await page.locator('#component-date input[type=date]').click();
    await page.keyboard.press('Alt+ArrowDown');
    await expectAccessible(page, '#component-date');
    await page.keyboard.press('Escape');
    await page.locator('#component-color input[type=color]').click();
    await page.getByRole('button', { name: 'Other…' }).click();
    await expectAccessible(page, '#component-color');
  });
}

test('a fieldset stacks its choices and a choice description describes its control', async ({ page }) => {
  await page.goto('/components.html');
  const group = page.getByRole('group', { name: 'Delivery preferences' });
  const email = group.getByRole('checkbox', { name: 'Email updates', exact: true });
  const push = group.getByRole('checkbox', { name: 'Push notifications', exact: true });
  const photos = group.getByRole('switch', { name: 'Customer photos', exact: true });
  await expect(email).toHaveAccessibleDescription('A summary of new conversations each morning.');
  await expect(photos).toHaveAccessibleDescription('From Gravatar, for customers without a photo.');
  // One choice per row, each below the previous one's description.
  const [first, second, third] = await Promise.all([email, push, photos].map(control => control.boundingBox()));
  expect(second.y).toBeGreaterThan(first.y + first.height);
  expect(third.y).toBeGreaterThan(second.y + second.height);
  expect(Math.abs(second.x - first.x)).toBeLessThan(1);
});
