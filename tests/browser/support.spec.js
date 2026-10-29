import { test, expect } from '@playwright/test';
import { expectAccessible, expectNoOverflow, selectMarkdown, tokenColor } from './helpers.js';

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
  await filter(page, 'High Priority');
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await filter(page, 'High Priority');
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
  // The sidebar counts unread conversations: 1041 is Alex's now, unread, with 1040.
  await expect(queue(page, 'Assigned to Me')).toHaveAccessibleName('Assigned to Me, 2 unread');
  await queue(page, 'Assigned to Me').click();
  await ticket(page, 1041).click();
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  await page.getByRole('button', { name: 'Close Conversation', exact: true }).click();
  await queue(page, 'Closed').click();
  await ticket(page, 1041).click();
  await page.getByRole('textbox', { name: 'Reply Message', exact: true }).fill('We have updated your SSO domain.');
  await page.getByRole('button', { name: 'Reopen & reply', exact: true }).click();
  await expect(page.getByLabel('Conversation Status')).toHaveValue('open');
  await expect(ticket(page, 1041)).toHaveAttribute('aria-current', 'true');
  await page.getByLabel('Conversation Status').selectOption('waiting');
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
    await expect(page.locator('#support')).toHaveCSS('background-color', 'rgb(28, 28, 30)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  } finally {
    await context.close();
  }
});

