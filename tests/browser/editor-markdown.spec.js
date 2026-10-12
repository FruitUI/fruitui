import { test, expect } from '@playwright/test';
import { expectAccessible, selectMarkdown, tokenColor } from './helpers.js';

// The Editor in Markdown mode: the Markdown as written, its syntax styled (#editor-markdown-example).
const markdownEditor = page => {
  const root = page.locator('#editor-markdown-example');
  return {
    root,
    field: root.getByRole('textbox', { name: 'Reply Template' }),
    control: root.locator('textarea[name="reply"]'),
  };
};
const select = (field, text, { from = 0 } = {}) => selectMarkdown(field, { text, from });
const caretAt = (field, at) => selectMarkdown(field, { at });

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
  const control = page.locator(`#${id}-editor`);
  const field = page.locator(`#${id}-form`).getByRole('textbox', { name: 'Message' });
  // Alpine starts the editor as it's added.
  await expect(field).toBeVisible();
  return { field, control };
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

test('the field shows the Markdown as written, its syntax dimmed and its effect on the text', async ({ page }) => {
  const { field, control } = markdownEditor(page);
  await expect(control).toBeHidden();
  await expect(field).toHaveAccessibleDescription(/Markdown, as you write it/);
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-set', {
        detail: {
          target: 'reply',
          markdown:
            '# Welcome\nThanks for **writing**, *really*. See [the guide](https://forma.example/guide) or https://forma.example.\n> We reply within a day.\n- [ ] `code`\n\\*not italic\\*',
        },
      }),
    ),
  );
  // The value is the Markdown, as written: the syntax stays in the text.
  await expect(control).toHaveValue(/^# Welcome\nThanks for \*\*writing\*\*,/);
  await expect(field).toContainText('Thanks for **writing**, *really*.');
  const style = (locator, property) =>
    locator.evaluate((element, property) => getComputedStyle(element)[property], property);
  const secondary = await tokenColor(page, '--f-secondary');
  const syntax = field.locator('.f-editor__syntax');
  await expect(syntax).toHaveText([
    '#',
    '**',
    '**',
    '*',
    '*',
    '[',
    ']',
    '(',
    ')',
    '>',
    '-',
    '[ ]',
    '`',
    '`',
    '\\',
    '\\',
  ]);
  for (const marker of await syntax.all()) expect(await style(marker, 'color')).toBe(secondary);
  // Bold text is bold, italic italic, a heading larger; the markers keep the text's weight.
  const strong = field.locator('.f-editor__strong:not(.f-editor__syntax)');
  await expect(strong).toHaveText('writing');
  expect(Number(await style(strong, 'fontWeight'))).toBeGreaterThanOrEqual(700);
  expect(await style(syntax.nth(1), 'fontWeight')).toBe('400');
  expect(await style(field.locator('.f-editor__emphasis:not(.f-editor__syntax)'), 'fontStyle')).toBe('italic');
  const heading = field.locator('.f-editor__line--h1');
  await expect(heading).toHaveText('# Welcome');
  expect(parseFloat(await style(heading, 'fontSize'))).toBeGreaterThan(parseFloat(await style(field, 'fontSize')));
  // A link's text has the link color and its address is dimmed; a bare address is a link too.
  const accent = await tokenColor(page, '--f-accent-text');
  const links = field.locator('.f-editor__link:not(.f-editor__syntax, .f-editor__url)');
  await expect(links).toHaveText(['the guide', 'https://forma.example']);
  for (const link of await links.all()) expect(await style(link, 'color')).toBe(accent);
  await expect(field.locator('.f-editor__url')).toHaveText('https://forma.example/guide');
  expect(await style(field.locator('.f-editor__url'), 'color')).toBe(secondary);
  await expect(field.locator('.f-editor__url')).toHaveAttribute('spellcheck', 'false');
  // A quote sits on a bar; code is monospaced. Escaped syntax stays text.
  expect(await style(field.locator('.f-editor__line--quote'), 'borderInlineStartWidth')).toBe('3px');
  expect(await style(field.locator('.f-editor__code').first(), 'fontFamily')).toMatch(/monospace/);
  await expect(field.locator('.f-editor__line').last()).toHaveText('\\*not italic\\*');
  await expect(field.locator('.f-editor__line').last().locator('.f-editor__emphasis')).toHaveCount(0);
  // Unfinished syntax isn't styled.
  await field.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('**unfinished');
  await expect(control).toHaveValue('**unfinished');
  await expect(field.locator('.f-editor__strong')).toHaveCount(0);
});

