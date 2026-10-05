import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/support.html');
  await expect(page.locator('button.support-ticket')).toHaveCount(6);
});

test('support sits beside Mail and queue search and priority filters work', async ({ page }) => {
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Mail', exact: true }),
  ).toHaveAttribute('href', '/');
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  const search = page.getByRole('searchbox', { name: 'Search Conversations' });
  await search.fill('sso');
  await expect(page.locator('button.support-ticket')).toHaveCount(1);
  await expect(page.locator('#ticket-title')).toHaveText('Sign-in after changing our domain');
  await search.fill('1038');
  await expect(page.locator('button.support-ticket')).toHaveCount(1);
  await expect(page.locator('#ticket-title')).toHaveText('Our project export is missing files');
  await search.fill('');
  await page.getByRole('button', { name: 'Show priority conversations' }).click();
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await page.getByRole('button', { name: 'Show priority conversations' }).click();
  await queue(page, 'Waiting').click();
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await queue(page, 'Closed').click();
  await expect(page.locator('button.support-ticket')).toHaveCount(1);
});

test('reply and note drafts stay independent across tickets and notes remain internal', async ({ page }) => {
  const reply = page.getByRole('textbox', { name: 'Reply Message', exact: true });
  await reply.fill('Hi Sophie, your projects will stay in place.');
  await page.getByRole('radio', { name: 'Note', exact: true }).check();
  await expect(page.getByRole('textbox', { name: 'Internal Note', exact: true })).toHaveValue('');
  await page
    .getByRole('textbox', { name: 'Internal Note', exact: true })
    .fill('Private handoff: Mia will handle annual billing.');
  await page.getByRole('radio', { name: 'Reply', exact: true }).check();
  await expect(reply).toHaveValue('Hi Sophie, your projects will stay in place.');
  await ticket(page, 1040).click();
  await expect(reply).toHaveValue('');
  await reply.fill('A separate reply for Emma.');
  await ticket(page, 1042).click();
  await expect(reply).toHaveValue('Hi Sophie, your projects will stay in place.');
  await page.getByRole('radio', { name: 'Note', exact: true }).check();
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Internal Note', exact: true }).first()).toContainText(
    'Private handoff: Mia will handle annual billing.',
  );
  await expect(page.getByRole('region', { name: 'Internal Note', exact: true }).first()).toContainText(
    'Only your team',
  );
  await expect(page.getByLabel('Conversation Status')).toHaveValue('open');
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  await page.getByRole('radio', { name: 'Reply', exact: true }).check();
  await expect(reply).toHaveValue('Hi Sophie, your projects will stay in place.');
  await page.getByRole('button', { name: 'Send Reply', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Agent reply', exact: true }).first()).toContainText(
    'Hi Sophie, your projects will stay in place.',
  );
  await expect(page.getByRole('region', { name: 'Agent reply', exact: true }).first()).not.toContainText(
    'Private handoff',
  );
  await expect(reply).toHaveValue('');
  await ticket(page, 1040).click();
  await expect(reply).toHaveValue('A separate reply for Emma.');
});

test('assignment, closing, waiting, and reopening update the actual queues', async ({ page }) => {
  await queue(page, 'Unassigned').click();
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Assigned To', exact: true }).fill('Alex');
  await page.getByRole('combobox', { name: 'Assigned To', exact: true }).press('Enter');
  await expect(page.locator('button.support-ticket')).toHaveCount(1);
  await expect(queue(page, 'Assigned to Me')).toContainText('4');
  await queue(page, 'Assigned to Me').click();
  await ticket(page, 1041).click();
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  await page.getByRole('button', { name: 'Close Conversation', exact: true }).click();
  await expect(queue(page, 'Closed')).toContainText('2');
  await queue(page, 'Closed').click();
  await ticket(page, 1041).click();
  await page.getByRole('textbox', { name: 'Reply Message', exact: true }).fill('We have updated your SSO domain.');
  await page.getByRole('button', { name: 'Reopen & reply', exact: true }).click();
  await expect(page.getByLabel('Conversation Status')).toHaveValue('open');
  await expect(ticket(page, 1041)).toHaveAttribute('aria-current', 'true');
  await expect(queue(page, 'Closed')).toContainText('1');
  await page.getByLabel('Conversation Status').selectOption('waiting');
  await expect(queue(page, 'Waiting')).toContainText('3');
  await queue(page, 'Waiting').click();
  await ticket(page, 1041).click();
  await expect(page.getByLabel('Conversation Status')).toHaveValue('waiting');
});

