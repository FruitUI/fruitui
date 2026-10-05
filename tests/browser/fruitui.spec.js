import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.f-mail__message')).toHaveCount(8);
});

test('search, unread filter, and reading a message update the inbox', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search Messages' }).fill('mountains');
  await expect(page.locator('.f-mail__message')).toHaveCount(1);
  await page.getByRole('searchbox').fill('nothingmatches');
  await expect(page.getByRole('heading', { name: 'No Messages', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Show unread messages' }).click();
  await expect(page.locator('.f-mail__message')).toHaveCount(3);
  await page.getByRole('button', { name: /Oliver Park/ }).click();
  await expect(page.getByRole('heading', { name: 'Friday’s design review' })).toBeVisible();
  await expect(page.locator('.f-mail__message')).toHaveCount(2);
});

test('flagging and moving messages change the correct mailbox', async ({ page }) => {
  await page.getByRole('button', { name: 'Flag message', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Flag message', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page
    .locator('#mailboxes')
    .getByRole('button', { name: /Flagged/ })
    .click();
  await expect(page.locator('.f-mail__message')).toHaveCount(2);
  await page.getByRole('button', { name: 'Archive message' }).click();
  await page.locator('#mailboxes').getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('button', { name: /Sophie Chen/ })).toBeVisible();
  await page.getByRole('button', { name: 'Delete message' }).click();
  await page.locator('#mailboxes').getByRole('button', { name: 'Trash', exact: true }).click();
  await expect(page.getByRole('button', { name: /Sophie Chen/ })).toBeVisible();
});

test('compose keeps native validation and adds the demo message to Sent', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'Compose message' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'New Message' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'To', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'To', exact: true }).fill('team@example.com');
  await dialog.getByRole('textbox', { name: 'Subject' }).fill('Hello FruitUI');
  await dialog
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('One.\n\nTwo.\n\nThree.\n\nFour.\n\nFive.\n\nSix.');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.locator('#mailboxes').getByRole('button', { name: 'Sent', exact: true }).click();
  await page.getByRole('button', { name: /Hello FruitUI/ }).click();
  await expect(page.getByRole('heading', { name: 'Hello FruitUI' })).toBeVisible();
  await expect(page.locator('.f-mail__body')).toContainText('Six.');
});