test('the toolbar writes Markdown around the selection, and its buttons say what the selection has', async ({
  page,
}) => {
  const { root, field, control } = markdownEditor(page);
  await expect(control).toHaveValue(
    "Hi {%customer.first_name%},\n\nThanks for **writing**. We'll:\n- look into it\n- reply within a day",
  );
  const button = name => root.getByRole('button', { name, exact: true });
  await caretAt(field, 0);
  for (const name of ['Bold', 'Italic', 'Bullets', 'Numbered List', 'Quote'])
    await expect(button(name)).toHaveAttribute('aria-pressed', 'false');

  // Bold comes off text that has it, and goes back on; italic adds a star inside it.
  await select(field, 'writing');
  await expect(button('Bold')).toHaveAttribute('aria-pressed', 'true');
  await button('Bold').click();
  await expect(control).toHaveValue(/Thanks for writing\./);
  await expect(button('Bold')).toHaveAttribute('aria-pressed', 'false');
  await button('Bold').click();
  await expect(control).toHaveValue(/Thanks for \*\*writing\*\*\./);
  await button('Italic').click();
  await expect(control).toHaveValue(/Thanks for \*\*\*writing\*\*\*\./);
  await expect(button('Italic')).toHaveAttribute('aria-pressed', 'true');
  await button('Bold').click();
  await expect(control).toHaveValue(/Thanks for \*writing\*\./);
  // Undo steps back through the toolbar's changes one at a time.
  await button('Undo').click();
  await expect(control).toHaveValue(/Thanks for \*\*\*writing\*\*\*\./);
  await button('Redo').click();
  await expect(control).toHaveValue(/Thanks for \*writing\*\./);
  // A selection with spaces at its ends is wrapped inside them.
  await select(field, ' look ');
  await button('Bold').click();
  await expect(control).toHaveValue(/- \*\*look\*\* into it/);
  await button('Bold').click();

  // Lists and quotes start each selected line, change kind, and come off.
  await select(field, '- look into it\n- reply within a day');
  await expect(button('Bullets')).toHaveAttribute('aria-pressed', 'true');
  await button('Numbered List').click();
  await expect(control).toHaveValue(/1\. look into it\n2\. reply within a day$/);
  await expect(button('Numbered List')).toHaveAttribute('aria-pressed', 'true');
  await button('Numbered List').click();
  await expect(control).toHaveValue(/\nlook into it\nreply within a day$/);
  await button('Quote').click();
  await expect(control).toHaveValue(/\n> look into it\n> reply within a day$/);
  await button('Remove Formatting').click();
  await expect(control).toHaveValue(/\nlook into it\nreply within a day$/);
  // Remove Formatting takes off the formatting the selection touches.
  await select(field, 'writing');
  await button('Remove Formatting').click();
  await expect(control).toHaveValue(/Thanks for writing\./);

  // A link on the selection, its address edited in place, then removed.
  await select(field, 'Thanks');
  await button('Link').click();
  const popover = page.getByRole('dialog', { name: 'Link Address' });
  await popover.getByRole('textbox', { name: 'Link Address' }).fill('https://forma.example');
  await popover.getByRole('button', { name: 'Apply' }).click();
  await expect(control).toHaveValue(/\[Thanks\]\(https:\/\/forma\.example\) for/);
  await select(field, 'Thanks');
  await button('Link').click();
  await expect(popover.getByRole('textbox', { name: 'Link Address' })).toHaveValue('https://forma.example');
  await popover.getByRole('textbox', { name: 'Link Address' }).fill('https://forma.example/help');
  await popover.getByRole('button', { name: 'Apply' }).click();
  await expect(control).toHaveValue(/\[Thanks\]\(https:\/\/forma\.example\/help\) for/);
  await select(field, 'Thanks');
  await button('Link').click();
  await popover.getByRole('button', { name: 'Remove Link' }).click();
  await expect(control).toHaveValue(/\n\nThanks for writing/);
  // An image by address, at the caret.
  await caretAt(field, -1);
  await button('Image').click();
  const image = page.getByRole('dialog', { name: 'Image Address' });
  await image.getByRole('textbox', { name: 'Image Address' }).fill('https://forma.example/logo.png');
  await image.getByRole('button', { name: 'Insert' }).click();
  await expect(control).toHaveValue(/!\[\]\(https:\/\/forma\.example\/logo\.png\)$/);
  // The shortcuts the rich editor has.
  await select(field, 'Hi');
  await page.keyboard.press('ControlOrMeta+b');
  await expect(control).toHaveValue(/^\*\*Hi\*\* /);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(control).toHaveValue(/^Hi /);
});