function ticket(page, id) {
  return page.locator(`button.support-ticket[data-ticket-id="${id}"]`);
}
test('a website-chat conversation opens in the Chat view, oldest first, at its newest message', async ({ page }) => {
  // An email reads like a letter: its subject and status lead, on the plain surface.
  const email = page.locator('#support-conversation');
  await expect(email.locator('.support-conversation-overline')).toContainText('Open Conversation');
  await expect(email.locator('.support-conversation-avatar')).toBeHidden();
  await expect(email.locator('.support-thread')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await queue(page, 'Waiting').click();
  await page.locator('button.support-ticket', { hasText: 'Inviting a client' }).click();
  await expect(
    page.locator('button.support-ticket', { hasText: 'Inviting a client' }).locator('.support-channel'),
  ).toHaveAttribute('title', 'Website Chat');
  const conversation = page.locator('#support-conversation');
  await expect(conversation.getByRole('heading', { level: 2 })).toHaveText('Lena Wilson');
  // The header leads with the person and the channel; an email's leads with its subject and status.
  const heading = conversation.locator('.support-conversation-heading');
  await expect(heading.locator('.support-conversation-avatar')).toHaveText('LW');
  await expect(heading.locator('p.support-mailbox-detail')).toHaveText('Website Chat · Support');
  await expect(heading.locator('.support-conversation-overline')).toBeHidden();
  const history = conversation.getByRole('region', { name: 'Chat with Lena Wilson' });
  // The chat sits on the grouped background; an email thread stays on the plain surface.
  const grouped = await tokenColor(page, '--f-grouped-background');
  await expect(history).toHaveCSS('background-color', grouped);
  await expect(conversation.locator('.support-chat-composer')).toHaveCSS('background-color', grouped);
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
  // A pinned message keeps its header, even in a run, so its pin sits beside its time.
  const checklist = page.getByRole('article', { name: 'Message from Noah Williams, pinned' });
  await expect(checklist).not.toHaveClass(/f-message--continued/);
  const time = await checklist.locator('.f-message__time').boundingBox();
  const mark = await checklist.locator('.support-room-pinned').boundingBox();
  expect(Math.abs(mark.y + mark.height / 2 - (time.y + time.height / 2))).toBeLessThan(4);
  expect(mark.x).toBeGreaterThan(time.x + time.width);
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
  await page.getByRole('textbox', { name: 'Message the Support team' }).press('Enter');
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

/** Choose a filter in the list's Filter menu. */
async function filter(page, name) {
  await page.getByRole('button', { name: /^Filter/ }).click();
  await page
    .getByRole('menu', { name: 'Filter conversations' })
    .getByRole('menuitemcheckbox', { name, exact: true })
    .or(page.getByRole('menu', { name: 'Filter conversations' }).getByRole('menuitemradio', { name, exact: true }))
    .click();
}

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

test('All Inboxes marks each conversation with its mailbox’s color, named for screen readers', async ({ page }) => {
  // The mark replaces a visible mailbox tag: a bar in the mailbox's color, its name as text.
  await expect(ticket(page, 1042)).toHaveAttribute('data-fruit-mark', 'green');
  await expect(ticket(page, 1041)).toHaveAttribute('data-fruit-mark', 'blue');
  await expect(ticket(page, 1042)).toHaveAccessibleName(/Billing mailbox/);
  await expect(ticket(page, 1042).getByText('Billing mailbox')).toHaveClass('f-sr-only');
  const bar = id => ticket(page, id).evaluate(row => getComputedStyle(row, '::before').backgroundColor);
  expect(await bar(1042)).not.toBe(await bar(1041));
  // The sidebar's mailbox icons are the legend, in the same colors.
  const icon = mailbox =>
    page
      .locator(`#support-queues [data-scope="${mailbox}"] > summary > .f-icon`)
      .first()
      .evaluate(element => getComputedStyle(element).color);
  expect(await icon('billing')).toBe(await bar(1042));
  expect(await icon('support')).toBe(await bar(1041));
  // The mark is short: beside the title only, not the subject below it.
  const mark = await ticket(page, 1041).evaluate(row => {
    const bar = getComputedStyle(row, '::before');
    const title = row.querySelector('.f-item-row__title').getBoundingClientRect();
    const top = row.getBoundingClientRect().top + parseFloat(bar.top);
    return {
      height: parseFloat(bar.height),
      withinTitle: top >= title.top && top + parseFloat(bar.height) <= title.bottom,
    };
  });
  expect(mark).toEqual({ height: 14, withinTitle: true });
  // Other sidebar icons are gray; the current item's takes its text color. The accent is left for selection.
  const queueIcon = name =>
    queue(page, name)
      .locator('.f-icon')
      .first()
      .evaluate(icon => getComputedStyle(icon).color);
  const textOf = name => queue(page, name).evaluate(item => getComputedStyle(item).color);
  expect(await queueIcon('Waiting')).toBe(await tokenColor(page, '--f-secondary'));
  expect(await queueIcon('All Inboxes')).toBe(await textOf('All Inboxes'));
  // In one mailbox every row would share the color, so none is marked.
  await page.locator('#support-queues [data-scope="support"] > summary').click();
  await page.getByRole('button', { name: /^Support Open,/ }).click();
  await expect(ticket(page, 1041)).toBeVisible();
  await expect(page.locator('button.support-ticket[data-fruit-mark]')).toHaveCount(0);
  await expect(ticket(page, 1041)).not.toHaveAccessibleName(/Support mailbox/);
});

test('a calm conversation: no role under senders, a folded signature without table lines, the language as its value', async ({
  page,
}) => {
  await ticket(page, 1041).click();
  const thread = page.locator('.support-thread');
  // Customers and replies name only their sender; a note still says it stays with the team.
  const jordan = thread
    .getByRole('region', { name: 'Customer Message' })
    .filter({ hasText: 'We changed our company domain' });
  await expect(jordan.locator('.f-message__meta')).toBeHidden();
  // The signature folds away under a small secondary label at the end of the message.
  const signature = jordan.locator('details.f-disclosure--quiet', { hasText: 'Signature' });
  await expect(signature).not.toHaveAttribute('open');
  await expect(signature.getByText('IT Lead, Fieldwork')).toBeHidden();
  const label = await signature.locator('summary').evaluate(summary => ({
    color: getComputedStyle(summary).color,
    secondary: getComputedStyle(summary.closest('.f-message')).getPropertyValue('--f-secondary'),
    size: parseFloat(getComputedStyle(summary).fontSize),
    body: parseFloat(getComputedStyle(summary.closest('.f-message__body')).fontSize),
  }));
  expect(label.size).toBeLessThan(label.body);
  await signature.locator('summary').click();
  await expect(signature.getByText('IT Lead, Fieldwork')).toBeVisible();
  // Email lays itself out with tables: in a message they keep no grid lines or padding of FruitUI's.
  const cell = await signature
    .locator('td')
    .first()
    .evaluate(td => ({
      border: getComputedStyle(td).borderTopStyle,
      padding: getComputedStyle(td).paddingTop,
      after: getComputedStyle(td.closest('table')).marginBottom,
    }));
  expect(cell).toEqual({ border: 'none', padding: '1px', after: '0px' });
  // The customer's language shows as its value, in the link color, and opens the native picker.
  const language = page.getByRole('combobox', { name: 'Language' });
  await expect(language).toHaveValue('en');
  const quiet = await language.evaluate(select => ({
    border: getComputedStyle(select).borderTopColor,
    background: getComputedStyle(select).backgroundColor,
    width: select.getBoundingClientRect().width,
  }));
  expect(quiet.border).toBe('rgba(0, 0, 0, 0)');
  expect(quiet.background).toBe('rgba(0, 0, 0, 0)');
  expect(quiet.width).toBeLessThan(120);
  await language.selectOption('da');
  await expect(page.getByRole('status').filter({ hasText: 'Jordan Lee gets replies in Danish' })).toBeVisible();
  // A long value (a language with its own name beside it) stays on one line within the panel, cut
  // short with an ellipsis: it never wraps or scrolls the panel sideways.
  const fits = await language.evaluate(async select => {
    const height = select.getBoundingClientRect().height;
    select.querySelector('option[value="zh-Hans"]').textContent =
      'Chinese (Simplified) (简体中文) — Mainland China, Hong Kong and Macau';
    select.value = 'zh-Hans';
    await new Promise(requestAnimationFrame);
    const pane = select.closest('.f-pane');
    return {
      // One line, whatever font draws the CJK name: well under two lines' height.
      oneLine: select.getBoundingClientRect().height < height * 1.4,
      within: select.getBoundingClientRect().right <= select.closest('dd').getBoundingClientRect().right + 0.5,
      scrollsSideways: pane.scrollWidth > pane.clientWidth,
    };
  });
  expect(fits).toEqual({ oneLine: true, within: true, scrollsSideways: false });
});

test('a sidebar item under the pointer stays lighter than the current one, and panes scroll with thin scrollbars', async ({
  page,
  browserName,
}) => {
  const current = page.locator('#support-queues .f-sidebar__item[aria-current="page"]').first();
  const other = queue(page, 'Waiting');
  await other.hover();
  const alpha = color => {
    const match = color.match(/[\d.]+(?=\))/);
    return color.startsWith('rgba') || color.includes('/') ? Number(match[0]) : 1;
  };
  const hover = await other.evaluate(item => getComputedStyle(item).backgroundColor);
  const selected = await current.evaluate(item => getComputedStyle(item).backgroundColor);
  expect(alpha(hover)).toBeLessThan(0.05);
  expect(alpha(selected)).toBe(1);
  // Playwright's Firefox hides every scrollbar (scrollbar-width: none), even one styled thin.
  const scrollbar = await page.locator('.support-thread').evaluate(pane => getComputedStyle(pane).scrollbarWidth);
  expect(browserName === 'firefox' ? ['thin', 'none'] : ['thin']).toContain(scrollbar);
});

test('the heading names the customer only while their panel is out of sight', async ({ page }) => {
  const heading = page.locator('.support-conversation-heading');
  const panel = page.locator('#support-customer');
  // Beside the panel, which names them with their email, the heading leaves them out.
  await expect(panel.getByRole('heading', { name: 'Sophie Chen' })).toBeVisible();
  await expect(panel.getByText('sophie@example.com')).toBeVisible();
  await expect(heading.getByText('sophie@example.com')).toBeHidden();
  // When the panel is its own view, behind a button, the heading names them again.
  await page.setViewportSize({ width: 1000, height: 1000 });
  await expect(panel).toBeHidden();
  await expect(heading.getByText('sophie@example.com')).toBeVisible();
  await expect(heading.getByText('Sophie Chen', { exact: true })).toBeVisible();
});

test('an email conversation’s heading: status and mailbox on one line, then the subject and where it stands', async ({
  page,
}) => {
  const heading = page.locator('.support-conversation-heading');
  const overline = heading.locator('.support-conversation-overline');
  await expect(overline.locator('.support-status')).toHaveText('Open Conversation');
  await expect(overline.locator('.support-mailbox-detail')).toHaveText('Billing · billing@forma.example');
  const line = await overline.evaluate(row => {
    const status = row.querySelector('.support-status').getBoundingClientRect();
    const mailbox = row.querySelector('.support-mailbox-detail').getBoundingClientRect();
    return { sameLine: Math.abs(status.top - mailbox.top) < 4, gap: Math.round(mailbox.left - status.right) };
  });
  expect(line.sameLine).toBe(true);
  expect(line.gap).toBeGreaterThanOrEqual(16);
  // The summary follows the subject; the thread no longer holds it.
  const order = await heading.evaluate(header => {
    const title = header.querySelector('h2').getBoundingClientRect();
    const summary = header.querySelector('.f-generated').getBoundingClientRect();
    return summary.top > title.bottom;
  });
  expect(order).toBe(true);
  await expect(page.locator('.support-thread .f-generated')).toBeHidden();
  await expect(heading.locator('p.support-mailbox-detail')).toBeHidden();
  // On a phone it leads the thread instead, so the heading stays short and the reply field in reach.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading.locator('.f-generated')).toBeHidden();
  await expect(page.locator('.support-thread .f-generated')).toContainText('Studio North moved to the Team plan');
});

test('an unread conversation’s name is bold, a read one’s is not, whatever their status', async ({ page }) => {
  const weight = id =>
    ticket(page, id)
      .locator('.f-item-row__title')
      .evaluate(title => getComputedStyle(title).fontWeight);
  // Jordan Lee (1041) is unread, Sophie Chen (1042) read.
  await expect(ticket(page, 1041)).toHaveAttribute('data-unread', '');
  expect(await weight(1041)).toBe('650');
  expect(await weight(1042)).toBe('500');
  // Opening it reads it: its name is no longer bold.
  await ticket(page, 1041).click();
  await expect(ticket(page, 1041)).not.toHaveAttribute('data-unread');
  expect(await weight(1041)).toBe('500');
});

test('the list leaves conversation numbers to search results and the open conversation', async ({ page }) => {
  // People find a conversation by who and what; its number is in its header.
  await expect(ticket(page, 1042).getByText('#1042', { exact: true })).toBeHidden();
  await expect(page.locator('.support-ticket-number')).toHaveText('#1042');
  // The last line says only what differs from the usual. Email is usual, so an email row names no
  // channel and no count; a row with nothing to add has no last line at all.
  await expect(ticket(page, 1042).locator('.support-channel')).toBeHidden();
  await expect(ticket(page, 1042)).not.toHaveAccessibleName(/Email|message/);
  await expect(ticket(page, 1040).locator('.support-ticket-meta')).toBeHidden();
  await expect(ticket(page, 1041).getByText('High priority')).toBeVisible();
  await expect(ticket(page, 1041).getByText('#1041', { exact: true })).toBeHidden();
  // Search results show it, whether the search was for the number or for words.
  const search = page.getByRole('searchbox', { name: 'Search Conversations' });
  await search.fill('1038');
  await expect(ticket(page, 1038).getByText('#1038', { exact: true })).toBeVisible();
  await search.fill('invite');
  await expect(ticket(page, 1042).getByText('#1042', { exact: true })).toBeVisible();
  await search.fill('');
  await expect(ticket(page, 1042).getByText('#1042', { exact: true })).toBeHidden();
});

test('a row’s context menu holds the selection bar’s commands, for the row or the whole selection', async ({
  page,
}) => {
  const toast = text => page.getByRole('status').filter({ hasText: text });
  const menu = page.getByRole('menu', { name: /^Actions for/ }).filter({ visible: true });
  // A right-click opens it at the pointer, for that row alone; an unread row offers Mark as Read.
  await ticket(page, 1041).click({ button: 'right' });
  await expect(menu).toHaveAccessibleName('Actions for Jordan Lee');
  await expect(menu.getByRole('menuitem')).toHaveText(['Mark as Read', 'Assign to Me', 'Move to Waiting', 'Close']);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  // One menu beside the list serves every row; the row it acts on is outlined.
  await expect(page.locator('#support-list-pane .f-context-menu')).toHaveCount(1);
  await expect(ticket(page, 1041).locator('xpath=..')).toHaveAttribute('data-fruit-context-open', '');
  await menu.getByRole('menuitem', { name: 'Mark as Read' }).click();
  await expect(ticket(page, 1041).locator('xpath=..')).not.toHaveAttribute('data-fruit-context-open');
  await expect(toast('1 conversation marked as read')).toBeVisible();
  await expect(ticket(page, 1041).locator('.support-unread')).toBeHidden();
  // From the keyboard: Shift+F10 on the focused row, Escape returns to it.
  await ticket(page, 1040).focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toHaveAccessibleName('Actions for Emma Thompson');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(ticket(page, 1040)).toBeFocused();
  // On a selected row it acts on the whole selection, as mail apps do.
  await ticket(page, 1040).click({ modifiers: ['ControlOrMeta'] });
  await ticket(page, 1038).click({ modifiers: ['ControlOrMeta'] });
  const checked = () => page.locator('#support-tickets input[type="checkbox"]:checked').count();
  expect(await checked()).toBeGreaterThanOrEqual(2);
  const selected = await checked();
  // A row outside the selection is acted on alone, and the selection stays.
  await ticket(page, 1041).click({ button: 'right' });
  await expect(menu).toHaveAccessibleName('Actions for Jordan Lee');
  await menu.getByRole('menuitem', { name: 'Assign to Me' }).click();
  await expect(toast('1 conversation assigned to you')).toBeVisible();
  expect(await checked()).toBe(selected);
  await ticket(page, 1040).click({ button: 'right' });
  await expect(menu).toHaveAccessibleName(`Actions for ${selected} conversations`);
  await expect(menu.getByRole('menuitem').first()).toHaveText('Mark as Unread');
  await menu.getByRole('menuitem', { name: 'Move to Waiting' }).click();
  await expect(toast(`${selected} conversations moved to Waiting`)).toBeVisible();
  expect(await checked()).toBe(0);
});

test('an image attachment shows as a thumbnail, named by its file and removable', async ({ page }) => {
  const card = page.locator('.support-thread a.f-attachment--thumbnail');
  await expect(card).toHaveCount(1);
  // The picture is decorative; the link reads as the file.
  await expect(card).toHaveAccessibleName('invite-link-expired.png 19 KB');
  await expect(card.locator('img')).toHaveAttribute('alt', '');
  // It loads lazily, when scrolled into view.
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const layout = await card.evaluate(link => {
    const box = element => element.getBoundingClientRect();
    const image = box(link.querySelector('img'));
    const body = box(link.querySelector('.f-attachment__body'));
    const actions = box(link.parentElement.querySelector('.f-attachment__actions'));
    return {
      imageHeight: image.height,
      nameBelow: body.top >= image.bottom,
      nameWithin: body.width <= image.width + 9,
      actionsOverCorner: actions.top >= image.top && actions.bottom <= image.bottom && actions.right <= image.right + 1,
    };
  });
  expect(layout).toEqual({ imageHeight: 160, nameBelow: true, nameWithin: true, actionsOverCorner: true });
  // Keyboard: the card and its Remove button are each a Tab stop; Remove takes the card away.
  await card.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Remove invite-link-expired.png' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card).toHaveCount(0);
  await expectAccessible(page, '.support-thread');
});

test('a queue without unread conversations shows a gray dot while open ones for you wait there, read', async ({
  page,
}) => {
  // Badges count unread conversations. Billing has none, but holds an open one of Alex's, read.
  const billing = page.locator('#support-queues [data-scope="billing"] > summary');
  await expect(billing).toHaveAccessibleName('Billing mailbox, conversations for you, all read');
  const dot = billing.locator('.f-badge--dot');
  await expect(dot).toBeVisible();
  // An image with no text, named, with the same tooltip: no hidden text for contrast checks to measure.
  await expect(dot).toHaveAttribute('role', 'img');
  await expect(dot).toHaveAccessibleName('Conversations for you, all read');
  await expect(dot).toHaveAttribute('title', 'Conversations for you, all read');
  await expect(dot).toHaveText('');
  // A gray dot alone, in the place its count would take; the text is for screen readers.
  const dotStyle = (badge, property) =>
    badge.evaluate((element, property) => getComputedStyle(element, '::before')[property], property);
  expect(await dotStyle(dot, 'backgroundColor')).toBe(await tokenColor(page, '--f-tertiary'));
  expect(await dotStyle(dot, 'width')).toBe('7px');
  expect(await dot.evaluate(element => element.getBoundingClientRect().width)).toBe(20);
  await billing.click();
  const row = name => page.getByRole('button', { name: new RegExp(`^Billing ${name}`) });
  await expect(row('Open')).toHaveAccessibleName('Billing Open, conversations for you, all read');
  // Others' conversations and those waiting on the customer aren't for you now.
  await expect(row('Waiting')).toHaveAccessibleName('Billing Waiting');
  await expect(row('Waiting').locator('.f-badge--dot')).toBeHidden();
  // Feedback's open conversation has no one assigned: it's for you too.
  await expect(page.locator('#support-queues [data-scope="feedback"] > summary')).toHaveAccessibleName(
    'Feedback mailbox, conversations for you, all read',
  );

  // Reading the last unread conversation for you turns the count into the dot.
  const mine = queue(page, 'Assigned to Me');
  await expect(mine).toHaveAccessibleName('Assigned to Me, 1 unread');
  await mine.click();
  await ticket(page, 1040).click();
  await expect(mine).toHaveAccessibleName('Assigned to Me, conversations for you, all read');
  await expect(mine.locator('.f-badge:not(.f-badge--dot)')).toBeHidden();
  // On the selected row the dot takes the row's text color, so it stays visible on the selection.
  await mine.focus();
  const color = await mine.evaluate(element => getComputedStyle(element).color);
  expect(await dotStyle(mine.locator('.f-badge--dot'), 'backgroundColor')).toBe(color);
});

test('one Filter menu holds every filter, a group for each way this view can be narrowed', async ({ page }) => {
  const button = page.getByRole('button', { name: /^Filter/ });
  const menu = page.getByRole('menu', { name: 'Filter conversations' });
  const rows = page.locator('button.support-ticket');
  await expect(button).toHaveAccessibleName('Filter');
  await button.click();
  // Show is in every view; Assigned To where the view holds everyone's conversations; checkmarks, no boxes.
  await expect(menu.getByRole('group')).toHaveCount(2);
  await expect(menu.getByRole('group', { name: 'Show' }).getByRole('menuitemcheckbox')).toHaveText([
    'Unread',
    'High Priority',
  ]);
  await expect(menu.getByRole('group', { name: 'Assigned To' }).getByRole('menuitemradio')).toHaveText([
    'Anyone',
    'Me',
    'Unassigned',
    'Mia Patel',
    'Noah Williams',
  ]);
  await expect(menu.getByRole('menuitemradio', { name: 'Anyone' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitem', { name: 'Clear Filters' })).toBeHidden();
  await expectAccessible(page, '.support-list-header');
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();

  // Filters combine; the button names those in effect, and the open conversation stays while it's read.
  await filter(page, 'Unread');
  await expect(rows).toHaveCount(4);
  await expect(ticket(page, 1042)).toBeVisible();
  await filter(page, 'Mia Patel');
  await expect(button).toHaveAccessibleName('Filter: Unread, Mia Patel');
  await expect(button).toHaveText(/Unread, Mia Patel/);
  await expect(rows).toHaveCount(1);
  await expect(ticket(page, 1038)).toBeVisible();
  await button.click();
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Unread' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitemradio', { name: 'Mia Patel' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitemradio', { name: 'Anyone' })).toHaveAttribute('aria-checked', 'false');
  await menu.getByRole('menuitem', { name: 'Clear Filters' }).click();
  await expect(button).toHaveAccessibleName('Filter');
  await expect(rows).toHaveCount(6);

  // Assigned to Me holds open and waiting conversations: Status, not Assigned To.
  await queue(page, 'Assigned to Me').click();
  await button.click();
  await expect(menu.getByRole('group', { name: 'Assigned To' })).toBeHidden();
  await expect(menu.getByRole('group', { name: 'Status' }).getByRole('menuitemradio')).toHaveText([
    'Any Status',
    'Open',
    'Waiting',
  ]);
  await menu.getByRole('menuitemradio', { name: 'Waiting' }).click();
  await expect(button).toHaveAccessibleName('Filter: Waiting');
  await expect(rows).toHaveCount(1);
  // Changing views clears the filters.
  await queue(page, 'Unassigned').click();
  await expect(button).toHaveAccessibleName('Filter');
});

for (const colorScheme of ['light', 'dark']) {
  test(`the Filter menu and its button in effect are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await filter(page, 'High Priority');
    await page.getByRole('button', { name: /^Filter/ }).click();
    await expectAccessible(page, '.support-list-header');
  });
}

/** A mailbox's settings, in the mailbox: its pages in the list's place, the open one beside them. */
const settingsPages = page => page.getByRole('region', { name: 'Settings', exact: true });
const settingsRow = (page, name) => settingsPages(page).getByRole('link', { name: new RegExp(`^${name}`) });
const settingsPane = page => page.locator('#support-settings-page');

/** A mailbox's commands, from its row in the sidebar (a secondary click). */
async function mailboxMenu(page, id, name) {
  await page.locator(`#support-queues details[data-scope="${id}"] > summary`).click({ button: 'right' });
  return page.getByRole('menu', { name: `${name} mailbox` });
}
async function openMailboxSettings(page, id, name) {
  await (await mailboxMenu(page, id, name)).getByRole('menuitem', { name: 'Mailbox Settings' }).click();
}

test('a mailbox’s commands are in the list’s toolbar while it’s open, and on its row in the sidebar', async ({
  page,
}) => {
  const toolbar = page.locator('.support-list-toolbar');
  // All Inboxes is no one mailbox: no mailbox menu, but New Conversation.
  await expect(toolbar.getByRole('button', { name: 'New Conversation', exact: true })).toBeVisible();
  await expect(toolbar.locator('.support-mailbox-menu')).toBeHidden();
  // In a mailbox's folder, its menu sits beside New Conversation.
  await page.locator('#support-queues details[data-scope="billing"]').evaluate(details => (details.open = true));
  await queue(page, 'Billing Open').click();
  await toolbar.getByRole('button', { name: 'More for Billing' }).click();
  const menu = page.getByRole('menu', { name: 'Billing mailbox' });
  await expect(menu.locator('[role^="menuitem"]')).toHaveText(['Mailbox Settings', 'Mute Notifications']);
  // Muted (your own notifications), its row says so: an icon, and in its name.
  await menu.getByRole('menuitemcheckbox', { name: 'Mute Notifications' }).click();
  const billing = page.locator('#support-queues details[data-scope="billing"] > summary');
  await expect(billing.locator('.support-muted')).toBeVisible();
  await expect(billing).toHaveAccessibleName(/, notifications muted$/);
  await expect(page.getByRole('status').filter({ hasText: 'Notifications for Billing are muted.' })).toBeVisible();
  // Any mailbox's row has the same commands on a secondary click, or Shift+F10 from the keyboard.
  const support = await mailboxMenu(page, 'support', 'Support');
  await expect(support.locator('[role^="menuitem"]')).toHaveText(['Mailbox Settings', 'Mute Notifications']);
  await expect(support.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#support-queues details[data-scope="support"] > summary')).toBeFocused();
  await billing.focus();
  await page.keyboard.press('Shift+F10');
  await expect(page.getByRole('menu', { name: 'Billing mailbox' }).getByRole('menuitemcheckbox')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('Escape');
  // Mailbox Settings opens its settings, in the mailbox.
  await (await mailboxMenu(page, 'feedback', 'Feedback')).getByRole('menuitem', { name: 'Mailbox Settings' }).click();
  await expect(page).toHaveURL(/#\/mailbox\/feedback\/settings$/);
});

test('a new conversation starts in the mailbox being viewed, else the one used last, chosen in the composer', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog', { name: 'New Conversation', exact: true });
  const mailbox = dialog.getByRole('combobox', { name: 'Mailbox' });
  // From All Inboxes, the first; every mailbox can be chosen, with its address.
  await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
  await expect(mailbox).toHaveValue('support');
  await expect(mailbox.locator('option')).toHaveText([
    'Support · support@forma.example',
    'Billing · billing@forma.example',
    'Feedback · feedback@forma.example',
  ]);
  await mailbox.selectOption('feedback');
  await dialog.getByLabel('Customer Name').fill('Ava Martin');
  await dialog.getByLabel('Customer Email').fill('ava@example.com');
  await dialog.getByLabel('Subject', { exact: true }).fill('A question about guest access');
  await dialog.getByLabel('Customer Message').fill('Can guests leave comments?');
  await dialog.getByRole('button', { name: 'Create Conversation' }).click();
  await expect(dialog).toBeHidden();
  // From All Inboxes again, the one used last; from a mailbox's folder, that mailbox.
  await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
  await expect(mailbox).toHaveValue('feedback');
  await dialog.getByRole('button', { name: /^Close/ }).click();
  await page.locator('#support-queues details[data-scope="billing"]').evaluate(details => (details.open = true));
  await queue(page, 'Billing Open').click();
  await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
  await expect(mailbox).toHaveValue('billing');
});

test('a mailbox’s settings open from its menu, in the mailbox: its pages listed beside the open one', async ({
  page,
}) => {
  await openMailboxSettings(page, 'billing', 'Billing');
  await expect(page).toHaveURL(/#\/mailbox\/billing\/settings$/);
  await expect(page.locator('.support-settings-toolbar')).toContainText('Billing');
  // Its pages, with their values: its own, its channels (email is one), the messages it sends by
  // itself, and its AI Assistant.
  await expect(settingsPages(page).getByRole('link')).toHaveText([
    /^General$/,
    /^Permissions.*1 person/,
    /^Email.*billing@forma\.example/,
    /^Website Chat.*On/,
    /^Telegram.*Not set up/,
    /^Greeting.*Built-in/,
    /^Auto Reply.*On/,
    /^AI Assistant.*On · Dutch/,
  ]);
  await expect(settingsPages(page).getByRole('region', { name: 'Channels' })).toBeVisible();
  await expect(settingsPages(page).getByRole('region', { name: 'Automatic Messages' })).toBeVisible();
  // General shows beside them; its row is current and takes the keyboard, in the accent.
  const general = settingsRow(page, 'General');
  await expect(general).toHaveAttribute('aria-current', 'page');
  await expect(general).toBeFocused();
  await expect(general).toHaveCSS('background-color', await tokenColor(page, '--f-accent-fill'));
  await expect(page.getByRole('heading', { name: 'General', level: 2 })).toBeVisible();
  await expect(settingsPane(page).getByLabel('Name', { exact: true })).toHaveValue('Billing');
  // Nothing in the sidebar is current while the mailbox's settings are open.
  await expect(page.locator('#support-queues [aria-current]')).toHaveCount(0);
  // Another page opens beside the list; its row keeps the keyboard, and a change shows in it at once.
  await settingsRow(page, 'Website Chat').click();
  await expect(page).toHaveURL(/#\/mailbox\/billing\/settings\/webchat$/);
  await expect(settingsRow(page, 'Website Chat')).toHaveAttribute('aria-current', 'page');
  await expect(settingsRow(page, 'Website Chat')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Website Chat', level: 2 })).toBeVisible();
  await settingsPane(page).getByRole('switch', { name: 'Enabled' }).uncheck();
  await expect(settingsRow(page, 'Website Chat')).toHaveText(/Off/);
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
  // With the keyboard elsewhere, the row stays selected without the accent.
  await expect(settingsRow(page, 'Website Chat')).toHaveCSS(
    'background-color',
    await tokenColor(page, '--f-selection-inactive'),
  );
  // The mailbox's name is its own everywhere at once.
  await settingsRow(page, 'General').click();
  await settingsPane(page).getByLabel('Name', { exact: true }).fill('Billing Team');
  await expect(page.locator('#support-queues details[data-scope="billing"] > summary')).toContainText('Billing Team');
  await expect(page.locator('.support-settings-toolbar')).toContainText('Billing Team');
  // A folder leaves the settings, and Back returns to them.
  await queue(page, 'Unassigned').first().click();
  await expect(page).toHaveURL(/\/support\.html$/);
  await expect(settingsPages(page)).toBeHidden();
  await expect(page.locator('button.support-ticket').first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/mailbox\/billing\/settings\/general$/);
  await expect(settingsPages(page)).toBeVisible();
  // Connection of earlier versions is Email's.
  await page.goto('/support.html#/mailbox/billing/settings/connection');
  await expect(page).toHaveURL(/#\/mailbox\/billing\/settings\/email$/);
});

test('email is a channel a mailbox may not have; without an address it only chats', async ({ page }) => {
  await page.goto('/support.html#/mailbox/feedback/settings/email');
  const email = settingsPane(page).getByLabel('Email Address', { exact: true });
  await expect(email).toHaveAccessibleDescription(/Optional/);
  await expect(settingsPane(page).getByRole('region', { name: 'Sending' })).toBeVisible();
  await email.fill('');
  await email.blur();
  await expect(email).not.toHaveAttribute('aria-invalid');
  // Nothing to send with, and no channel to reply on: Email's row says so, its parts step aside.
  await expect(settingsRow(page, 'Email')).toHaveText(/Not set up/);
  await expect(settingsPane(page).getByRole('region', { name: 'Sending' })).toHaveCount(0);
  await expect(settingsPane(page).getByRole('region', { name: 'Emails to Customers' })).toHaveCount(0);
  await settingsRow(page, 'Auto Reply').click();
  await expect(settingsPane(page).getByText('This mailbox has no channels yet.')).toBeVisible();
  await expect(settingsPane(page).getByLabel('Subject')).toHaveCount(0);
});

test('a mailbox’s auto reply is written once for every channel, in its languages, each channel taking it, its own or none', async ({
  page,
}) => {
  await page.goto('/support.html#/mailbox/billing/settings/auto-reply');
  const pane = settingsPane(page);
  const mailbox = pane.getByRole('region', { name: 'Mailbox Auto Reply' });
  // A row per language, showing its text on one line: which are up to date shows at a glance.
  const versions = mailbox.locator('details.settings-version > summary');
  await expect(versions).toHaveText([
    /^Default.*Thanks for writing\. We usually reply within a day\./,
    /^Dutch.*Bedankt voor je bericht/,
  ]);
  // Another language starts from Default's text, opened to be written.
  await mailbox.getByRole('button', { name: 'Add Language' }).click();
  await page.getByRole('menu', { name: 'Add Language' }).getByRole('menuitem', { name: 'German' }).click();
  await expect(mailbox.locator('#settings-auto-reply-de')).toHaveJSProperty('open', true);
  await expect(mailbox.locator('#settings-auto-reply-de > summary')).toBeFocused();
  await expect(page.locator('#settings-auto-reply-de-subject')).toHaveValue('We received your message');
  // Translate from Default replaces the others' text, after asking, for a person to check.
  await mailbox.getByRole('button', { name: 'Translate from Default' }).click();
  const translate = page.getByRole('alertdialog', { name: 'Translate Default into Dutch, German?' });
  await expect(translate.getByRole('button', { name: 'Translate' })).toBeFocused();
  await translate.getByRole('button', { name: 'Translate' }).click();
  await expect(versions.nth(2)).toHaveText(/^German.*Danke für Ihre Nachricht/);
  await expect(page.locator('#settings-auto-reply-de-subject')).toHaveValue('Wir haben Ihre Nachricht erhalten');
  await expect(page.getByRole('status').filter({ hasText: 'Translated into Dutch, German.' })).toBeVisible();
  // Removing a language asks first; Default covers it again.
  await mailbox.getByRole('button', { name: 'Remove German…' }).click();
  await page
    .getByRole('alertdialog', { name: 'Remove the German version?' })
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(versions).toHaveCount(2);
  await expect(mailbox.locator('#settings-auto-reply-default > summary')).toBeFocused();
  // Each channel the mailbox has takes the mailbox's, its own (beneath it, from Default), or none.
  await expect(pane.getByRole('region', { name: 'Telegram' })).toHaveCount(0);
  const email = pane.getByRole('region', { name: 'Email', exact: true });
  const chat = pane.getByRole('region', { name: 'Website Chat' });
  await expect(email.getByLabel('Auto Reply')).toHaveValue('mailbox');
  await expect(chat.getByLabel('Auto Reply')).toHaveValue('none');
  await email.getByLabel('Auto Reply').selectOption('own');
  await expect(email.locator('details.settings-version > summary')).toHaveText([/^Default.*Thanks for writing/]);
  await expect(email.getByLabel('Subject')).toHaveValue('We received your message');
  await chat.getByLabel('Auto Reply').selectOption('own');
  await expect(chat.getByLabel('Subject')).toHaveCount(0);
  // Off, the mailbox's versions step aside, and a channel taking it says it sends nothing for now.
  await chat.getByLabel('Auto Reply').selectOption('mailbox');
  await mailbox.getByRole('switch', { name: 'Send an Automatic Reply' }).uncheck();
  await expect(mailbox.getByRole('button', { name: 'Add Language' })).toHaveAttribute('aria-disabled', 'true');
  await expect(chat.getByLabel('Auto Reply')).toHaveAccessibleDescription(
    'Off for now: the mailbox’s auto reply is off.',
  );
  await expect(settingsRow(page, 'Auto Reply')).toHaveText(/Off/);
  // A channel's page leads to its part of the page, its choice taking the keyboard.
  await settingsRow(page, 'Email').click();
  const link = pane.getByRole('region', { name: 'Automatic Messages' }).getByRole('link', { name: /^Auto Reply/ });
  await expect(link).toHaveText(/Its Own/);
  await link.click();
  await expect(page).toHaveURL(/#\/mailbox\/billing\/settings\/auto-reply\/email$/);
  await expect(pane.getByRole('region', { name: 'Email', exact: true }).getByLabel('Auto Reply')).toBeFocused();
});

test('a greeting shows before the customer writes, on the channels that can, each taking the mailbox’s, its own or none', async ({
  page,
}) => {
  await page.goto('/support.html#/mailbox/support/settings/greeting');
  const pane = settingsPane(page);
  await expect(pane.getByRole('radio', { name: 'Built-in Greeting' })).toBeChecked();
  await expect(pane.getByRole('region', { name: 'Your Greeting' })).toHaveCount(0);
  // Only channels that show something first: Website Chat and Telegram, not Email.
  await expect(pane.locator('.settings-channel-message h3')).toHaveText(['Website Chat', 'Telegram']);
  const telegram = pane.getByRole('region', { name: 'Telegram' });
  await expect(telegram.getByLabel('Greeting')).toHaveValue('own');
  // Each says how it shows the greeting.
  await expect(pane.getByRole('region', { name: 'Website Chat' }).locator('.f-form-section__footer')).toHaveText(
    'Shown when a visitor opens the chat.',
  );
  await expect(telegram.locator('.f-form-section__footer')).toHaveText(
    'Sent when the customer taps Start, and shown in the empty chat.',
  );
  await expect(telegram.locator('details.settings-version > summary')).toHaveText([/^Default.*This is Forma Support/]);
  // The mailbox's own greeting, in languages, plain text with variables.
  await pane.getByRole('radio', { name: 'Your Own Greeting' }).check();
  const own = pane.getByRole('region', { name: 'Your Greeting' });
  await expect(own.locator('details.settings-version > summary')).toHaveText([/^Default.*How can we help\?/]);
  await expect(own.getByRole('textbox', { name: 'Message' })).toHaveAccessibleDescription(/Plain text/);
  await expect(settingsRow(page, 'Greeting')).toHaveText(/Your Own/);
  // No greeting: a channel taking the mailbox's shows none for now.
  await pane.getByRole('radio', { name: 'No Greeting' }).check();
  await expect(pane.getByRole('region', { name: 'Website Chat' }).getByLabel('Greeting')).toHaveAccessibleDescription(
    'Off for now: the mailbox has no greeting.',
  );
  // A mailbox whose channels can't greet says which can.
  await page.goto('/support.html#/mailbox/feedback/settings/greeting');
  await expect(pane.getByText('None of this mailbox’s channels can greet.')).toBeVisible();
});

test('a mailbox’s settings start at their panes’ edges, as settings do, at a readable width', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/support.html#/mailbox/support/settings/email');
  const start = async pane => {
    const box = await pane.boundingBox();
    const section = await pane.locator('.f-form-section').first().boundingBox();
    return { offset: Math.round(section.x - box.x), width: section.width, room: box.width };
  };
  const list = await start(settingsPages(page));
  const open = await start(settingsPane(page));
  // Not centered in the room the wide window leaves: from the edge, as the list beside it.
  expect(open.room - open.width).toBeGreaterThan(100);
  expect(open.offset).toBe(list.offset);
  expect(open.offset).toBeLessThan(40);
  expect(open.width).toBeLessThanOrEqual(641);
});

test('on a phone a mailbox’s settings show its pages, then the page, with a way back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/support.html#/mailbox/billing/settings');
  await expect(settingsPages(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'General', level: 2 })).toBeHidden();
  await settingsRow(page, 'Permissions').click();
  await expect(settingsPages(page)).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Permissions', level: 2 })).toBeFocused();
  await page.getByRole('button', { name: 'Back to mailbox settings' }).click();
  await expect(settingsRow(page, 'Permissions')).toBeFocused();
  await expectNoOverflow(page, '#support');
});

test('a mailbox’s color comes from the named accents, and its sidebar icon shows it at once', async ({ page }) => {
  await page.goto('/support.html#/mailbox/support/settings');
  const group = settingsPane(page).getByRole('radiogroup', { name: 'Color' });
  await expect(group.getByRole('radio')).toHaveCount(8);
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked();
  await group.getByRole('radio', { name: 'Green' }).check();
  await expect(page.locator('#support-queues details[data-scope="support"] > summary')).toHaveAttribute(
    'data-fruit-mark',
    'green',
  );
});

test('a mailbox’s signature and automatic reply are written in Markdown and shown as sent', async ({ page }) => {
  await page.goto('/support.html#/mailbox/support/settings/email');
  const mailbox = settingsPane(page);
  const signature = mailbox.getByRole('textbox', { name: 'Signature' });
  // The field shows the Markdown as written, its syntax styled; its textarea holds it for the form.
  const signatureValue = page.locator('#settings-signature');
  await expect(signatureValue).toHaveValue('Thanks,\n**The Forma team**\n[forma.example](https://forma.example)');
  await expect(signature.locator('.f-editor__strong:not(.f-editor__syntax)')).toHaveText('The Forma team');
  const sent = mailbox.getByRole('figure', { name: 'Signature as Sent' });
  await expect(sent.locator('strong')).toHaveText('The Forma team');
  await expect(sent.getByRole('link', { name: 'forma.example' })).toHaveAttribute('href', 'https://forma.example');
  // The toolbar writes Markdown around the selection, and the preview follows.
  await selectMarkdown(signature, { text: 'Thanks' });
  await mailbox.getByRole('button', { name: 'Italic', exact: true }).click();
  await expect(signatureValue).toHaveValue(/^\*Thanks\*,/);
  await expect(sent.locator('em')).toHaveText('Thanks');
  // Raw HTML shows as text, and only web and mail addresses become links.
  await signature.fill('<b>Hi</b> [there](javascript:alert(1))');
  await expect(sent.locator('.settings-preview__body')).toHaveText('<b>Hi</b> there');
  await expect(sent.getByRole('link')).toHaveCount(0);

  // An automatic reply's variables are inserted as written, for the server to fill in.
  await page.goto('/support.html#/mailbox/billing/settings/auto-reply');
  const reply = settingsPane(page).locator('#settings-auto-reply-default');
  await reply.locator(':scope > summary').click();
  const message = reply.getByRole('textbox', { name: 'Message' });
  await selectMarkdown(message, { at: -1 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('Best, ');
  await reply.getByRole('button', { name: 'Insert Variable' }).click();
  await page.getByRole('menuitem', { name: 'Mailbox Name' }).click();
  await expect(page.locator('#settings-auto-reply-default-message')).toHaveValue(/\nBest, \{%mailbox\.name%\}$/);
  await expect(reply.getByRole('figure', { name: 'Message as Sent' })).toContainText('Best, {%mailbox.name%}');
  // Off, the message, its toolbar and its preview step aside.
  await settingsPane(page).getByRole('switch', { name: 'Send an Automatic Reply' }).uncheck();
  await expect(message).toBeDisabled();
  await expect(reply.getByRole('button', { name: 'Bold', exact: true })).toBeDisabled();
  // It takes no content, so the application's Insert Variable steps aside with the toolbar.
  await expect(reply.locator('.f-editor__toolbar')).toHaveJSProperty('inert', true);
  await expect(reply.getByRole('figure', { name: 'Message as Sent' })).toBeHidden();
  await expect(settingsRow(page, 'Auto Reply')).toHaveText(/Off/);
});

test('a mailbox’s AI Assistant is one of its pages, its row saying what’s on', async ({ page }) => {
  await page.goto('/support.html#/mailbox/billing/settings');
  await expect(settingsRow(page, 'AI Assistant')).toHaveText(/On · Dutch/);
  await settingsRow(page, 'AI Assistant').click();
  const ai = settingsPane(page);
  await expect(page.getByRole('heading', { name: 'AI Assistant', level: 2 })).toBeVisible();
  // Settings that only matter while a feature is on stay in view, disabled, and say why.
  const mark = ai.getByRole('checkbox', { name: 'Mark Translated Replies' });
  await expect(mark).toBeEnabled();
  await ai.getByRole('switch', { name: 'Translate Chats' }).uncheck();
  await expect(mark).toBeDisabled();
  const url = ai.getByLabel('URL', { exact: true });
  await expect(url).toBeEnabled();
  await ai.getByRole('switch', { name: 'Drafts' }).uncheck();
  await expect(url).toBeDisabled();
  await expect(ai.getByRole('region', { name: 'Customer Context' })).toContainText('Turn on Drafts to use it.');
  await ai.getByRole('switch', { name: 'Drafts' }).check();
  // The test asks for an email first, then shows the answer.
  const test = ai.getByRole('button', { name: 'Test', exact: true });
  await test.click();
  expect(await page.locator('#settings-ai-test').evaluate(input => input.validationMessage)).toBe(
    'Enter a customer’s email address.',
  );
  await ai.getByLabel('Test', { exact: true }).fill('sophie@example.com');
  await test.click();
  await expect(ai.getByRole('status', { name: 'Test result' })).toContainText('"name": "Sophie Chen"');
  // Default names the installation's language.
  await expect(page.getByRole('option', { name: 'Default (English)' })).toBeAttached();
  // With every feature off, its row says so.
  for (const name of ['Summaries', 'Translations', 'Drafts']) await ai.getByRole('switch', { name }).uncheck();
  await expect(settingsRow(page, 'AI Assistant')).toHaveText(/Off/);
});

for (const colorScheme of ['light', 'dark']) {
  test(`every page of a mailbox’s settings is accessible and fits in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const name of [
      '',
      '/general',
      '/permissions',
      '/email',
      '/webchat',
      '/telegram',
      '/greeting',
      '/auto-reply',
      '/ai',
    ]) {
      await page.goto(`/support.html#/mailbox/support/settings${name}`);
      await expect(settingsPane(page).locator('.settings-sections').first()).toBeVisible();
      await expectAccessible(page, '#support');
    }
    // A language version open, a channel's own, and Add Language's menu open.
    await page.goto('/support.html#/mailbox/billing/settings/auto-reply');
    await settingsPane(page).locator('#settings-auto-reply-nl > summary').click();
    await settingsPane(page).getByRole('region', { name: 'Website Chat' }).getByLabel('Auto Reply').selectOption('own');
    await settingsPane(page)
      .getByRole('region', { name: 'Mailbox Auto Reply' })
      .getByRole('button', { name: 'Add Language' })
      .click();
    await expectAccessible(page, '#support');
    await page.keyboard.press('Escape');
    // The open page's row in the accent while the list has focus, and the mailbox's menu open.
    await settingsRow(page, 'AI Assistant').focus();
    await expectAccessible(page, '#support');
    await mailboxMenu(page, 'support', 'Support');
    await expectAccessible(page, '#support');
    await page.keyboard.press('Escape');
    await page.goto('/support.html');
    await page.locator('#support-queues details[data-scope="support"]').evaluate(details => (details.open = true));
    await queue(page, 'Support Open').click();
    await page.locator('.support-list-toolbar').getByRole('button', { name: 'More for Support' }).click();
    await expectAccessible(page, '#support');
    await page.keyboard.press('Escape');
    for (const width of [800, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await expectNoOverflow(page, '#support');
    }
  });
}

test('who else has a conversation open shows in its row and heading; who writes a reply, above the composer', async ({
  page,
}) => {
  const row = id => page.locator(`button.support-ticket[data-ticket-id="${id}"] .support-presence`);
  // Open only: quiet, in the secondary colour, with an eye.
  await expect(row(1042)).toHaveText('Mia is viewing');
  await expect(row(1042)).not.toHaveAttribute('data-replying');
  await expect(row(1042)).toHaveCSS('color', await tokenColor(page, '--f-secondary'));
  // Typing a reply: in the accent, first.
  await expect(row(1041)).toHaveText('Noah is replying · Mia is viewing');
  await expect(row(1041)).toHaveCSS('color', await tokenColor(page, '--f-accent-text'));
  // The open conversation's heading names them; nobody writing, the line above the composer is empty
  // and takes no room, but stays a status region.
  const heading = page.locator('.support-presence-line');
  const typing = page.locator('.support-reply-typing').first();
  await expect(heading).toHaveText(/Mia Patel is viewing$/);
  await expect(typing).toHaveRole('status');
  await expect(typing).toHaveText('');
  expect((await typing.boundingBox()).height).toBe(0);
  await page.locator('button.support-ticket[data-ticket-id="1041"]').click();
  await expect(heading).toHaveText(/Noah Williams is replying, Mia Patel is viewing$/);
  await expect(typing).toHaveText('Noah Williams is writing a reply');
  expect((await typing.boundingBox()).height).toBeGreaterThan(10);
  // A chat's composer is always open, so it says nothing: Noah only has Lena's chat open.
  await queue(page, 'Waiting').first().click();
  await expect(row(1036)).toHaveText('Noah is viewing');
  await page.locator('button.support-ticket[data-ticket-id="1036"]').click();
  await expect(heading).toHaveText(/Noah Williams is viewing$/);
  await expect(page.locator('.support-chat-history ~ .support-reply-typing')).toHaveText('');
});

test('an AI draft already in a chat’s field shows its details above it until it is sent or dismissed', async ({
  page,
}) => {
  const open = async () => {
    await queue(page, 'Waiting').first().click();
    await ticket(page, 1036).click();
  };
  await open();
  const composer = page.locator('.support-chat-composer');
  const field = composer.getByRole('textbox', { name: 'Message Lena Wilson' });
  const card = composer.getByRole('region', { name: 'AI Draft' });
  await expect(field).toHaveValue(/^You’re welcome, Lena!/);
  // Its confidence, notes and sources; the draft itself is in the field.
  await expect(card.locator('.f-suggestion__meta')).toHaveText('English · Medium confidence');
  await expect(card.locator('.f-suggestion__body')).toHaveCount(0);
  await expect(card.getByRole('heading', { name: 'Notes' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Inviting guests to a project' })).toHaveAttribute(
    'href',
    'https://forma.example/help/guests',
  );
  // In the composer, above the field and as wide, and quieter than the draft.
  const [cardBox, fieldBox] = [await card.boundingBox(), await composer.locator('.f-composer__field').boundingBox()];
  expect(cardBox.x).toBeCloseTo(fieldBox.x, 0);
  expect(cardBox.width).toBeCloseTo(fieldBox.width, 0);
  expect(cardBox.y + cardBox.height).toBeLessThan(fieldBox.y);
  expect(Number.parseFloat(await card.evaluate(element => getComputedStyle(element).fontSize))).toBeLessThan(
    Number.parseFloat(await field.evaluate(element => getComputedStyle(element).fontSize)),
  );
  // Their first lines, so the conversation stays in view; Tabbing to a source the clamp hides shows the rest.
  const more = card.locator('.f-more');
  const lines = await more
    .locator('.f-more__content')
    .evaluate(element => element.clientHeight / parseFloat(getComputedStyle(element).lineHeight));
  expect(lines).toBeCloseTo(4, 1);
  await expect(card.getByRole('button', { name: 'Show More' })).toHaveAttribute('aria-expanded', 'false');
  await card.getByRole('link', { name: 'Roles in a project' }).focus();
  await expect(card.getByRole('button', { name: 'Show Less' })).toHaveAttribute('aria-expanded', 'true');
  expect(await more.locator('.f-more__content').evaluate(element => element.scrollTop)).toBe(0);
  await card.getByRole('button', { name: 'Show Less' }).click();
  await expect(card.getByRole('button', { name: 'Show More' })).toBeFocused();
  // An internal note isn't the draft: its details wait.
  const note = composer.getByRole('button', { name: 'Internal Note' });
  await note.click();
  await expect(card).toBeHidden();
  await note.click();
  await expect(card).toBeVisible();
  // Dismissed, the draft stays in the field, which takes focus.
  await card.getByRole('button', { name: 'Dismiss Draft Details' }).click();
  await expect(card).toBeHidden();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue(/^You’re welcome, Lena!/);
  // Sent, the details go with it.
  await page.goto('/support.html');
  await open();
  await expect(card).toBeVisible();
  await field.press('Enter');
  await expect(page.getByRole('list', { name: 'Messages' }).locator(':scope > li').last()).toContainText(
    'You’re welcome, Lena!',
  );
  await expect(card).toBeHidden();
  await expect(field).toHaveValue('');
});

for (const colorScheme of ['light', 'dark']) {
  test(`who else has a conversation open is accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.locator('button.support-ticket[data-ticket-id="1041"]').click();
    await expect(page.locator('.support-reply-typing').first()).toHaveText('Noah Williams is writing a reply');
    await expectAccessible(page, '#support');
    await queue(page, 'Waiting').first().click();
    await page.locator('button.support-ticket[data-ticket-id="1036"]').click();
    await expectAccessible(page, '#support');
  });
}
