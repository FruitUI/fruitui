import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

// The Editor in Markdown mode: the textarea holds the Markdown as written (#editor-markdown-example).
const markdownEditor = page => {
  const root = page.locator('#editor-markdown-example');
  return { root, field: root.getByRole('textbox', { name: 'Reply Template' }) };
};
/** Select a piece of the field's text, as a person would with the pointer or Shift+arrows. */
const select = (field, text, { from = 0 } = {}) =>
  field.evaluate(
    (element, [text, from]) => {
      const start = element.value.indexOf(text, from);
      element.focus();
      element.setSelectionRange(start, start + text.length);
    },
    [text, from],
  );
const caretAt = (field, position) =>
  field.evaluate((element, position) => {
    element.focus();
    const at = position < 0 ? element.value.length + position + 1 : position;
    element.setSelectionRange(at, at);
  }, position);

/** A Markdown editor added at runtime, with the given formats, layout and Enter behavior. */
async function addEditor(page, { id = 'runtime', formats, inline = false, enter = 'newline' } = {}) {
  await page.evaluate(
    ({ id, formats, inline, enter }) => {
      const form = document.createElement('form');
      form.id = `${id}-form`;
      form.addEventListener('submit', event => {
        event.preventDefault();
        form.dataset.sent = form.querySelector('textarea').value;
      });
      const buttons = [
        'bold',
        'italic',
        'bulletList',
        'orderedList',
        'blockquote',
        'link',
        'image',
        'clear',
        'undo',
        'redo',
      ]
        .filter(command => !formats || formats.includes(command) || ['undo', 'redo', 'clear'].includes(command))
        .map(
          command =>
            `<button class="f-button" type="button" data-fruit-command="${command}" aria-label="${command}">${command}</button>`,
        )
        .join('');
      form.innerHTML = `<label for="${id}-editor">Message</label>
        <div class="f-editor${inline ? ' f-editor--inline' : ''}" data-fruit-mode="markdown" data-fruit-enter="${enter}"${formats ? ` data-fruit-formats="${formats.join(' ')}"` : ''} x-data="fruitEditor">
          <div class="f-editor__toolbar" hidden>${buttons}</div>
          <textarea class="f-input" data-fruit-control id="${id}-editor" name="message"></textarea>
          <div class="f-editor__surface" hidden></div>
        </div>`;
      document.body.append(form);
    },
    { id, formats, inline, enter },
  );
  const field = page.locator(`#${id}-editor`);
  // Alpine starts the editor as it's added.
  await expect.poll(() => field.evaluate(element => Boolean(element.closest('.f-editor')._x_dataStack))).toBe(true);
  return field;
}

/** Paste as the clipboard would deliver it: HTML and text, or files. */
const paste = (field, { html, text, files = [] }) =>
  field.evaluate(
    async (element, { html, text, files }) => {
      const data = new DataTransfer();
      if (html) data.setData('text/html', html);
      if (text) data.setData('text/plain', text);
      for (const [name, type] of files) data.items.add(new File(['image'], name, { type }));
      element.focus();
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    },
    { html, text, files },
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/components.html');
});

test('the textarea holds the Markdown as written, and the toolbar writes its syntax around the selection', async ({
  page,
}) => {
  const { root, field } = markdownEditor(page);
  await expect(field).toHaveValue(
    "Hi {%customer.first_name%},\n\nThanks for **writing**. We'll:\n- look into it\n- reply within a day",
  );
  await expect(field).toHaveAccessibleDescription(/Markdown, as you write it/);
  // No rich surface: the field is the textarea, named by its label and submitted as it reads.
  await expect(root.locator('.tiptap')).toHaveCount(0);
  await expect(root.locator('textarea[name="reply"]')).toBeVisible();
  const button = name => root.getByRole('button', { name, exact: true });
  for (const name of ['Bold', 'Italic', 'Bullets', 'Numbered List', 'Quote', 'Link', 'Image'])
    await expect(button(name)).not.toHaveAttribute('aria-pressed');

  // Bold comes off text that has it, and goes back on; italic adds a star inside it.
  await select(field, 'writing');
  await button('Bold').click();
  await expect(field).toHaveValue(/Thanks for writing\./);
  await button('Bold').click();
  await expect(field).toHaveValue(/Thanks for \*\*writing\*\*\./);
  await button('Italic').click();
  await expect(field).toHaveValue(/Thanks for \*\*\*writing\*\*\*\./);
  await button('Bold').click();
  await expect(field).toHaveValue(/Thanks for \*writing\*\./);
  // The browser's own undo steps back through the toolbar's changes.
  await button('Undo').click();
  await expect(field).toHaveValue(/Thanks for \*\*\*writing\*\*\*\./);
  await button('Redo').click();
  await expect(field).toHaveValue(/Thanks for \*writing\*\./);

  // Lists and quotes start each selected line, change kind, and come off.
  await select(field, '- look into it\n- reply within a day');
  await button('Numbered List').click();
  await expect(field).toHaveValue(/1\. look into it\n2\. reply within a day$/);
  await button('Numbered List').click();
  await expect(field).toHaveValue(/\nlook into it\nreply within a day$/);
  await button('Quote').click();
  await expect(field).toHaveValue(/\n> look into it\n> reply within a day$/);
  await button('Remove Formatting').click();
  await expect(field).toHaveValue(/\nlook into it\nreply within a day$/);

  // A link on the selection, its address edited in place, then removed.
  await select(field, 'Thanks');
  await button('Link').click();
  const popover = page.getByRole('dialog', { name: 'Link Address' });
  await popover.getByRole('textbox', { name: 'Link Address' }).fill('https://forma.example');
  await popover.getByRole('button', { name: 'Apply' }).click();
  await expect(field).toHaveValue(/\[Thanks\]\(https:\/\/forma\.example\) for/);
  await select(field, 'Thanks');
  await button('Link').click();
  await expect(popover.getByRole('textbox', { name: 'Link Address' })).toHaveValue('https://forma.example');
  await popover.getByRole('button', { name: 'Remove Link' }).click();
  await expect(field).toHaveValue(/\n\nThanks for \*writing\*/);
  // An image by address, at the caret.
  await caretAt(field, -1);
  await button('Image').click();
  const image = page.getByRole('dialog', { name: 'Image Address' });
  await image.getByRole('textbox', { name: 'Image Address' }).fill('https://forma.example/logo.png');
  await image.getByRole('button', { name: 'Insert' }).click();
  await expect(field).toHaveValue(/!\[\]\(https:\/\/forma\.example\/logo\.png\)$/);
  // The shortcuts the rich editor has.
  await select(field, 'Hi');
  await page.keyboard.press('ControlOrMeta+b');
  await expect(field).toHaveValue(/^\*\*Hi\*\* /);
});