test('Enter continues a list, ends it on an empty item, and Insert Variable lands as written', async ({ page }) => {
  const { root, field, control } = markdownEditor(page);
  await caretAt(field, -1);
  await page.keyboard.press('Enter');
  await page.keyboard.type('follow up');
  await expect(control).toHaveValue(/- reply within a day\n- follow up$/);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(control).toHaveValue(/- follow up\n$/);
  await page.keyboard.type('Best, ');
  // A content request's Markdown is inserted as it is, at the caret: placeholders stay literal.
  await root.getByRole('button', { name: 'Insert Variable' }).click();
  await page.getByRole('menuitem', { name: 'Customer First Name' }).click();
  await expect(control).toHaveValue(/- follow up\nBest, \{%customer\.first_name%\}$/);
  // Shift+Enter breaks the line without continuing the list, and Enter before an item's marker
  // makes room above it.
  await select(field, 'look into it');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('today');
  await expect(control).toHaveValue(/- look into it\ntoday\n- reply/);
  await caretAt(field, (await control.inputValue()).indexOf('- reply'));
  await page.keyboard.press('Enter');
  await expect(control).toHaveValue(/today\n\n- reply/);
  // A task continues as an open task.
  await caretAt(field, -1);
  await page.keyboard.type('\n- [x] Done');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Next');
  await expect(control).toHaveValue(/- \[x\] Done\n- \[ \] Next$/);
  // Replacing it all doesn't take focus; HTML alone arrives as Markdown.
  await page.getByRole('button', { name: 'Set Signature Externally' }).focus();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-set', { detail: { target: 'reply', html: '<p>Hello <strong>there</strong></p>' } }),
    ),
  );
  await expect(control).toHaveValue('Hello **there**');
  await expect(field.locator('.f-editor__strong:not(.f-editor__syntax)')).toHaveText('there');
  await expect(page.getByRole('button', { name: 'Set Signature Externally' })).toBeFocused();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-set', { detail: { target: 'reply', html: '<p>x</p>', markdown: '_As is_' } }),
    ),
  );
  await expect(control).toHaveValue('_As is_');
  // The model and a form reset reach the field.
  await control.evaluate(element => {
    element.value = '- from the server';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(field.locator('.f-editor__syntax')).toHaveText('-');
});

