import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

const pageErrors = new WeakMap();
test.beforeEach(({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test('Mail combines real accounts and scopes search, unread counts, flags, and moves', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('button.f-mail__message');
  const nav = page.locator('#mailboxes');
  await expect(rows).toHaveCount(8);
  await expect(rows.locator('.f-mail__origin')).toHaveText([
    'Work',
    'Work',
    'Personal',
    'Personal',
    'Personal',
    'Work',
    'Work',
    'Personal',
  ]);
  await expect(nav.getByRole('button', { name: 'All Inboxes', exact: true }).locator('.f-badge')).toHaveText('3');
  await expand(page, '#mailboxes', 'work');
  await nav.getByRole('button', { name: 'Work Inbox', exact: true }).click();
  await expect(rows).toHaveCount(4);
  await expect(nav.getByRole('button', { name: 'Work Inbox', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('searchbox', { name: 'Search messages' }).fill('mountains');
  await expect(rows).toHaveCount(0);
  await nav.getByRole('button', { name: 'All Inboxes', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search messages' })).toHaveValue('');
  await mailRow(page, 2).click();
  await expect(nav.getByRole('button', { name: 'Work Inbox', exact: true }).locator('.f-badge')).toHaveText('1');
  await expect(nav.getByRole('button', { name: 'All Inboxes', exact: true }).locator('.f-badge')).toHaveText('2');
  await page.getByRole('button', { name: 'Flag message', exact: true }).click();
  await page.getByRole('button', { name: 'Archive message', exact: true }).click();
  await nav.getByRole('button', { name: 'Work Archive', exact: true }).click();
  await expect(mailRow(page, 2)).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expand(page, '#mailboxes', 'personal');
  await nav.getByRole('button', { name: 'Personal Archive', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(mailRow(page, 2)).toHaveCount(0);
  await nav.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(rows).toHaveCount(3);
  await nav.getByRole('button', { name: 'Flagged', exact: true }).click();
  await expect(rows).toHaveCount(2);
  await expect(mailRow(page, 2)).toBeVisible();
});

test('Mail replies use the source account and new mail is filed under the chosen From account', async ({ page }) => {
  await page.goto('/');
  await mailRow(page, 4).click();
  await page.getByRole('button', { name: 'Reply to message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New Message' });
  await expect(dialog.getByLabel('From', { exact: true })).toHaveValue('personal');
  await expect(dialog.getByLabel('To', { exact: true })).toHaveValue('maya@example.com');
  await dialog.getByLabel('Message', { exact: true }).fill('Looking forward to the mountains.');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expand(page, '#mailboxes', 'work');
  await page.locator('#mailboxes').getByRole('button', { name: 'Work Sent', exact: true }).click();
  await expect(page.locator('button.f-mail__message')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Looking forward to the mountains/ })).toHaveCount(0);
  await expand(page, '#mailboxes', 'personal');
  await page.locator('#mailboxes').getByRole('button', { name: 'Personal Sent', exact: true }).click();
  await expect(page.locator('button.f-mail__message')).toHaveCount(2);
  await mailRow(page, 14).click();
  await expect(page.locator('.f-mail__account-detail')).toHaveText('Personal · alex@example.com');
  await page.getByRole('button', { name: 'Compose message', exact: true }).click();
  await expect(dialog.getByLabel('From', { exact: true })).toHaveValue('personal');
  await dialog.getByLabel('From', { exact: true }).selectOption('work');
  await dialog.getByLabel('To', { exact: true }).fill('team@example.com');
  await dialog.getByLabel('Subject', { exact: true }).fill('A work message');
  await dialog.getByLabel('Message', { exact: true }).fill('Sending from my work account.');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('button.f-mail__message')).toHaveCount(2);
  await page.locator('#mailboxes').getByRole('button', { name: 'Sent', exact: true }).click();
  await expect(page.locator('button.f-mail__message')).toHaveCount(4);
  await mailRow(page, 15).click();
  await expect(page.locator('.f-mail__account-detail')).toHaveText('Work · alex@studio.example');
});

test('Mail account scope survives medium, phone, and desktop layouts and mark-all-read stays scoped', async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await page.goto('/');
  await page.getByLabel('Mailbox', { exact: true }).selectOption('personal:inbox');
  await expect(page.locator('button.f-mail__message')).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.f-mail__large-title')).toHaveText('Personal Inbox');
  await page.getByLabel('Mailbox options', { exact: true }).click();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await page.getByRole('button', { name: 'Show mailboxes' }).click();
  await expect(page.locator('#mailboxes [data-scope="personal"]')).toHaveAttribute('open', '');
  await expect(
    page.locator('#mailboxes').getByRole('button', { name: 'Personal Inbox', exact: true }).locator('.f-badge'),
  ).toHaveText('0');
  await expect(
    page.locator('#mailboxes').getByRole('button', { name: 'All Inboxes', exact: true }).locator('.f-badge'),
  ).toHaveText('2');
  await page.locator('#mailboxes').getByRole('button', { name: 'Personal Inbox', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(page.locator('.f-mail__title h1')).toHaveText('Personal Inbox');
  await expect(page.locator('button.f-mail__message')).toHaveCount(4);
  expect(await page.locator('#mail').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('Support combines team mailboxes while local views, searches, and status counts stay scoped', async ({ page }) => {
  await page.goto('/support.html');
  const rows = page.locator('button.support-ticket');
  const nav = page.locator('#support-queues');
  await expect(rows).toHaveCount(6);
  await expect(rows.locator('.support-ticket-origin')).toHaveText([
    'Billing',
    'Support',
    'Support',
    'Support',
    'Feedback',
    'Feedback',
  ]);
  await expand(page, '#support-queues', 'billing');
  await nav.getByRole('button', { name: 'Billing Open' }).click();
  await expect(rows).toHaveCount(1);
  await expect(page.locator('.support-mailbox-detail')).toContainText('billing@forma.example');
  await page.getByRole('searchbox', { name: 'Search conversations' }).fill('sso');
  await expect(rows).toHaveCount(0);
  await nav.getByRole('button', { name: /^All Inboxes/ }).click();
  await expect(rows).toHaveCount(6);
  await expand(page, '#support-queues', 'support');
  await nav.getByRole('button', { name: 'Support Open', exact: true }).click();
  await expect(rows).toHaveCount(3);
  await page.getByRole('button', { name: 'Show priority conversations' }).click();
  await expect(rows).toHaveCount(2);
  await page.getByLabel('Conversation status').selectOption('waiting');
  await expect(nav.getByRole('button', { name: 'Support Waiting', exact: true })).toContainText('2');
  await expect(nav.getByRole('button', { name: /^Waiting/ })).toContainText('3');
  await nav.getByRole('button', { name: 'Billing Waiting', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(supportRow(page, 1041)).toHaveCount(0);
  await nav.getByRole('button', { name: /^Waiting/ }).click();
  await expect(rows).toHaveCount(3);
  await expect(supportRow(page, 1041)).toBeVisible();
});

test('Support preserves drafts across mailboxes and replies and new conversations keep their real mailbox', async ({
  page,
}) => {
  await page.goto('/support.html');
  const nav = page.locator('#support-queues');
  const reply = page.getByRole('textbox', { name: 'Reply message', exact: true });
  await reply.fill('A billing reply for Sophie.');
  await expand(page, '#support-queues', 'support');
  await nav.getByRole('button', { name: 'Support Open', exact: true }).click();
  await expect(reply).toHaveValue('');
  await reply.fill('A support reply for Jordan.');
  await expand(page, '#support-queues', 'billing');
  await nav.getByRole('button', { name: 'Billing Open', exact: true }).click();
  await expect(reply).toHaveValue('A billing reply for Sophie.');
  await expect(page.locator('#support-reply-help')).toHaveText('From billing@forma.example');
  await page.getByRole('button', { name: 'Send reply', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Agent reply', exact: true }).last()).toContainText(
    'A billing reply for Sophie.',
  );
  await nav.getByRole('button', { name: 'Support Open', exact: true }).click();
  await expect(reply).toHaveValue('A support reply for Jordan.');
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New conversation' });
  await expect(dialog.getByLabel('Mailbox', { exact: true })).toHaveValue('support');
  await dialog.getByLabel('Mailbox', { exact: true }).selectOption('feedback');
  await dialog.getByLabel('Customer name').fill('Casey Cooper');
  await dialog.getByLabel('Customer email').fill('casey@example.com');
  await dialog.getByLabel('Subject').fill('An idea for your app');
  await dialog.getByLabel('Customer message').fill('Could we save our favorite views?');
  await dialog.getByRole('button', { name: 'Create conversation' }).click();
  await expect(supportRow(page, 1043)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.support-list-footer')).toContainText('feedback@forma.example');
  await expect(page.locator('button.support-ticket')).toHaveCount(3);
  await expect(nav.getByRole('button', { name: 'Feedback Open', exact: true })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: 'Billing Open', exact: true }).click();
  await expect(supportRow(page, 1043)).toHaveCount(0);
  await nav.getByRole('button', { name: /^All Inboxes/ }).click();
  await expect(page.locator('button.support-ticket')).toHaveCount(7);
  await expect(supportRow(page, 1043)).toBeVisible();
});

test('Support customer history can cross mailboxes and responsive navigation follows the selected scope', async ({
  page,
}) => {
  await page.goto('/support.html');
  await expand(page, '#support-queues', 'support');
  await page.locator('#support-queues').getByRole('button', { name: 'Support Waiting', exact: true }).click();
  await page
    .locator('.support-customer')
    .getByRole('button', { name: /A small idea for project templates/ })
    .click();
  await expect(supportRow(page, 1034)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.support-list-footer')).toContainText('feedback@forma.example');
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await expect(
    page.locator('#support-queues').getByRole('button', { name: 'Feedback Open', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.getByRole('textbox', { name: 'Reply message', exact: true }).fill('A draft about templates.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
  await page.getByRole('button', { name: 'Show support views', exact: true }).click();
  const selected = page.locator('#support-queues').getByRole('button', { name: 'Feedback Open', exact: true });
  await expect(selected).toBeFocused();
  await selected.click();
  await supportRow(page, 1034).click();
  await page.setViewportSize({ width: 820, height: 1100 });
  await expect(page.getByRole('textbox', { name: 'Reply message', exact: true })).toHaveValue(
    'A draft about templates.',
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(page.locator('.support-list-footer')).toContainText('feedback@forma.example');
});

for (const appearance of ['light', 'dark']) {
  test(`expanded navigation and scoped lists remain accessible in ${appearance} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: appearance });
    for (const [url, nav, scope, label] of [
      ['/', '#mailboxes', 'personal', 'Personal Inbox'],
      ['/support.html', '#support-queues', 'billing', 'Billing Open'],
    ]) {
      await page.goto(url);
      await expand(page, nav, scope);
      await page.locator(nav).getByRole('button', { name: label, exact: true }).click();
      await expectAccessible(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('grouped navigation uses native keyboard disclosure and automatic themes without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/components.html');
    const nav = page.getByRole('navigation', { name: 'Reference interfaces', exact: true });
    const summary = nav.locator('summary');
    await summary.focus();
    await page.keyboard.press('Space');
    await expect(nav.getByRole('link', { name: 'Mail', exact: true })).toBeVisible();
    for (const appearance of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: appearance });
      await expect(page.locator('html')).toHaveCSS('color-scheme', appearance);
      await expect(nav.getByRole('link', { name: 'Support', exact: true })).toBeVisible();
    }
    await page.keyboard.press('Space');
    await expect(nav.getByRole('link', { name: 'Mail', exact: true })).not.toBeVisible();
  } finally {
    await context.close();
  }
});

async function expand(page, nav, scope) {
  const group = page.locator(`${nav} [data-scope="${scope}"]`);
  if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
}
function mailRow(page, id) {
  return page.locator(`button.f-mail__message[data-message-id="${id}"]`);
}
function supportRow(page, id) {
  return page.locator(`button.support-ticket[data-ticket-id="${id}"]`);
}