test('tags and customer history belong to the selected customer', async ({ page }) => {
  const tags = page.locator('.support-tags');
  await page.getByRole('textbox', { name: 'Add a tag', exact: true }).fill('Priority account');
  await page.getByRole('button', { name: 'Add tag', exact: true }).click();
  await expect(tags).toContainText('Priority account');
  await page.getByRole('textbox', { name: 'Add a tag', exact: true }).fill('priority ACCOUNT');
  await page.getByRole('textbox', { name: 'Add a tag', exact: true }).press('Enter');
  await expect(tags.locator('.f-chip')).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove tag Billing', exact: true }).click();
  await expect(tags.locator('.f-chip')).toHaveCount(2);
  await page.getByRole('button', { name: /A copy of last month’s invoice/ }).click();
  await expect(page.locator('#ticket-title')).toHaveText('A copy of last month’s invoice');
  await expect(page.getByLabel('Conversation Status')).toHaveValue('closed');
  await expect(page.locator('.support-customer-profile')).toContainText('Sophie Chen');
  await expect(page.getByRole('button', { name: /A little help with our team plan/ }).last()).toBeVisible();
});

test('new conversations retain native validation and create an unassigned ticket', async ({ page }) => {
  await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New Conversation', exact: true });
  await expect(dialog.getByLabel('Customer Name')).toBeFocused();
  await dialog.getByRole('button', { name: 'Create Conversation' }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.getByLabel('Customer Name').evaluate(element => element.validity.valueMissing)).toBe(true);
  await dialog.getByLabel('Customer Name').fill('Ava Martin');
  await dialog.getByLabel('Customer Email').fill('invalid');
  await dialog.getByLabel('Subject', { exact: true }).fill('A question about guest access');
  await dialog.getByLabel('Customer Message').fill('Can guests leave comments?');
  await dialog.getByRole('button', { name: 'Create Conversation' }).click();
  expect(await dialog.getByLabel('Customer Email').evaluate(element => element.validity.typeMismatch)).toBe(true);
  await dialog.getByLabel('Customer Email').fill('ava@example.com');
  await dialog.getByLabel('Customer Message').fill('   ');
  await dialog.getByRole('button', { name: 'Create Conversation' }).click();
  await expect(dialog).toContainText('Complete each field');
  await dialog.getByLabel('Customer Message').fill('Can guests leave comments?');
  await dialog.getByRole('button', { name: 'Create Conversation' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('button.support-ticket')).toHaveCount(7);
  await expect(ticket(page, 1043)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#ticket-title')).toHaveText('A question about guest access');
  await expect(page.locator('#support-assignee')).toHaveValue('');
});

test('keyboard selection and empty search keep focus and recover the inbox', async ({ page }) => {
  await ticket(page, 1042).focus();
  await page.keyboard.press('ArrowDown');
  await expect(ticket(page, 1041)).toBeFocused();
  await expect(ticket(page, 1041)).toHaveAttribute('aria-current', 'true');
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('nothing-matches');
  await expect(page.getByRole('heading', { name: 'No Conversations', exact: true })).toBeVisible();
  await expect(page.locator('button.support-ticket')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear Filters', exact: true }).click();
  await expect(page.locator('button.support-ticket')).toHaveCount(6);
  await expect(page.getByRole('searchbox', { name: 'Search Conversations' })).toBeFocused();
});

test('phone and tablet screens share drafts, assignment, and focus with desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.support-conversation')).not.toBeVisible();
  await ticket(page, 1042).click();
  await expect(page.locator('#ticket-title')).toBeFocused();
  await page.getByRole('textbox', { name: 'Reply Message', exact: true }).fill('Draft across all layouts.');
  await page.getByRole('button', { name: 'Show customer details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Back to conversation', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: 'Assigned To', exact: true }).fill('Mia');
  await page.getByRole('combobox', { name: 'Assigned To', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Back to conversation', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Reply Message', exact: true })).toHaveValue(
    'Draft across all layouts.',
  );
  await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
  await expect(ticket(page, 1042)).toBeFocused();
  await page.getByRole('button', { name: 'Show support views', exact: true }).click();
  await expect(queue(page, 'Open')).toBeFocused();
  await queue(page, 'Open').click();
  await ticket(page, 1042).click();
  await page.setViewportSize({ width: 820, height: 1000 });
  await expect(page.locator('.support-list-pane')).toBeVisible();
  await expect(page.locator('.support-conversation')).toBeVisible();
  await expect(page.locator('.support-customer')).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(page.locator('.support-customer')).toBeVisible();
  await expect(page.locator('#support-assignee')).toHaveValue('mia');
  await expect(page.getByRole('textbox', { name: 'Reply Message', exact: true })).toHaveValue(
    'Draft across all layouts.',
  );
});

