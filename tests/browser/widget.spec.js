import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { expectAccessible, expectNoOverflow } from './helpers.js';

// The Widget example (widget.html): an example website (examples/widget/site.html) whose script
// (public/widget/t.js) shows a launcher and the chat window (widget/chat.html) in a frame.
const site = page => page.frameLocator('.widget-browser-page');
const launcher = page => site(page).getByRole('button', { name: /^Chat with Forma/ });
// The launcher whether or not it shows: a phone hides it while the window is open.
const toggle = page => site(page).locator('button.launcher');
const chat = page => site(page).frameLocator('iframe');
const message = page => chat(page).getByRole('textbox', { name: 'Message' });
const entries = page => chat(page).locator('.widget-entry');

async function open(page) {
  await launcher(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
}

async function send(page, text) {
  await message(page).fill(text);
  await message(page).press('Enter');
  await expect(chat(page).locator('.widget-entry[data-kind="visitor"]').last()).toContainText(text);
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/widget.html');
});
test.afterEach(() => expect(errors).toEqual([]));

test('Widget is linked beside the examples, and the launcher appears once the chat window is ready', async ({
  page,
}) => {
  for (const path of ['/', '/support.html', '/chat.html', '/admin.html', '/settings.html', '/components.html']) {
    await page.goto(path);
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Widget', exact: true }),
    ).toHaveAttribute('href', '/widget.html');
  }
  await page.goto('/widget.html');
  await expect(launcher(page)).toBeVisible();
  await expect(launcher(page)).toHaveAttribute('aria-expanded', 'false');
  expect(await page.frame({ url: /site\.html/ }).evaluate(() => window.tallport.available)).toBe(true);
  // The window loads hidden, so the launcher opens it at once; the launcher takes its accent.
  const fill = await chat(page)
    .locator('.f-composer__send')
    .evaluate(button => getComputedStyle(button).backgroundColor);
  await expect(launcher(page)).toHaveCSS('background-color', fill);
  await expect(site(page).locator('iframe')).toHaveAttribute('title', 'Chat with Forma');
  await expect(site(page).locator('iframe')).toHaveAttribute(
    'src',
    /^http:\/\/127\.0\.0\.1:5173\/widget\/chat\.html\?/,
  );
});

