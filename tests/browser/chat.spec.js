import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const messages = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  await page.goto('/chat.html');
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(5);
});
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]); });

test('Chat is linked beside the examples and unread activity follows real conversations', async ({ page }) => {
  const main = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(main.getByRole('link', { name: 'Chat', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(main.getByRole('link', { name: 'Support', exact: true })).toHaveAttribute('href', '/support.html');
  const unread = navigation(page).getByRole('button', { name: /^All unread/ });
  await expect(unread).toContainText('6');
  await unread.click();
  await expect(page.locator('.chat-result')).toHaveCount(6);
  await expect(page.locator('.chat-result').filter({ hasText: 'A fresh month' })).toHaveCount(0);
  await page.locator('.chat-result').filter({ hasText: 'Friday coffee' }).click();
  await expect(page.getByRole('heading', { name: '# general', exact: true })).toBeVisible();
  await expect(page.locator('.chat-message[data-message-id="103"]')).toBeFocused();
  await expect(unread).toContainText('4');
  await unread.click();
  await expect(page.locator('.chat-result')).toHaveCount(4);
  await page.getByRole('button', { name: 'Mark all read', exact: true }).click();
  await expect(page.locator('.chat-result')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'You’re all caught up.', exact: true })).toBeVisible();
  await expect(unread).toContainText('0');
});

test('conversation drafts stay independent and Enter sends while Shift Enter preserves new lines', async ({ page }) => {
  const composer = page.getByRole('textbox', { name: 'Message #design', exact: true });
  await composer.fill('A design draft.');
  await room(page, 'dm-sophie').click();
  const direct = page.getByRole('textbox', { name: 'Message Sophie Chen', exact: true });
  await expect(direct).toHaveValue('');
  await direct.fill('A private draft for Sophie.');
  await room(page, 'design').click();
  await expect(composer).toHaveValue('A design draft.');
  await composer.fill('First line.');
  await composer.press('Shift+Enter');
  await expect(composer).toHaveValue('First line.\n');
  await composer.evaluate(input => input.setSelectionRange(input.value.length, input.value.length));
  await composer.press('t');
  await expect(composer).toHaveValue('First line.\nt');
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(5);
  await composer.press('Enter');
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(6);
  await expect(page.locator('.chat-history .chat-message').last()).toContainText('First line.\nt');
  await expect(composer).toHaveValue('');
  await expect(composer).toBeFocused();
  await composer.fill('   ');
  await composer.press('Enter');
  await expect(page.locator('#chat-compose-error')).toHaveText('Write a message before sending.');
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(6);
  await room(page, 'dm-sophie').click();
  await expect(direct).toHaveValue('A private draft for Sophie.');
  await direct.press('Enter');
  await expect(page.locator('.chat-history .chat-message').last()).toContainText('A private draft for Sophie.');
  await room(page, 'design').click();
  await expect(page.locator('.chat-history')).not.toContainText('A private draft for Sophie.');
});

test('threads preserve their drafts and add replies without posting to the channel', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Message #design', exact: true }).fill('A channel draft.');
  const reply = page.getByRole('textbox', { name: 'Reply to thread', exact: true });
  await reply.fill('A reply draft for Sophie.');
  await threadButton(page, 201).click();
  await expect(reply).toHaveValue('');
  await reply.fill('A separate thread draft.');
  await page.getByRole('button', { name: 'Close thread', exact: true }).click();
  await expect(threadButton(page, 201)).toBeFocused();
  await threadButton(page, 202).click();
  await expect(reply).toHaveValue('A reply draft for Sophie.');
  await page.getByRole('button', { name: 'Send thread reply', exact: true }).click();
  await expect(page.locator('.chat-thread-reply')).toHaveCount(3);
  await expect(page.locator('.chat-thread-reply').last()).toContainText('A reply draft for Sophie.');
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(5);
  await expect(page.getByRole('textbox', { name: 'Message #design', exact: true })).toHaveValue('A channel draft.');
  await expect(threadButton(page, 202)).toContainText('3 replies');
  await page.getByRole('button', { name: 'Close thread', exact: true }).click();
  await navigation(page).getByRole('button', { name: /^Threads/ }).click();
  await expect(page.locator('.chat-result')).toHaveCount(3);
  await page.locator('.chat-result').filter({ hasText: 'mobile conversation view' }).click();
  await expect(page.locator('.chat-thread-reply')).toHaveCount(3);
  await threadButton(page, 201).click();
  await expect(reply).toHaveValue('A separate thread draft.');
  await reply.press('Enter');
  await expect(navigation(page).getByRole('button', { name: /^Threads/ })).toContainText('4');
});