test('Enter continues a list, ends it on an empty item, and Insert Variable lands as written', async ({ page }) => {
  const { root, field } = markdownEditor(page);
  await caretAt(field, -1);
  await page.keyboard.press('Enter');
  await page.keyboard.type('follow up');
  await expect(field).toHaveValue(/- reply within a day\n- follow up$/);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(field).toHaveValue(/- follow up\n$/);
  await page.keyboard.type('Best, ');
  // A content request's Markdown is inserted as it is, at the caret: placeholders stay literal.
  await root.getByRole('button', { name: 'Insert Variable' }).click();
  await page.getByRole('menuitem', { name: 'Customer First Name' }).click();
  await expect(field).toHaveValue(/- follow up\nBest, \{%customer\.first_name%\}$/);
  // Replacing it all doesn't take focus; HTML alone arrives as Markdown.
  await page.getByRole('button', { name: 'Set Signature Externally' }).focus();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-set', { detail: { target: 'reply', html: '<p>Hello <strong>there</strong></p>' } }),
    ),
  );
  await expect(field).toHaveValue('Hello **there**');
  await expect(page.getByRole('button', { name: 'Set Signature Externally' })).toBeFocused();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-set', { detail: { target: 'reply', html: '<p>x</p>', markdown: '_As is_' } }),
    ),
  );
  await expect(field).toHaveValue('_As is_');
});

test('pasted formatting arrives as Markdown the field allows, and pasted images go to the upload hook', async ({
  page,
  browserName,
}) => {
  test.skip(browserName === 'firefox', 'Firefox drops the data of a paste event made by a script.');
  const field = await addEditor(page, { formats: ['bold', 'italic', 'link', 'bulletList'] });
  await paste(field, {
    html: '<h1>Title</h1><p>Hello <strong>bold</strong>, <em>it</em> and <a href="https://x.test/a_b">a link</a> for {%customer.first_name%}</p><ul><li>one</li><li>two</li></ul><p><code>code</code> and 5*3</p>',
    text: 'Title Hello bold',
  });
  // Headings and code aren't this field's formats, so their text arrives plain.
  await expect(field).toHaveValue(
    'Title\n\nHello **bold**, *it* and [a link](https://x.test/a_b) for {%customer.first_name%}\n\n- one\n- two\n\ncode and 5\\*3',
  );
  // Plain pasting keeps the browser's own paste: nothing is converted.
  await field.fill('');
  await field.evaluate(element => (element.closest('.f-editor').dataset.fruitPaste = 'plain'));
  await paste(field, { html: '<p><strong>bold</strong></p>', text: 'bold' });
  await expect(field).toHaveValue('');
  // An image is the application's to upload; it inserts the Markdown when it has an address.
  await field.evaluate(element => (element.closest('.f-editor').dataset.fruitPaste = 'rich'));
  const images = await addEditor(page, { id: 'images', formats: ['bold', 'image'] });
  await page.evaluate(() =>
    document.addEventListener('fruit-editor-upload', event => {
      event.preventDefault();
      window.uploaded = event.detail.files.map(file => file.name);
      event.detail.insert('https://cdn.forma.example/logo.png', 'Logo');
    }),
  );
  await paste(images, { files: [['logo.png', 'image/png']] });
  await expect(images).toHaveValue('![Logo](https://cdn.forma.example/logo.png)');
  expect(await page.evaluate(() => window.uploaded)).toEqual(['logo.png']);
});

test('in a chat field Enter sends, except in a list, and a read-only field offers no commands', async ({ page }) => {
  const field = await addEditor(page, { formats: ['bold', 'bulletList'], inline: true, enter: 'submit' });
  await field.click();
  await page.keyboard.type('- one');
  await page.keyboard.press('Enter');
  await expect(field).toHaveValue('- one\n- ');
  await page.keyboard.press('Enter');
  await expect(field).toHaveValue('- one\n');
  await page.keyboard.type('Thanks');
  await page.keyboard.press('Enter');
  await expect(page.locator('#runtime-form')).toHaveAttribute('data-sent', '- one\nThanks');
  // Shift+Enter breaks the line.
  await page.keyboard.press('Shift+Enter');
  await expect(field).toHaveValue('- one\nThanks\n');
  await field.evaluate(element => element.setAttribute('readonly', ''));
  await expect(page.locator('#runtime-form [data-fruit-command="bold"]')).toBeDisabled();
});

for (const colorScheme of ['light', 'dark']) {
  test(`a Markdown editor is accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const { root, field } = markdownEditor(page);
    await field.focus();
    await expectAccessible(page, '#editor-markdown-example');
    await root.getByRole('button', { name: 'Link', exact: true }).click();
    await expectAccessible(page, '#editor-markdown-example');
  });
}
