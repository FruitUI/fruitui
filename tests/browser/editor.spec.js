import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// The rich editor's links, images, uploads and formatting (gallery specimen #component-editor).
const value = page => page.locator('#gallery-editor').inputValue();

test.beforeEach(async ({ page }) => {
  await page.goto('/components.html');
});

function editor(page) {
  const root = page.locator('#component-editor');
  return { root, surface: root.locator('.f-editor__surface > .tiptap') };
}

test('links are added on the selection, edited in place and removed from a popover', async ({ page }) => {
  const { root, surface } = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Read the guide');
  await page.keyboard.press('Shift+ArrowLeft');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowLeft');
  const link = root.getByRole('button', { name: 'Link', exact: true });
  await link.click();
  const popover = page.getByRole('dialog', { name: 'Link address' });
  const address = popover.getByRole('textbox', { name: 'Link address' });
  await expect(address).toBeFocused();
  await address.fill('https://forma.example/guide');
  await popover.getByRole('button', { name: 'Apply' }).click();
  await expect(popover).toBeHidden();
  await expect
    .poll(() => value(page))
    .toContain('<a target="_blank" rel="noopener noreferrer nofollow" href="https://forma.example/guide">guide</a>');

  // Inside the link the popover shows its address and can remove it; Escape returns to the button.
  await surface.getByText('guide').click();
  await link.click();
  await expect(address).toHaveValue('https://forma.example/guide');
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(link).toBeFocused();
  await surface.getByText('guide').click();
  await link.click();
  await popover.getByRole('button', { name: 'Remove link' }).click();
  await expect.poll(() => value(page)).not.toContain('<a ');
});

test('images insert by address, formatting clears, and pasted or dropped images go through the upload hook', async ({
  page,
  browserName,
}) => {
  const { root, surface } = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+End');
  await root.getByRole('button', { name: 'Image', exact: true }).click();
  const popover = page.getByRole('dialog', { name: 'Image address' });
  await popover.getByRole('textbox', { name: 'Image address' }).fill('https://cdn.forma.example/logo.png');
  await popover.getByRole('button', { name: 'Insert' }).click();
  await expect.poll(() => value(page)).toContain('<img src="https://cdn.forma.example/logo.png">');

  // Remove formatting turns the bold signature back into plain text.
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await root.getByRole('button', { name: 'Remove formatting' }).click();
  await expect.poll(() => value(page)).not.toContain('<strong>');

  // The application answers the upload hook with the uploaded file's address.
  await page.locator('#gallery-editor').evaluate(control =>
    control.addEventListener('fruit-editor-upload', event => {
      window.uploaded = event.detail.files.map(file => file.name);
      event.detail.insert('https://cdn.forma.example/screenshot.png', 'Screenshot');
    }),
  );
  // A dropped file goes through the same hook, at the drop position.
  await surface.evaluate(element => {
    const data = new DataTransfer();
    data.items.add(new File(['png'], 'screenshot.png', { type: 'image/png' }));
    const box = element.getBoundingClientRect();
    element.dispatchEvent(
      new DragEvent('drop', {
        dataTransfer: data,
        clientX: box.left + 8,
        clientY: box.top + 8,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect
    .poll(() => value(page))
    .toContain('<img src="https://cdn.forma.example/screenshot.png" alt="Screenshot">');
  expect(await page.evaluate(() => window.uploaded)).toEqual(['screenshot.png']);

  // Script-made paste events carry their data only in Chromium; real pastes work in every engine.
  if (browserName !== 'chromium') return;
  await page.evaluate(() => (window.uploaded = []));
  await surface.evaluate(element => {
    const data = new DataTransfer();
    data.items.add(new File(['png'], 'pasted.png', { type: 'image/png' }));
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect.poll(() => page.evaluate(() => window.uploaded)).toEqual(['pasted.png']);
  // Pasted data: images are refused; they belong in the upload hook.
  await surface.evaluate(element => {
    const data = new DataTransfer();
    data.setData('text/html', '<p>Pasted <img src="data:image/png;base64,AAAA"></p>');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect.poll(() => value(page)).toContain('Pasted');
  expect(await value(page)).not.toContain('data:image');
});

for (const colorScheme of ['light', 'dark']) {
  test(`the link popover is accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const { root, surface } = editor(page);
    await surface.click();
    await root.getByRole('button', { name: 'Link', exact: true }).click();
    await expectAccessible(page, '#component-editor');
  });
}

test('app buttons and menus follow the default toolbar and insert at the cursor', async ({ page }) => {
  const { root, surface } = editor(page);
  const toolbar = root.locator('.f-editor__toolbar');
  // The defaults stay; the extras follow a separator.
  await expect(toolbar.getByRole('button', { name: 'Bold', exact: true })).toBeVisible();
  await expect(toolbar.getByRole('separator')).toBeVisible();
  await surface.click();
  await page.keyboard.press('ControlOrMeta+End');
  await toolbar.getByRole('button', { name: 'Insert variable' }).click();
  const menu = page.getByRole('menu', { name: 'Insert variable' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Customer first name' }).click();
  await expect(menu).toBeHidden();
  await expect.poll(() => value(page)).toContain('{%customer.firstName%}');
});