test('keyboard navigation and dialog Escape dismissal work', async ({ page }) => {
  await page.locator('.f-mail__message').first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: /Oliver Park/ })).toBeFocused();
  await page.getByRole('button', { name: 'Compose message' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('mobile navigation opens a message and returns to the list', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.f-mail__reader')).not.toBeVisible();
  await page.getByRole('button', { name: /Sophie Chen/ }).click();
  await expect(page.locator('.f-mail__reader')).toBeVisible();
  await page.getByRole('button', { name: 'Back to messages' }).click();
  await expect(page.locator('.f-mail__list-pane')).toBeVisible();
  await page.getByRole('button', { name: 'Show mailboxes' }).click();
  await expect(page.locator('#mailboxes')).toBeVisible();
  await page
    .locator('#mailboxes')
    .getByRole('button', { name: /Drafts/ })
    .click();
  await expect(page.locator('.f-mail__message')).toHaveCount(1);
  await expect(page.locator('#mailboxes')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('phone preview uses the same mailbox and reader state as desktop', async ({ page }) => {
  await page.getByRole('button', { name: /Maya Rodriguez/ }).click();
  await page.getByRole('radio', { name: 'Phone', exact: true }).check();
  await expect(page.locator('.f-mail__mobile-header')).toBeVisible();
  await expect(page.locator('.f-mail__toolbar')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Re: A weekend in the mountains' })).toBeVisible();
  await page.getByRole('button', { name: 'Flag message', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Flag message', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('radio', { name: 'Responsive', exact: true }).check();
  await expect(page.locator('.f-mail__toolbar')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Re: A weekend in the mountains' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Flag message', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Re: A weekend in the mountains' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete message', exact: true }).click();
  await expect(page.locator('.f-mail__message')).toHaveCount(7);
  await page.getByRole('button', { name: 'Show mailboxes' }).click();
  await page.locator('#mailboxes').getByRole('button', { name: 'Trash', exact: true }).click();
  await page.getByRole('button', { name: /Maya Rodriguez/ }).click();
  await expect(page.getByRole('heading', { name: 'Re: A weekend in the mountains' })).toBeVisible();
});

test('phone search, unread filtering, message navigation, and compose work', async ({ page }) => {
  await page.getByRole('radio', { name: 'Phone', exact: true }).check();
  await page.getByRole('searchbox', { name: 'Search Messages' }).fill('mountains');
  await expect(page.locator('.f-mail__message')).toHaveCount(1);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Show unread messages', exact: true }).click();
  await expect(page.locator('.f-mail__message')).toHaveCount(3);
  await page.getByRole('button', { name: 'Show unread messages', exact: true }).click();
  await page.getByRole('button', { name: /Sophie Chen/ }).click();
  await expect(page.getByRole('button', { name: 'Back to messages' })).toBeFocused();
  await page.getByRole('button', { name: 'Next message', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Friday’s design review' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous message', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A fresh start for FruitUI' })).toBeVisible();
  await page.getByRole('button', { name: 'Reply to message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New Message' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'To', exact: true })).toHaveValue('sophie@example.com');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Back to messages' }).click();
  await expect(page.getByRole('button', { name: /Sophie Chen/ })).toBeFocused();
  await page.getByLabel('Mailbox options', { exact: true }).click();
  await page.getByRole('button', { name: 'Mark All as Read' }).click();
  await page.getByRole('button', { name: 'Show unread messages', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No Messages', exact: true })).toBeVisible();
});

test('a medium container keeps the list and reader together', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await expect(page.locator('.f-mail__reader')).toBeVisible();
  await expect(page.locator('.f-mail__list-pane')).toBeVisible();
  await expect(page.locator('#mailboxes')).not.toBeVisible();
  await expect(page.locator('.f-mail__mobile-header')).not.toBeVisible();
  await page.getByLabel('Mailbox', { exact: true }).selectOption('sent');
  await expect(page.locator('.f-mail__message')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('small phones keep all screens and the compose dialog within the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const assertNoOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('#mail').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  };
  await assertNoOverflow();
  await page.getByRole('button', { name: /Sophie Chen/ }).click();
  await assertNoOverflow();
  await page.getByRole('button', { name: 'Back to messages' }).click();
  await page.getByRole('button', { name: 'Show mailboxes' }).click();
  await assertNoOverflow();
  await page.getByRole('button', { name: 'Compose message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New Message' });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
});

for (const theme of ['light', 'dark']) {
  test(`phone inbox, mailboxes, and reader are accessible in ${theme} appearance`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    for (const action of [null, 'mailboxes', 'message']) {
      if (action === 'mailboxes') {
        await page.getByRole('button', { name: 'Show mailboxes' }).click();
        await page.locator('#mailboxes [data-scope="work"] > summary').click();
        await page.locator('#mailboxes [data-scope="personal"] > summary').click();
      }
      if (action === 'message') {
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await page.getByRole('button', { name: /Sophie Chen/ }).click();
      }
      await expectAccessible(page);
    }
  });
}

test('appearance persists and system dark mode works without an explicit override', async ({ page }) => {
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Appearance', { exact: true }).selectOption('system');
  await page.emulateMedia({ colorScheme: 'dark' });
  // --f-surface resolves to its dark value where it is used.
  const surface = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.backgroundColor = 'var(--f-surface)';
    return getComputedStyle(probe).backgroundColor;
  });
  expect(surface).toBe('rgb(37, 37, 40)');
});

for (const theme of ['light', 'dark']) {
  for (const path of ['/', '/components.html']) {
    test(`${path} has no serious accessibility issues in ${theme} appearance`, async ({ page }) => {
      await page.goto(path);
      await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
      await expectAccessible(page);
    });
  }
}

test('selection controls keep native form values and Alpine state aligned', async ({ page }) => {
  await page.goto('/components.html');
  const form = page.getByRole('form', { name: 'Selection Controls' });
  const checkbox = form.getByRole('checkbox', { name: 'Play a sound for new messages' });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).not.toBeChecked();
  await form.getByRole('switch', { name: 'Show message previews' }).uncheck();
  await form.getByRole('radio', { name: 'Comfortable', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(form.getByRole('radio', { name: 'Compact', exact: true })).toBeChecked();
  await expect(form.locator('output')).toHaveText('Previews off · Sound off · compact density');
  expect(await form.evaluate(element => Object.fromEntries(new FormData(element)))).toEqual({ density: 'compact' });
  await checkbox.check();
  await expect(form.locator('output')).toContainText('Sound on');
  expect(await form.evaluate(element => Object.fromEntries(new FormData(element)))).toEqual({
    sounds: '1',
    density: 'compact',
  });
});

test('CSS-only controls work with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/components.html');
  const control = page.getByRole('switch', { name: 'Show message previews' });
  await expect(control).toBeChecked();
  await control.uncheck();
  await expect(control).not.toBeChecked();
  await page.getByText('What makes FruitUI CSS first?', { exact: true }).click();
  await expect(page.locator('details.f-disclosure')).toHaveAttribute('open', '');
  await context.close();
});
