import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// The rich editor's links, images, uploads and formatting (gallery specimen #component-editor).
const value = page => page.locator('#gallery-editor').inputValue();

test.beforeEach(async ({ page }) => {
  await page.goto('/components.html');
});

function editor(page) {
  const root = page.locator('#editor-example');
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
  const popover = page.getByRole('dialog', { name: 'Link Address' });
  const address = popover.getByRole('textbox', { name: 'Link Address' });
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
  await popover.getByRole('button', { name: 'Remove Link' }).click();
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
  const popover = page.getByRole('dialog', { name: 'Image Address' });
  await popover.getByRole('textbox', { name: 'Image Address' }).fill('https://cdn.forma.example/logo.png');
  await popover.getByRole('button', { name: 'Insert' }).click();
  await expect.poll(() => value(page)).toContain('<img src="https://cdn.forma.example/logo.png">');

  // Remove formatting turns the bold signature back into plain text.
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await root.getByRole('button', { name: 'Remove Formatting' }).click();
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
  await expect(toolbar.getByRole('separator').last()).toBeVisible();
  await surface.click();
  await page.keyboard.press('ControlOrMeta+End');
  await toolbar.getByRole('button', { name: 'Insert Variable' }).click();
  const menu = page.getByRole('menu', { name: 'Insert Variable' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Customer First Name' }).click();
  await expect(menu).toBeHidden();
  await expect.poll(() => value(page)).toContain('{%customer.firstName%}');
});

test('typed addresses become links, and readonly or disabled set later lock the rich surface', async ({ page }) => {
  const { surface } = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('See https://forma.example/help now');
  await expect.poll(() => value(page)).toContain('href="https://forma.example/help"');
  const control = page.locator('#gallery-editor');
  for (const attribute of ['readonly', 'disabled']) {
    await control.evaluate((element, name) => element.setAttribute(name, ''), attribute);
    await expect(surface).toHaveAttribute('contenteditable', 'false');
    await control.evaluate((element, name) => element.removeAttribute(name), attribute);
    await expect(surface).toHaveAttribute('contenteditable', 'true');
  }
});

test('plain paste drops formatting and can be switched at runtime', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Script-made paste events carry their data only in Chromium.');
  const { root, surface } = editor(page);
  const paste = () =>
    surface.evaluate(element => {
      const data = new DataTransfer();
      data.setData('text/html', '<p><strong>Bold</strong> <em>words</em></p>');
      data.setData('text/plain', 'Bold words\nNext line');
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    });
  await root.locator('.f-editor').evaluate(element => (element.dataset.fruitPaste = 'plain'));
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await paste();
  await expect.poll(() => value(page)).toBe('<p>Bold words<br>Next line</p>');
  // Back to rich paste without reloading.
  await root.locator('.f-editor').evaluate(element => (element.dataset.fruitPaste = 'rich'));
  await page.keyboard.press('ControlOrMeta+a');
  await paste();
  await expect.poll(() => value(page)).toContain('<strong>Bold</strong>');
});

test('a channel’s formats limit the toolbar and the markup that shortcuts and paste can produce', async ({ page }) => {
  const root = page.locator('#editor-formats-example');
  const surface = root.locator('.f-editor__surface > .tiptap');
  const value = () => page.locator('#gallery-chat-editor').inputValue();
  const commands = await root
    .locator('[data-fruit-command]')
    .evaluateAll(buttons => buttons.map(button => button.dataset.fruitCommand));
  expect(commands).toEqual(['bold', 'italic', 'link', 'clear', 'undo', 'redo']);
  await surface.click();
  // Allowed: the bold shortcut. Not allowed: a heading or list typed as Markdown.
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.type('Hello');
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.press('Enter');
  await page.keyboard.type('# Not a heading');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- not a list');
  await expect.poll(value).toBe('<p><strong>Hello</strong></p><p># Not a heading</p><p>- not a list</p>');
  // Pasted markup keeps what the channel supports and drops the rest.
  await page.keyboard.press('ControlOrMeta+a');
  // ProseMirror's own paste path; Firefox ignores data on a synthetic paste event.
  await surface.evaluate(element =>
    element.editor.view.pasteHTML(
      '<h1>Title</h1><ul><li><em>One</em></li></ul><blockquote>Quote</blockquote><p><a href="https://example.com">Site</a> <s>gone</s></p>',
    ),
  );
  await expect
    .poll(value)
    .toBe(
      '<p>Title</p><p><em>One</em></p><p>Quote</p><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com">Site</a> gone</p>',
    );
  await expectAccessible(page, '#component-editor');
});

test('an inline editor is a chat field: one line, formatting on demand, Enter sends', async ({ page }) => {
  const form = page.locator('#editor-inline-example');
  const surface = form.locator('.f-editor__surface > .tiptap');
  const toolbar = form.locator('.f-editor__toolbar');
  const formatting = form.getByRole('button', { name: 'Formatting', exact: true });
  await expect(surface).toHaveAttribute('aria-placeholder', 'Message Lena Wilson');
  await expect(surface).toHaveAttribute('data-empty', '');
  expect(await surface.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(44);
  await expect(form.getByRole('button', { name: 'Send' })).toBeHidden();
  // The channel's formatting bar shows on demand.
  await expect(toolbar).toBeHidden();
  await expect(formatting).toHaveAttribute('aria-expanded', 'false');
  await formatting.click();
  await expect(toolbar).toBeVisible();
  await expect(formatting).toHaveAttribute('aria-expanded', 'true');
  const commands = await toolbar
    .locator('[data-fruit-command]')
    .evaluateAll(buttons => buttons.map(button => button.dataset.fruitCommand));
  expect(commands).toEqual(['bold', 'italic', 'link', 'clear', 'undo', 'redo']);
  // Shift+Enter breaks the line; Enter sends the form and the field empties.
  await surface.click();
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.type('Bold');
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('next line');
  await expect(surface).not.toHaveAttribute('data-empty');
  await page.keyboard.press('Enter');
  await expect(form.locator('code')).toHaveText('<p><strong>Bold</strong><br>next line</p>');
  await expect(surface).toHaveAttribute('data-empty', '');
  await expectAccessible(page, '#component-editor');
});