test('pasted formatting arrives as Markdown the field allows, and pasted images go to the upload hook', async ({
  page,
  browserName,
}) => {
  test.skip(browserName === 'firefox', 'Firefox drops the data of a paste event made by a script.');
  const { field, control } = await addEditor(page, { formats: ['bold', 'italic', 'link', 'bulletList'] });
  await paste(field, {
    html: '<h1>Title</h1><p>Hello <strong>bold</strong>, <em>it</em> and <a href="https://x.test/a_b">a link</a> for {%customer.first_name%}</p><ul><li>one</li><li>two</li></ul><p><code>code</code> and 5*3</p>',
    text: 'Title Hello bold',
  });
  // Headings and code aren't this field's formats, so their text arrives plain.
  await expect(control).toHaveValue(
    'Title\n\nHello **bold**, *it* and [a link](https://x.test/a_b) for {%customer.first_name%}\n\n- one\n- two\n\ncode and 5\\*3',
  );
  // Markdown copied from this field, or from a code editor, arrives as written.
  await page.keyboard.press('ControlOrMeta+a');
  await paste(field, {
    html: '<p class="f-editor__line" data-pm-slice="1 1 []">**bold** and *it*</p><p class="f-editor__line">- one</p>',
    text: '**bold** and *it*\n- one',
  });
  await expect(control).toHaveValue('**bold** and *it*\n- one');
  await page.keyboard.press('ControlOrMeta+a');
  await paste(field, {
    html: '<div style="white-space: pre;"><div><span style="font-weight: bold;">**bold**</span> text</div></div>',
    text: '**bold** text',
  });
  await expect(control).toHaveValue('**bold** text');
  // Plain pasting takes the text as it is.
  await page.keyboard.press('ControlOrMeta+a');
  await field.evaluate(element => (element.closest('.f-editor').dataset.fruitPaste = 'plain'));
  await paste(field, { html: '<p><strong>bold</strong></p>', text: 'bold' });
  await expect(control).toHaveValue('bold');
  // An image is the application's to upload; it inserts the Markdown when it has an address.
  const images = await addEditor(page, { id: 'images', formats: ['bold', 'image'] });
  await page.evaluate(() =>
    document.addEventListener('fruit-editor-upload', event => {
      event.preventDefault();
      window.uploaded = event.detail.files.map(file => file.name);
      event.detail.insert('https://cdn.forma.example/logo.png', 'Logo');
    }),
  );
  await paste(images.field, { files: [['logo.png', 'image/png']] });
  await expect(images.control).toHaveValue('![Logo](https://cdn.forma.example/logo.png)');
  expect(await page.evaluate(() => window.uploaded)).toEqual(['logo.png']);
});

test('in a chat field Enter sends, except in a list, and a read-only field offers no commands', async ({ page }) => {
  const { field, control } = await addEditor(page, { formats: ['bold', 'bulletList'], inline: true, enter: 'submit' });
  await field.click();
  await page.keyboard.type('- one');
  await page.keyboard.press('Enter');
  await expect(control).toHaveValue('- one\n- ');
  await page.keyboard.press('Enter');
  await expect(control).toHaveValue('- one\n');
  await page.keyboard.type('Thanks');
  await page.keyboard.press('Enter');
  await expect(page.locator('#runtime-form')).toHaveAttribute('data-sent', '- one\nThanks');
  // Shift+Enter breaks the line.
  await page.keyboard.press('Shift+Enter');
  await expect(control).toHaveValue('- one\nThanks\n');
  await control.evaluate(element => element.setAttribute('readonly', ''));
  await expect(page.locator('#runtime-form [data-fruit-command="bold"]')).toBeDisabled();
  await expect(field).toHaveAttribute('aria-readonly', 'true');
  await expect(field).toHaveAttribute('contenteditable', 'false');
});

for (const colorScheme of ['light', 'dark']) {
  test(`a Markdown editor is accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const { root, field } = markdownEditor(page);
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent('fruit-editor-set', {
          detail: {
            target: 'reply',
            markdown:
              '# Title\nHi **there**, *see* [the guide](https://forma.example) ~~old~~\n> quoted `code`\n```\nblock\n```',
          },
        }),
      ),
    );
    await field.focus();
    await expectAccessible(page, '#editor-markdown-example');
    await select(field, 'there');
    await root.getByRole('button', { name: 'Link', exact: true }).click();
    await expectAccessible(page, '#editor-markdown-example');
  });
}