test('the launcher opens the window with the message box focused, and Escape returns to the launcher', async ({
  page,
}) => {
  const window = site(page).locator('.window');
  await expect(window).toHaveCSS('visibility', 'hidden');
  await open(page);
  await expect(window).toHaveCSS('visibility', 'visible');
  await expect(message(page)).toBeFocused();
  await expect(entries(page)).toHaveCount(1);
  await expect(entries(page)).toContainText('Ask us anything');
  await page.keyboard.press('Escape');
  await expect(launcher(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(launcher(page)).toBeFocused();
  await expect(window).toHaveCSS('visibility', 'hidden');
  // The launcher toggles too, and its own Escape closes the window.
  await open(page);
  await launcher(page).focus();
  await page.keyboard.press('Escape');
  await expect(launcher(page)).toHaveAttribute('aria-expanded', 'false');
  await open(page);
  await chat(page).getByRole('button', { name: 'Close Chat' }).click();
  await expect(launcher(page)).toBeFocused();
});

test('a visitor sends a message, gets an answer, and confirms an email address with a code', async ({ page }) => {
  await open(page);
  await message(page).fill('Hi! Can we pay for the Team plan annually?\nAnd keep our projects?');
  await message(page).press('Enter');
  const mine = chat(page).locator('.widget-entry[data-kind="visitor"]');
  await expect(mine).toHaveCount(1);
  await expect(mine.locator('.widget-bubble')).toHaveText(
    'Hi! Can we pay for the Team plan annually?\nAnd keep our projects?',
  );
  await expect(message(page)).toHaveValue('');
  // Alex answers, and the answer is announced.
  const answer = chat(page).locator('.widget-entry[data-kind="team"]').last();
  await expect(answer).toContainText('Alex here.');
  await expect(answer.locator('.widget-author')).toHaveText('Alex Morgan');
  await expect(chat(page).locator('p[role="status"]').last()).toHaveText(/^Alex Morgan: Hi, Alex here/);
  // The email offer follows the first message; nothing is emailed until a code confirms the address.
  const card = chat(page).getByRole('region', { name: 'Get the reply by email' });
  await expect(card).toBeVisible();
  const email = card.getByRole('textbox', { name: 'Email' });
  await email.fill('lena@');
  await card.getByRole('button', { name: 'Send Code' }).click();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(card.locator('.f-error')).toHaveText('Enter an email address, like name@example.com.');
  await expect(email).toBeFocused();
  await email.fill('lena@example.com');
  await card.getByRole('button', { name: 'Send Code' }).click();
  const code = card.getByRole('textbox', { name: 'Code' });
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  await expect(card).toContainText('Enter the code we sent to lena@example.com.');
  // Change Address goes back with the address kept; Send Again runs out after three codes.
  await card.getByRole('button', { name: 'Change Address' }).click();
  await expect(email).toHaveValue('lena@example.com');
  await card.getByRole('button', { name: 'Send Code' }).click();
  await card.getByRole('button', { name: 'Send Again' }).click();
  await expect(card.getByRole('status')).toHaveText('We sent a new code.');
  await card.getByRole('button', { name: 'Send Again' }).click();
  await expect(card.getByRole('button', { name: 'Send Again' })).toBeDisabled();
  await code.fill('12345');
  await card.getByRole('button', { name: 'Confirm' }).click();
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await expect(card.locator('.f-error')).toHaveText('Enter the 6-digit code from the email.');
  await code.fill('123456');
  await card.getByRole('button', { name: 'Confirm' }).click();
  await expect(card).toHaveCount(0);
  await expect(chat(page).locator('.widget-event')).toHaveText('Replies also go to lena@example.com.');
  await expect(message(page)).toBeFocused();
  await expect(chat(page).locator('p[role="status"]').last()).toHaveText('Email confirmed.');
  // A second message gets no second offer.
  await send(page, 'Thank you!');
  await expect(chat(page).locator('.widget-email')).toHaveCount(0);
});

test('signing in continues Lena’s chat from the Support example, and signing out starts afresh', async ({ page }) => {
  await site(page).getByRole('button', { name: 'Sign In' }).click();
  await open(page);
  // Her chat as the team sees it in #1036, from her side: her messages, the team's replies, no notes.
  await expect(chat(page).locator('.widget-entry[data-kind="visitor"] .widget-bubble')).toHaveText([
    'Hi! Can we invite a client to one project without giving them access to everything?',
    'Oh nice. Can guests comment too?',
    'Perfect, I’ll give that a try with our next client project. Thank you!',
  ]);
  // Signed in with a name, the greeting uses it.
  await expect(chat(page).locator('.widget-entry[data-kind="team"] .widget-bubble')).toHaveText([
    'Hi Lena. Ask us anything, we’re happy to help.',
    'Hi Lena! Yes, invite them as a guest from the project’s Share menu.',
    'They’ll only see that project, and you can change their permissions at any time.',
    'They can comment and upload files. Editing stays with your team unless you allow it.',
  ]);
  await expect(chat(page).locator('.widget-messages')).not.toContainText('Help Center would help');
  // Alex's answer about the Share menu shows its screenshot as a thumbnail.
  const screenshot = chat(page).getByRole('link', { name: /share-menu\.png/ });
  await expect(screenshot).toHaveClass(/f-attachment--thumbnail/);
  await expect.poll(() => screenshot.locator('img').evaluate(img => img.naturalWidth)).toBe(640);
  await expect(chat(page).locator('.widget-event')).toHaveText('Replies also go to lena@example.com.');
  // A run of messages shows its time once, under the last.
  const run = chat(page).locator('.widget-entry[data-kind="team"]').filter({ hasText: 'They’ll only see' });
  await expect(run.locator('.widget-meta')).toHaveText('7:36 AM');
  await expect(
    chat(page).locator('.widget-entry[data-kind="team"]').filter({ hasText: 'Hi Lena!' }).locator('.widget-meta'),
  ).toBeHidden();
  // Signed in, the email is known: no offer after a new message.
  await send(page, 'One more thing: can guests upload files?');
  await expect(chat(page).locator('.widget-email')).toHaveCount(0);
  await site(page).getByRole('button', { name: 'Sign Out' }).click();
  await expect(entries(page)).toHaveCount(1);
  await expect(entries(page)).toContainText('Hi there. Ask us anything');
  await expect(site(page).getByRole('button', { name: 'Sign In' })).toBeFocused();
});

test('what a visitor wrote before signing in stays in the chat', async ({ page }) => {
  await open(page);
  await send(page, 'Is there a discount for nonprofits?');
  await expect(chat(page).locator('.widget-email')).toBeVisible();
  await site(page).getByRole('button', { name: 'Sign In' }).click();
  await expect(chat(page).locator('.widget-email')).toHaveCount(0);
  await expect(entries(page).first()).toContainText('Hi Lena. Ask us anything');
  await expect(chat(page).locator('.widget-entry[data-kind="visitor"] .widget-bubble')).toHaveText([
    'Is there a discount for nonprofits?',
  ]);
  await expect(chat(page).locator('.widget-event')).toHaveText('Replies also go to lena@example.com.');
});

test('an answer that arrives while the window is closed shows on the launcher until it opens', async ({ page }) => {
  await open(page);
  await send(page, 'Do you offer annual billing?');
  await page.keyboard.press('Escape');
  await expect(launcher(page)).toHaveAccessibleName('Chat with Forma, 1 unread');
  await expect(site(page).locator('.badge')).toHaveText('1');
  await open(page);
  await expect(launcher(page)).toHaveAccessibleName('Chat with Forma');
  await expect(site(page).locator('.badge')).toBeHidden();
  await expect(chat(page).locator('.widget-entry[data-kind="team"]').last()).toContainText('Alex here.');
});

test('offline, messages wait for the connection and send when it is back', async ({ page, context }) => {
  await open(page);
  await context.setOffline(true);
  const offline = chat(page).getByRole('status').filter({ hasText: 'You’re offline' });
  await expect(offline).toBeVisible();
  await send(page, 'Sent from the train');
  const waiting = chat(page).locator('.widget-entry[data-kind="visitor"]').last();
  await expect(waiting.locator('.widget-meta')).toContainText('Waiting to send');
  await context.setOffline(false);
  await expect(offline).toBeHidden();
  await expect(waiting.locator('.widget-meta')).not.toContainText('Waiting');
  await expect(chat(page).locator('.widget-entry[data-kind="team"]').last()).toContainText('Alex here.', {
    timeout: 6000,
  });
});

test('files attach to a message and can be removed before sending; images show as thumbnails', async ({ page }) => {
  await open(page);
  const input = chat(page).locator('input[type="file"]');
  await input.setInputFiles([
    { name: 'invoice-september.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(48 * 1024) },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Notes') },
    {
      name: 'sofa.png',
      mimeType: 'image/png',
      buffer: readFileSync(new URL('../../public/attachments/share-menu.png', import.meta.url)),
    },
  ]);
  const files = chat(page).getByRole('list', { name: 'Files to send' });
  await expect(files.getByRole('listitem')).toHaveText(['invoice-september.pdf', 'notes.txt', 'sofa.png']);
  await files.getByRole('button', { name: 'Remove notes.txt' }).click();
  await expect(message(page)).toBeFocused();
  await message(page).press('Enter');
  const sent = chat(page).locator('.widget-entry[data-kind="visitor"]').last();
  const attachment = sent.getByRole('link', { name: /invoice-september\.pdf/ });
  await expect(attachment).toHaveAttribute('download', 'invoice-september.pdf');
  await expect(attachment).toContainText('48 KB');
  // An image is a thumbnail that opens in a new tab.
  const image = sent.getByRole('link', { name: /sofa\.png/ });
  await expect(image).toHaveClass(/f-attachment--thumbnail/);
  await expect(image).toHaveAttribute('target', '_blank');
  await expect(image).not.toHaveAttribute('download');
  await expect.poll(() => image.locator('img').evaluate(img => img.naturalWidth)).toBe(640);
  await expect(sent.locator('.widget-bubble')).toBeHidden();
  await expect(files).toBeHidden();
  expect(
    await chat(page)
      .locator('body')
      .evaluate(body => body.scrollWidth <= innerWidth),
  ).toBe(true);
});

test('a phone gives the chat the whole screen, with its own Close button', async ({ page }) => {
  await page.getByRole('radio', { name: 'Phone', exact: true }).check();
  const frame = page.locator('.widget-browser-page');
  await expect.poll(async () => Math.round((await frame.boundingBox()).width)).toBe(388);
  await open(page);
  // Once it has grown in, the window covers the website's whole viewport.
  const viewport = await frame.boundingBox();
  const window = () => site(page).locator('.window').boundingBox();
  await expect.poll(async () => Math.round((await window()).width)).toBe(Math.round(viewport.width));
  await expect.poll(async () => Math.round((await window()).height)).toBe(Math.round(viewport.height));
  await expect(launcher(page)).toBeHidden();
  await expectNoOverflow(page);
  expect(
    await chat(page)
      .locator('body')
      .evaluate(body => body.scrollWidth <= innerWidth),
  ).toBe(true);
  await chat(page).getByRole('button', { name: 'Close Chat' }).click();
  await expect(launcher(page)).toBeVisible();
  await expect(launcher(page)).toBeFocused();
});

test('the website’s link opens the chat in the corner, or on its own page without the script', async ({ page }) => {
  const link = site(page).getByRole('link', { name: 'Chat with us' });
  await expect(link).toHaveAttribute('href', '/widget/chat.html?widget=forma-support');
  await link.click();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
  await page.goto('/widget/chat.html?widget=forma-support');
  await expect(page.getByRole('heading', { name: 'Forma', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close Chat' })).toBeHidden();
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello from the link');
  await page.getByRole('textbox', { name: 'Message' }).press('Enter');
  await expect(page.locator('.widget-entry[data-kind="visitor"] .widget-bubble')).toHaveText(['Hello from the link']);
  // Escape has no window to close here.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
});

test('on another origin with a strict CSP, queued commands wait for init and focus follows the visitor', async ({
  page,
}) => {
  // A website on another origin (another port) whose Content Security Policy allows no inline styles
  // or other frames; open and identify come before init in its queue. The test serves both sides, so
  // the browser treats them as two ordinary websites.
  const chat = 'http://127.0.0.1:5180';
  await page.route(`${chat}/**`, async route => {
    const url = new URL(route.request().url());
    url.port = '5173';
    await route.fulfill({ response: await route.fetch({ url: url.href }) });
  });
  await page.route('**/strict-website.html', route =>
    route.fulfill({
      contentType: 'text/html',
      headers: {
        'Content-Security-Policy': `default-src 'none'; script-src ${chat} 'nonce-forma'; frame-src ${chat}`,
      },
      body: `<!doctype html><html lang="en"><head><title>Strict</title>
        <script nonce="forma">
          window.tallport = window.tallport || function () { (tallport.q = tallport.q || []).push(arguments); };
          tallport('open');
          tallport('identify', 'signed-by-the-website');
          tallport('init', { widget: 'forma-support' });
        </script>
        <script src="${chat}/widget/t.js" async></script></head><body><main><h1>Strict</h1></main></body></html>`,
    }),
  );
  await page.goto('/strict-website.html');
  const button = page.getByRole('button', { name: /^Chat with Forma/ });
  const window = page.frameLocator('iframe');
  const message = window.getByRole('textbox', { name: 'Message' });
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveCSS('width', '56px');
  await expect(button).toHaveCSS('position', 'fixed');
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    `${chat}/widget/chat.html?widget=forma-support&origin=http%3A%2F%2F127.0.0.1%3A5173`,
  );
  await expect(window.locator('.widget-event')).toHaveText('Replies also go to lena@example.com.');
  // Opened by the website on load, the window leaves focus where it was.
  await expect(message).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  // Messages from anyone but the window are ignored.
  await page.evaluate(() => postMessage({ tallport: 1, type: 'close' }, '*'));
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await button.click();
  await expect(message).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
});

for (const appearance of ['light', 'dark']) {
  test(`the website, launcher and chat are accessible in automatic ${appearance} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: appearance });
    await page.goto('/widget.html');
    await expect(launcher(page)).toBeVisible();
    await expectAccessible(page);
    await open(page);
    await send(page, 'Can I pay annually?');
    await chat(page).getByRole('textbox', { name: 'Email' }).fill('lena@example.com');
    await chat(page).getByRole('button', { name: 'Send Code' }).click();
    await expect(chat(page).getByRole('textbox', { name: 'Code' })).toBeVisible();
    await chat(page).getByRole('button', { name: 'Confirm' }).click();
    await expect(chat(page).locator('.f-error')).toBeVisible();
    await expect(chat(page).locator('.widget-entry[data-kind="team"]').last()).toContainText('Alex here.');
    await expectAccessible(page);
    await site(page).getByRole('button', { name: 'Sign In' }).click();
    await expect(chat(page).locator('.widget-event')).toBeVisible();
    await expectAccessible(page);
  });
}

test('the page’s appearance carries into the website and the chat', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/widget.html');
  await expect(launcher(page)).toBeVisible();
  await page.getByRole('combobox', { name: 'Appearance' }).selectOption('dark');
  await expect(site(page).locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(chat(page).locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(chat(page).locator('body')).toHaveCSS('background-color', 'rgb(20, 20, 22)');
  await page.getByRole('combobox', { name: 'Appearance' }).selectOption('system');
  await expect(chat(page).locator('html')).toHaveAttribute('data-theme', 'system');
  await expect(chat(page).locator('body')).toHaveCSS('background-color', 'rgb(242, 242, 244)');
});

test('a window that takes no new chats leaves no launcher, and the website’s link opens its page', async ({ page }) => {
  // A stand-in window that is ready but over its limit for new chats, as Tallport's says.
  await page.route('**/widget/chat.html?*', route =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><meta charset="utf-8"><title>Chat with Forma</title><p>Chat isn’t available right now.</p><script>
        const origin = new URLSearchParams(location.search).get('origin');
        if (parent !== window) parent.postMessage({ tallport: 1, type: 'ready', label: 'Chat with Forma', available: false,
          fill: 'rgb(0, 99, 204)', fillHover: 'rgb(0, 84, 173)', canvas: 'rgb(255, 255, 255)', dark: false }, origin);
      </script></html>`,
    }),
  );
  await page.goto('/examples/widget/site.html');
  const toggle = page.locator('button.launcher');
  await expect.poll(() => page.evaluate(() => window.tallport.available)).toBe(false);
  await expect(toggle).toBeHidden();
  await page.evaluate(() => window.tallport('open'));
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.window')).toHaveCSS('visibility', 'hidden');
  await page.getByRole('link', { name: 'Chat with us' }).click();
  await expect(page).toHaveURL(/\/widget\/chat\.html\?widget=forma-support$/);
  await expect(page.getByText('Chat isn’t available right now.')).toBeVisible();
});