test('small screens and a narrow container fit without losing actions', async ({ page }) => {
  for (const width of [320, 390, 720, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`).toBe(
      true,
    );
  }
  await page.locator('.support-container').evaluate(element => {
    element.style.maxWidth = '320px';
    element.style.marginInline = 'auto';
  });
  await ticket(page, 1042).click();
  const box = await page.locator('#support').boundingBox();
  for (const control of [
    page.getByLabel('Conversation Status'),
    page.getByRole('button', { name: 'Show customer details' }),
    page.getByRole('button', { name: 'Send Reply', exact: true }),
  ]) {
    const rect = await control.boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(box.x);
    expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width);
  }
});

for (const theme of ['light', 'dark']) {
  test(`support screens and dialogs are accessible in automatic ${theme} appearance`, async ({ page }) => {
    // Full-page audits across seven states share this scenario's time budget.
    test.slow();
    await page.emulateMedia({ colorScheme: theme });
    await expectAccessible(page);
    await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Show support views', exact: true }).click();
    for (const mailbox of ['support', 'billing', 'feedback'])
      await page.locator(`#support-queues [data-scope="${mailbox}"] > summary`).click();
    await expectAccessible(page);
    await queue(page, 'Open').click();
    await ticket(page, 1042).click();
    await expectAccessible(page);
    await page.getByRole('radio', { name: 'Note', exact: true }).check();
    await page.getByRole('button', { name: 'Add note', exact: true }).click();
    await expect(page.locator('#support-reply-error')).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Show customer details', exact: true }).click();
    await expectAccessible(page);
  });
}

test('read-only Support retains automatic CSS dark mode without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light' });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/support.html');
    await expect(page.locator('#support')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.getByRole('heading', { name: 'A little help with our team plan', exact: true })).toBeVisible();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('#support')).toHaveCSS('background-color', 'rgb(37, 37, 40)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  } finally {
    await context.close();
  }
});