test('workspace search finds channel messages, direct messages, and thread replies with their context', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search workspace' });
  await search.fill('second pair of eyes');
  await expect(page.locator('.chat-result')).toHaveCount(1);
  await expect(page.locator('.chat-result')).toContainText('Sophie Chen');
  await page.locator('.chat-result').click();
  await expect(page.getByRole('textbox', { name: 'Message Sophie Chen', exact: true })).toBeVisible();
  await expect(search).toHaveValue('');
  await search.fill('picking up right where');
  await expect(page.locator('.chat-result')).toHaveCount(1);
  await expect(page.locator('.chat-result')).toContainText('Thread reply');
  await page.locator('.chat-result').click();
  await expect(page.locator('.chat-thread')).toBeVisible();
  await expect(page.locator('.chat-thread-history')).toContainText('picking up right where');
  await search.fill('nothing-will-match');
  await expect(page.getByRole('heading', { name: 'No messages found', exact: true })).toBeVisible();
  await page.locator('.chat-empty').getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search).toBeFocused();
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(5);
});

test('reactions toggle per person, the picker supports Escape, and the attachment downloads', async ({ page }) => {
  const message = page.locator('.chat-message[data-message-id="202"]');
  const reaction = message.locator('.chat-reaction[data-emoji="👍"]');
  await expect(reaction).toContainText('2');
  await reaction.click();
  await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  await expect(reaction).toContainText('3');
  await reaction.click();
  await expect(reaction).toHaveAttribute('aria-pressed', 'false');
  await expect(reaction).toContainText('2');
  const picker = message.locator('summary');
  await picker.click();
  await message.getByRole('button', { name: 'React with ❤️', exact: true }).click();
  const heart = message.locator('.chat-reaction[data-emoji="❤️"]');
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await heart.click();
  await expect(heart).toHaveCount(0);
  await picker.click();
  await page.keyboard.press('Escape');
  await expect(message.locator('details')).not.toHaveAttribute('open', '');
  await expect(picker).toBeFocused();
  const download = page.waitForEvent('download');
  await message.getByRole('link', { name: /Interaction notes/ }).click();
  expect((await download).suggestedFilename()).toBe('interaction-notes.txt');
  await room(page, 'general').click();
  await room(page, 'design').click();
  await expect(reaction).toContainText('2');
});

test('channel creation validates names, rejects duplicates, and creates a conversation', async ({ page }) => {
  await page.getByRole('button', { name: 'Create channel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create channel' });
  const name = dialog.getByRole('textbox', { name: 'Channel name' });
  await expect(name).toBeFocused();
  await name.fill('Bad Name');
  await dialog.getByLabel('Description', { exact: true }).fill('Release plans.');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  expect(await name.evaluate(element => element.validity.patternMismatch)).toBe(true);
  await name.fill('design');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).toContainText('That channel already exists.');
  await name.fill('release-notes');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '# release-notes', exact: true })).toBeVisible();
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(0);
  const composer = page.getByRole('textbox', { name: 'Message #release-notes', exact: true });
  await composer.fill('Our first release is taking shape.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(1);
  await expect(page.locator('.chat-history')).toContainText('Our first release is taking shape.');
});

test('direct message creation opens an existing conversation without duplicating it', async ({ page }) => {
  await page.getByRole('button', { name: 'New direct message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New direct message' });
  await dialog.getByLabel('Recipient', { exact: true }).selectOption('oliver');
  await dialog.getByRole('button', { name: 'Open conversation', exact: true }).click();
  const composer = page.getByRole('textbox', { name: 'Message Oliver Park', exact: true });
  await expect(composer).toBeFocused();
  await composer.fill('Coffee at 11 sounds great.');
  await composer.press('Enter');
  await page.getByRole('button', { name: 'New direct message', exact: true }).click();
  await dialog.getByRole('button', { name: 'Open conversation', exact: true }).click();
  await expect(navigation(page).locator('[data-room-id="dm-oliver"]')).toHaveCount(1);
  await expect(page.locator('.chat-history .chat-message')).toHaveCount(1);
  await expect(page.locator('.chat-history')).toContainText('Coffee at 11 sounds great.');
  await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Oliver Park', exact: true });
  await expect(details).toContainText('2 members');
  await expect(details).toContainText('Away');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Conversation details', exact: true })).toBeFocused();
});

