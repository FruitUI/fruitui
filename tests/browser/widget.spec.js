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

test('beside the launcher, an answer’s start opens the chat, or is dismissed with the badge staying', async ({
  page,
}) => {
  const card = site(page).locator('.preview');
  await open(page);
  await send(page, 'Do you offer annual billing?');
  await page.keyboard.press('Escape');
  // Who wrote and how it starts, in the window's words; read out once.
  await expect(card).toBeVisible();
  await expect(card.locator('.preview-author')).toHaveText('Alex Morgan');
  await expect(card.locator('.preview-text')).toContainText('Alex here. Thanks for your message');
  await expect(site(page).getByRole('status')).toHaveText(/^Alex Morgan: Hi, Alex here\./);
  // Dismissed, the badge stays and the keyboard returns to the launcher.
  await site(page).getByRole('button', { name: 'Dismiss' }).click();
  await expect(card).toBeHidden();
  await expect(site(page).locator('.badge')).toHaveText('1');
  await expect(toggle(page)).toBeFocused();
  // A new answer shows it again; the card opens the chat, where typing starts.
  await open(page);
  await send(page, 'And for teams?');
  await page.keyboard.press('Escape');
  await expect(card.locator('.preview-text')).toContainText('Thanks, that helps.');
  await card.locator('.preview-open').click();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(card).toBeHidden();
  await expect(message(page)).toBeFocused();
});

/** The website's tab in the background, or back, as switching tabs does. */
async function background(frame, hidden) {
  await frame.evaluate(state => {
    Object.defineProperty(document, 'hidden', { value: state, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: state ? 'hidden' : 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}
const frameOf = (page, path) => page.frames().find(frame => frame.url().includes(path));

test('while the website’s tab is in the background, its title says an answer arrived, until the visitor returns', async ({
  page,
}) => {
  await open(page);
  await send(page, 'Do you offer annual billing?');
  await page.keyboard.press('Escape');
  const website = frameOf(page, '/examples/widget/site.html');
  const own = await website.evaluate(() => document.title);
  await background(website, true);
  await background(frameOf(page, '/widget/chat.html'), true);
  // It alternates with the website's own title.
  await expect.poll(() => website.evaluate(() => document.title)).toBe('(1) Alex replied');
  await expect.poll(() => website.evaluate(() => document.title)).toBe(own);
  await background(website, false);
  await expect.poll(() => website.evaluate(() => document.title)).toBe(own);
  await page.waitForTimeout(1700);
  expect(await website.evaluate(() => document.title)).toBe(own);
  // A page in view keeps its title: the badge and the card say it there.
  await open(page);
  await send(page, 'And for teams?');
  await page.keyboard.press('Escape');
  await expect(site(page).locator('.badge')).toHaveText('1');
  expect(await website.evaluate(() => document.title)).toBe(own);
});

test('an answer the visitor may not see chimes once, unless they muted it in the window’s header', async ({ page }) => {
  await open(page);
  const window = frameOf(page, '/widget/chat.html');
  // Each note of the chime is a tone.
  await window.evaluate(() => {
    window.notes = 0;
    const tone = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      window.notes++;
      return tone.call(this);
    };
  });
  const notes = () => window.evaluate(() => window.notes);
  // In view, an answer is only read out.
  await send(page, 'Do you offer annual billing?');
  await expect(chat(page).locator('.widget-entry[data-kind="team"]').last()).toContainText('Alex here.');
  expect(await notes()).toBe(0);
  // Closed, it chimes: two soft notes.
  await send(page, 'And for teams?');
  await page.keyboard.press('Escape');
  await expect(site(page).locator('.badge')).toHaveText('1');
  expect(await notes()).toBe(2);
  // Muted in the header, kept in this browser; the next answer is silent.
  await open(page);
  const sound = chat(page).getByRole('button', { name: 'Sound' });
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await expect(sound).toHaveAttribute('title', 'Sound Off');
  expect(await window.evaluate(() => localStorage.getItem('fruitui-widget-sound'))).toBe('off');
  await send(page, 'Thanks');
  await page.keyboard.press('Escape');
  await expect(site(page).locator('.badge')).toHaveText('1');
  expect(await notes()).toBe(2);
  // Turned on again, it plays once so the visitor hears it.
  await open(page);
  await sound.click();
  expect(await notes()).toBe(4);
  // A website can start it off; the visitor's own choice wins.
  await page.goto('/widget/chat.html?sound=off');
  await page.evaluate(() => localStorage.removeItem('fruitui-widget-sound'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'false');
});

test('web addresses in messages are links that open in a new tab, in either bubble', async ({ page }) => {
  await open(page);
  await send(page, 'Is it on www.example.com/plans? <b>Yes</b> javascript:alert(1)');
  const mine = chat(page).locator('.widget-entry[data-kind="visitor"]').filter({ hasText: 'www.example.com/plans' });
  const link = mine.getByRole('link', { name: 'www.example.com/plans' });
  await expect(link).toHaveAttribute('href', 'https://www.example.com/plans');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  // Markup and other kinds of addresses stay text.
  await expect(mine.locator('.widget-bubble')).toContainText('<b>Yes</b> javascript:alert(1)');
  await expect(mine.locator('.widget-bubble b')).toHaveCount(0);
  await expect(mine.getByRole('link')).toHaveCount(1);
  // The team's next answer links its guide, without the full stop after it.
  await expect(chat(page).locator('.widget-entry[data-kind="team"]').last()).toContainText('Alex here.');
  await send(page, 'And for teams?');
  const theirs = chat(page).locator('.widget-entry[data-kind="team"]').last();
  const guide = theirs.getByRole('link', { name: 'https://forma.example/help/billing' });
  await expect(guide).toHaveAttribute('href', 'https://forma.example/help/billing');
  await expect(theirs.locator('.widget-bubble')).toContainText('billing.');
  // Underlined in both; the team's in the link colour, the visitor's in its accent bubble's own colour.
  const look = locator =>
    locator.evaluate(element => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--f-accent-text)';
      document.body.append(probe);
      const accentText = getComputedStyle(probe).color;
      probe.remove();
      const style = getComputedStyle(element);
      return {
        color: style.color,
        bubble: getComputedStyle(element.closest('.widget-bubble')).color,
        accentText,
        underline: style.textDecorationLine,
      };
    });
  const visitorLink = await look(link);
  expect(visitorLink.color).toBe(visitorLink.bubble);
  expect(visitorLink.underline).toBe('underline');
  const teamLink = await look(guide);
  expect(teamLink.color).toBe(teamLink.accentText);
  expect(teamLink.color).not.toBe(teamLink.bubble);
  expect(teamLink.underline).toBe('underline');
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
    // An answer's start beside the launcher.
    await chat(page).getByRole('textbox', { name: 'Message' }).fill('One more thing: www.example.com/plans');
    await chat(page).getByRole('textbox', { name: 'Message' }).press('Enter');
    await page.keyboard.press('Escape');
    await expect(site(page).locator('.preview')).toBeVisible();
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