function ticket(page, id) {
  return page.locator(`button.support-ticket[data-ticket-id="${id}"]`);
}
test('a website-chat conversation opens in the Chat view, oldest first, at its newest message', async ({ page }) => {
  await queue(page, 'Waiting').click();
  await page.locator('button.support-ticket', { hasText: 'Inviting a client' }).click();
  const conversation = page.locator('#support-conversation');
  await expect(conversation.getByRole('heading', { level: 2 })).toHaveText('Lena Wilson');
  await expect(conversation).toContainText('Support · Website Chat');
  const history = conversation.getByRole('region', { name: 'Chat with Lena Wilson' });
  const messages = history.getByRole('list', { name: 'Messages' });
  await expect(messages).toHaveClass(/f-thread--compact/);
  const entries = messages.locator(':scope > li');
  await expect(entries.first()).toContainText('Can we invite a client');
  await expect(entries.last()).toContainText('I’ll give that a try');
  const fromEnd = () => history.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight);
  await expect.poll(fromEnd).toBeLessThan(2);
  // Alex's two quick replies: the name and avatar show once.
  await expect(entries.nth(1).locator('.f-message')).not.toHaveClass(/f-message--continued/);
  await expect(entries.nth(2).locator('.f-message')).toHaveClass(/f-message--continued/);
  await expect(entries.nth(2).locator('.f-avatar')).toHaveCSS('visibility', 'hidden');
  // Compact rows: no line between messages.
  expect(await entries.nth(1).evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('none');
  // Enter sends; the reply lands last, in view, and the composer keeps focus.
  const composer = conversation.getByRole('textbox', { name: 'Message Lena Wilson' });
  await composer.fill('Let me know how it goes!');
  await composer.press('Enter');
  await expect(entries.last()).toContainText('Let me know how it goes!');
  await expect.poll(fromEnd).toBeLessThan(2);
  await expect(composer).toBeFocused();
  // Shift+Enter is a new line, not a send.
  await composer.press('Shift+Enter');
  await expect(entries).toHaveCount(8);
  await expectAccessible(page, '#support-conversation');
  // An email conversation keeps the email view: newest first, the composer on top.
  await queue(page, 'Open').click();
  await page.locator('button.support-ticket').first().click();
  await expect(conversation.locator('.f-history')).toHaveCount(0);
  await expect(conversation.locator('form.f-composer--top')).toBeVisible();
});

async function openTeamChat(page, mailbox = 'Support') {
  await page.getByRole('button', { name: /^Team Chat/ }).click();
  if (await page.getByRole('heading', { name: `${mailbox} Team` }).isVisible()) return;
  await page.getByRole('button', { name: 'Switch Team Chat' }).click();
  await page.getByRole('menuitemradio', { name: new RegExp(`^${mailbox}`) }).click();
}