test('phone and tablet navigation preserve conversation and thread state with clear focus', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Message #design', exact: true }).fill('A draft across layouts.');
  await page.getByRole('textbox', { name: 'Reply to thread', exact: true }).fill('A thread draft across layouts.');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navigation(page)).not.toBeVisible();
  await expect(page.locator('.chat-thread')).not.toBeVisible();
  const trigger = threadButton(page, 202);
  await trigger.click();
  await expect(page.locator('#chat-thread-title')).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Reply to thread', exact: true })).toHaveValue('A thread draft across layouts.');
  await expect(page.locator('.chat-conversation')).not.toBeVisible();
  await page.getByRole('button', { name: 'Close thread', exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Message #design', exact: true })).toHaveValue('A draft across layouts.');
  await page.getByRole('button', { name: 'Show workspace', exact: true }).click();
  await expect(room(page, 'design')).toBeFocused();
  await room(page, 'dm-mia').click();
  await expect(page.getByRole('textbox', { name: 'Message Mia Patel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show workspace', exact: true }).click();
  await room(page, 'design').click();
  await page.setViewportSize({ width: 820, height: 1000 });
  await expect(navigation(page)).toBeVisible();
  await expect(page.locator('.chat-conversation')).toBeVisible();
  await trigger.click();
  await expect(page.locator('.chat-thread')).toBeVisible();
  await expect(page.locator('.chat-conversation')).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(page.locator('.chat-conversation')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Reply to thread', exact: true })).toHaveValue('A thread draft across layouts.');
});

test('all screens, dialogs, and long messages fit a 320px container', async ({ page }) => {
  await page.locator('.chat-container').evaluate(element => { element.style.maxWidth = '320px'; });
  const composer = page.getByRole('textbox', { name: 'Message #design', exact: true });
  await composer.fill('A long message: ' + 'x'.repeat(300));
  await composer.press('Enter');
  await noOverflow(page);
  await threadButton(page, 1000).click();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Close thread', exact: true }).click();
  await page.getByRole('button', { name: 'Show workspace', exact: true }).click();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Create channel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Create channel' })).toBeVisible();
  await noOverflow(page);
  await page.keyboard.press('Escape');
  for (const width of [320, 390, 720, 820, 1100, 1440]) {
    await page.locator('.chat-container').evaluate(element => { element.style.maxWidth = ''; });
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
  }
});

for (const appearance of ['light', 'dark']) {
  test(`conversation, reactions, activity, threads, and dialogs are accessible in automatic ${appearance} appearance`, async ({ page }) => {
    // Full-page audits across nine states share this scenario's time budget.
    test.slow();
    await page.emulateMedia({ colorScheme: appearance });
    await accessible(page);
    await page.locator('.chat-message[data-message-id="202"] summary').click();
    await accessible(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
    await accessible(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Create channel', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Create channel' });
    await dialog.getByLabel('Channel name', { exact: true }).fill('design');
    await dialog.getByLabel('Description', { exact: true }).fill('An existing channel.');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(dialog).toContainText('That channel already exists.');
    await accessible(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'New direct message', exact: true }).click();
    await accessible(page);
    await page.keyboard.press('Escape');
    await navigation(page).getByRole('button', { name: /^All unread/ }).click();
    await accessible(page);
    await room(page, 'design').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await accessible(page);
    await threadButton(page, 202).click();
    await expect(page.locator('#chat-thread-title')).toBeFocused();
    await page.getByRole('textbox', { name: 'Reply to thread', exact: true }).press('Enter');
    await expect(page.locator('#chat-thread-error')).toBeVisible();
    await accessible(page);
    await page.getByRole('button', { name: 'Close thread', exact: true }).click();
    await page.getByRole('button', { name: 'Show workspace', exact: true }).click();
    await accessible(page);
  });
}

test('the CSS-only sample keeps native disclosure and follows system appearance without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1100 } });
  try {
    const page = await context.newPage();
    await page.goto('/chat.html');
    await expect(page.locator('.chat-history noscript .chat-message-body').last()).toBeVisible();
    await expect(page.locator('.chat-history noscript .chat-message-body').last()).toContainText('mobile conversation view');
    await expect(page.getByRole('textbox', { name: 'Message #design', exact: true })).toBeDisabled();
    const group = page.locator('.chat-room-group').first();
    await group.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect(group).not.toHaveAttribute('open', '');
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      await expect(page.locator('html')).toHaveCSS('color-scheme', scheme);
      await expect(page.locator('#chat')).toHaveCSS('background-color', scheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(37, 37, 40)');
    }
  } finally { await context.close(); }
});

function navigation(page) { return page.getByRole('navigation', { name: 'Workspace conversations', exact: true }); }
function room(page, id) { return navigation(page).locator(`[data-room-id="${id}"]`); }
function threadButton(page, id) { return page.locator(`.chat-history button[data-thread-trigger="${id}"]`); }
async function accessible(page) { expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]); }
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#chat').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}
