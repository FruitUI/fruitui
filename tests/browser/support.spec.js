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
  const search = page.getByRole('searchbox', { name: 'Search conversations' });
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
  const reply = page.getByRole('textbox', { name: 'Reply message', exact: true });
  await reply.fill('Hi Sophie, your projects will stay in place.');
  await page.getByRole('radio', { name: 'Note', exact: true }).check();
  await expect(page.getByRole('textbox', { name: 'Internal note', exact: true })).toHaveValue('');
  await page
    .getByRole('textbox', { name: 'Internal note', exact: true })
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
  await expect(page.getByRole('region', { name: 'Internal note', exact: true }).last()).toContainText(
    'Private handoff: Mia will handle annual billing.',
  );
  await expect(page.getByRole('region', { name: 'Internal note', exact: true }).last()).toContainText('Only your team');
  await expect(page.getByLabel('Conversation status')).toHaveValue('open');
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  await page.getByRole('radio', { name: 'Reply', exact: true }).check();
  await expect(reply).toHaveValue('Hi Sophie, your projects will stay in place.');
  await page.getByRole('button', { name: 'Send reply', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Agent reply', exact: true })).toContainText(
    'Hi Sophie, your projects will stay in place.',
  );
  await expect(page.getByRole('region', { name: 'Agent reply', exact: true })).not.toContainText('Private handoff');
  await expect(reply).toHaveValue('');
  await ticket(page, 1040).click();
  await expect(reply).toHaveValue('A separate reply for Emma.');
});

test('assignment, closing, waiting, and reopening update the actual queues', async ({ page }) => {
  await queue(page, 'Unassigned').click();
  await expect(page.locator('button.support-ticket')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Assigned to', exact: true }).fill('Alex');
  await page.getByRole('combobox', { name: 'Assigned to', exact: true }).press('Enter');
  await expect(page.locator('button.support-ticket')).toHaveCount(1);
  await expect(queue(page, 'Assigned to me')).toContainText('4');
  await queue(page, 'Assigned to me').click();
  await ticket(page, 1041).click();
  await expect(page.locator('#support-assignee')).toHaveValue('alex');
  await page.getByRole('button', { name: 'Close conversation', exact: true }).click();
  await expect(queue(page, 'Closed')).toContainText('2');
  await queue(page, 'Closed').click();
  await ticket(page, 1041).click();
  await page.getByRole('textbox', { name: 'Reply message', exact: true }).fill('We have updated your SSO domain.');
  await page.getByRole('button', { name: 'Reopen & reply', exact: true }).click();
  await expect(page.getByLabel('Conversation status')).toHaveValue('open');
  await expect(ticket(page, 1041)).toHaveAttribute('aria-current', 'true');
  await expect(queue(page, 'Closed')).toContainText('1');
  await page.getByLabel('Conversation status').selectOption('waiting');
  await expect(queue(page, 'Waiting')).toContainText('3');
  await queue(page, 'Waiting').click();
  await ticket(page, 1041).click();
  await expect(page.getByLabel('Conversation status')).toHaveValue('waiting');
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
  await expect(page.getByLabel('Conversation status')).toHaveValue('closed');
  await expect(page.locator('.support-customer-profile')).toContainText('Sophie Chen');
  await expect(page.getByRole('button', { name: /A little help with our team plan/ }).last()).toBeVisible();
});

test('new conversations retain native validation and create an unassigned ticket', async ({ page }) => {
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New conversation', exact: true });
  await expect(dialog.getByLabel('Customer name')).toBeFocused();
  await dialog.getByRole('button', { name: 'Create conversation' }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.getByLabel('Customer name').evaluate(element => element.validity.valueMissing)).toBe(true);
  await dialog.getByLabel('Customer name').fill('Ava Martin');
  await dialog.getByLabel('Customer email').fill('invalid');
  await dialog.getByLabel('Subject', { exact: true }).fill('A question about guest access');
  await dialog.getByLabel('Customer message').fill('Can guests leave comments?');
  await dialog.getByRole('button', { name: 'Create conversation' }).click();
  expect(await dialog.getByLabel('Customer email').evaluate(element => element.validity.typeMismatch)).toBe(true);
  await dialog.getByLabel('Customer email').fill('ava@example.com');
  await dialog.getByLabel('Customer message').fill('   ');
  await dialog.getByRole('button', { name: 'Create conversation' }).click();
  await expect(dialog).toContainText('Complete each field');
  await dialog.getByLabel('Customer message').fill('Can guests leave comments?');
  await dialog.getByRole('button', { name: 'Create conversation' }).click();
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
  await page.getByRole('searchbox', { name: 'Search conversations' }).fill('nothing-matches');
  await expect(page.getByRole('heading', { name: 'No conversations', exact: true })).toBeVisible();
  await expect(page.locator('button.support-ticket')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('button.support-ticket')).toHaveCount(6);
  await expect(page.getByRole('searchbox', { name: 'Search conversations' })).toBeFocused();
});

test('phone and tablet screens share drafts, assignment, and focus with desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.support-conversation')).not.toBeVisible();
  await ticket(page, 1042).click();
  await expect(page.locator('#ticket-title')).toBeFocused();
  await page.getByRole('textbox', { name: 'Reply message', exact: true }).fill('Draft across all layouts.');
  await page.getByRole('button', { name: 'Show customer details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Back to conversation', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: 'Assigned to', exact: true }).fill('Mia');
  await page.getByRole('combobox', { name: 'Assigned to', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Back to conversation', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Reply message', exact: true })).toHaveValue(
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
  await expect(page.getByRole('textbox', { name: 'Reply message', exact: true })).toHaveValue(
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
    page.getByLabel('Conversation status'),
    page.getByRole('button', { name: 'Show customer details' }),
    page.getByRole('button', { name: 'Send reply', exact: true }),
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
    await page.getByRole('button', { name: 'New conversation', exact: true }).click();
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
function queue(page, name) {
  return page
    .getByRole('navigation', { name: 'Support views', exact: true })
    .getByRole('button', { name: new RegExp(`^${name === 'Open' ? 'All Inboxes' : name}`) });
}