test('team chat is one item at the top that opens the chosen mailbox’s room in place', async ({ page }) => {
  const link = page.getByRole('button', { name: /^Team Chat/ });
  // One way in, with the unread total of the rooms.
  await expect(link).toHaveAccessibleName('Team Chat, 3 unread');
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'page');
  await expect(link).toHaveAccessibleName('Team Chat, 1 unread');
  await expect(page.getByRole('button', { name: 'All Inboxes', exact: false }).first()).not.toHaveAttribute(
    'aria-current',
  );
  // The room takes the list, conversation and details' place.
  await expect(page.locator('#support-list-pane')).toBeHidden();
  await expect(page.locator('#support-conversation')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Support Team' })).toBeVisible();
  const history = page.getByRole('region', { name: 'Support team chat' });
  const fromEnd = () => history.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight);
  await expect.poll(fromEnd).toBeLessThan(2);
  // Days, then "New" from the first unread message; a run shows the name once.
  await expect(history.getByRole('separator')).toHaveText(['Yesterday', 'Today', 'New']);
  const fresh = history.getByRole('list', { name: 'New messages' }).getByRole('article');
  await expect(fresh).toHaveCount(2);
  await expect(fresh.nth(1)).toHaveClass(/f-message--continued/);
  await expect(fresh.first().locator('.support-mention')).toHaveText('@alex');
  // A mention picks a teammate with Enter; the next Enter sends.
  const composer = page.getByRole('textbox', { name: 'Message the Support team' });
  await composer.fill('On it. @');
  await composer.press('m');
  await expect(page.getByRole('option', { name: /Mia Patel/ })).toBeVisible();
  await composer.press('Enter');
  await expect(composer).toHaveValue(/On it\. @mia/);
  await composer.press('Enter');
  await expect(composer).toHaveValue('');
  const messages = history.getByRole('article');
  await expect(messages.last()).toContainText('On it. @mia');
  // A teammate answers; the history follows the arrival.
  await expect(page.getByRole('status').filter({ hasText: 'Mia is typing…' })).toBeVisible();
  await expect(messages.last()).toContainText('Thanks, I’ll take a look.');
  await expect.poll(fromEnd).toBeLessThan(2);
  await expectAccessible(page, '#support');
  // The title's switcher lists each mailbox's room with its unread count, and is remembered.
  await page.getByRole('button', { name: 'Switch Team Chat' }).click();
  await expect(page.getByRole('menuitemradio', { name: 'Support' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('menuitemradio', { name: 'Billing, 1 unread' }).click();
  await expect(page.getByRole('heading', { name: 'Billing Team' })).toBeVisible();
  await expect(link).toHaveAccessibleName('Team Chat');
  await page
    .getByRole('button', { name: /^Unassigned/ })
    .first()
    .click();
  await expect(page.locator('#support-room')).toBeHidden();
  await link.click();
  await expect(page.getByRole('heading', { name: 'Billing Team' })).toBeVisible();
  // A conversation number opens that conversation and leaves the room.
  await openTeamChat(page);
  await page.getByRole('region', { name: 'Support team chat' }).getByRole('link', { name: '#1042' }).click();
  await expect(page.locator('#support-room')).toBeHidden();
  await expect(page.locator('#ticket-title')).toHaveText('A little help with our team plan');
});

test('the team chat’s details list its people, pinned messages and recent files', async ({ page }) => {
  await openTeamChat(page);
  const details = page.getByRole('complementary', { name: 'Chat details' });
  await expect(details.getByRole('heading', { name: /People/ })).toBeVisible();
  await expect(details.locator('.support-room-people li')).toHaveText([
    /Alex Morgan\s*You$/,
    /Mia Patel$/,
    /Noah Williams$/,
  ]);
  const pins = details.locator('.support-room-pin');
  await expect(pins).toHaveCount(2);
  await expect(details.getByRole('link', { name: /domain-checklist\.txt/ })).toBeVisible();
  // Pin from a message's actions; the pinned list follows, and a pin shows its message.
  const history = page.getByRole('region', { name: 'Support team chat' });
  const message = history.getByRole('article', { name: /Message from Alex Morgan/ }).first();
  await message.hover();
  const pin = message.getByRole('button', { name: 'Pin Message' });
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await expect(message).toHaveAccessibleName('Message from Alex Morgan, pinned');
  await expect(pins).toHaveCount(3);
  await pins.first().click();
  await expect(history.getByRole('article', { name: /Message from Mia Patel, pinned/ })).toBeFocused();
  await expectAccessible(page, '#support');
});

test('on a narrower window the team chat’s details open in place of the room', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await openTeamChat(page);
  await expect(page.getByRole('complementary', { name: 'Chat details' })).toBeHidden();
  await page.getByRole('button', { name: 'Show chat details' }).click();
  await expect(page.getByRole('complementary', { name: 'Chat details' })).toBeVisible();
  await expect(page.locator('#support-room')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Back to team chat' })).toBeFocused();
  await page.getByRole('button', { name: 'Back to team chat' }).click();
  await expect(page.locator('#support-room')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show chat details' })).toBeFocused();
});

test('team chat sends attachments, and an empty room says what it is for', async ({ page }) => {
  await openTeamChat(page);
  await page.locator('#support-room input[type=file]').setInputFiles({
    name: 'refund-policy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Refunds within 30 days.'),
  });
  const pending = page.getByRole('list', { name: 'Attachments to send' });
  await expect(pending).toContainText('refund-policy.txt');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const sent = page.getByRole('region', { name: 'Support team chat' }).getByRole('article').last();
  await expect(sent.getByRole('link', { name: /refund-policy\.txt/ })).toHaveAttribute('download', 'refund-policy.txt');
  await expect(pending).toBeHidden();
  await openTeamChat(page, 'Feedback');
  await expect(page.getByRole('heading', { name: 'A room for the team.' })).toBeVisible();
});

test('on a phone the team chat takes the screen and the sidebar is one tap away', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Show support views' }).first().click();
  await openTeamChat(page);
  await expect(page.getByRole('heading', { name: 'Support Team' })).toBeFocused();
  await expect(page.locator('#support-queues')).toBeHidden();
  await page.locator('.support-room-toolbar').getByRole('button', { name: 'Show support views' }).click();
  await expect(page.locator('#support-queues')).toBeVisible();
  await expect(page.locator('#support-room')).toBeHidden();
  await page.getByRole('button', { name: 'Back to team chat' }).click();
  await expect(page.locator('#support-room')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Support Team' })).toBeFocused();
  expect(await page.locator('#support').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

function queue(page, name) {
  return page
    .getByRole('navigation', { name: 'Support views', exact: true })
    .getByRole('button', { name: new RegExp(`^${name === 'Open' ? 'All Inboxes' : name}`) });
}

test('quoting a message fills the reply and internal notes cannot be quoted', async ({ page }) => {
  // Newest first: Sophie's opening message is the last entry.
  const customer = page.locator('.support-message[data-kind="customer"]').last();
  await customer.hover();
  await customer.getByRole('button', { name: 'Quote Sophie Chen in reply', exact: true }).click();
  const reply = page.getByRole('textbox', { name: 'Reply Message', exact: true });
  await expect(reply).toBeFocused();
  // The quote follows the existing draft after a blank line.
  await expect(reply).toHaveValue(/^Hi Sophie,[\s\S]*\S\n\n> Hi there,\n> \n> We’re growing the studio[\s\S]*\n\n$/);
  await expect(page.locator('.support-message[data-kind="note"] .f-message__actions')).toBeHidden();
});

test('a reply that failed to send shows one status line with Retry, View log and its attachment', async ({ page }) => {
  await page.locator('button.support-ticket', { hasText: 'Jordan Lee' }).click();
  const reply = page.getByRole('region', { name: 'Agent reply', exact: true }).first();
  const status = reply.locator('.f-message__status');
  await expect(status).toHaveAttribute('data-tone', 'danger');
  await expect(status).toContainText('Not sent: the mail server refused the connection.');
  // One status line, no nested alert box.
  await expect(reply.locator('.f-alert')).toHaveCount(0);

  await status.getByRole('button', { name: 'View Log' }).click();
  const log = page.getByRole('dialog', { name: 'Delivery log' });
  await expect(log).toContainText('Sendmail exited with non-zero exit code 127');
  await page.keyboard.press('Escape');

  // The attachment's remove action shows on hover or focus.
  const frame = reply.locator('.f-attachment__frame');
  const actions = frame.getByRole('group', { name: 'Attachment actions' });
  await page.mouse.move(0, 0);
  await expect.poll(() => actions.evaluate(element => getComputedStyle(element).opacity)).toBe('0');
  await frame.hover();
  await expect.poll(() => actions.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
  await expect(frame.getByRole('link', { name: /sso-setup-notes\.txt/ })).toHaveAttribute('download', '');
  await expectAccessible(page);

  await status.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reply sent to Jordan Lee' })).toBeVisible();
  await expect(reply.locator('.f-message__status')).toHaveCount(0);
  await actions.getByRole('button', { name: 'Remove sso-setup-notes.txt' }).click();
  await expect(reply.locator('.f-attachment')).toHaveCount(0);
});
