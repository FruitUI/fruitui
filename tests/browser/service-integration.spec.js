import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';

test('Mail recipient tokens validate, survive sending, and reset when starting another draft', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compose message' }).click();
  const dialog = page.getByRole('dialog', { name: 'New Message' });
  await dialog.getByRole('textbox', { name: 'To', exact: true }).fill('sophie@example.com');
  await dialog.getByRole('textbox', { name: 'Subject' }).fill('Team update');
  await dialog.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello team');
  const cc = dialog.getByRole('textbox', { name: 'Cc', exact: true });
  // Cc and Bcc rows appear on demand; revealing them moves focus to Cc.
  const reveal = dialog.getByRole('button', { name: 'Cc/Bcc' });
  await expect(cc).toBeHidden();
  await reveal.click();
  await expect(cc).toBeFocused();
  await expect(reveal).toBeHidden();
  await cc.fill('invalid');
  await cc.press('Enter');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(dialog).toBeVisible();
  await cc.fill('mia@example.com');
  await cc.press('Enter');
  const bcc = dialog.getByRole('textbox', { name: 'Bcc', exact: true });
  await bcc.fill('noah@example.com');
  await bcc.press('Enter');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.locator('#mailboxes').getByRole('button', { name: 'Sent', exact: true }).click();
  await page.getByRole('button', { name: /Team update/ }).click();
  await expect(page.locator('.f-mail__message-header')).toContainText('Cc: mia@example.com');
  await expect(page.locator('.f-mail__message-header')).not.toContainText('noah@example.com');
  await page.getByRole('button', { name: 'Compose message' }).click();
  await expect(dialog.locator('.f-chip')).toHaveCount(0);
  await expect(cc).toBeHidden();
  await reveal.click();
  await expect(cc).toHaveValue('');
  await cc.fill('bad');
  await cc.press('Enter');
  await dialog.getByRole('button', { name: 'Close compose' }).click();
  await page.getByRole('button', { name: 'Compose message' }).click();
  await reveal.click();
  await expect(cc).toHaveValue('');
  expect(await cc.evaluate(input => input.validity.valid)).toBe(true);
});

test('Support pagination and split send action operate on the selected conversation', async ({ page }) => {
  await page.goto('/support.html');
  await page.getByRole('combobox', { name: 'Conversations per Page' }).selectOption('5');
  await expect(page.locator('.support-ticket[data-ticket-id]')).toHaveCount(5);
  await page.getByRole('button', { name: 'Next conversation page' }).click();
  await expect(page.locator('.support-ticket[data-ticket-id]')).toHaveCount(1);
  await expect(page.locator('.support-pagination')).toContainText('2 / 2');
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('Sophie');
  await expect(page.locator('.support-pagination')).toContainText('1 / 1');
  await page.getByRole('searchbox', { name: 'Search Conversations' }).fill('');
  await page.getByRole('button', { name: /A little help with our team plan/ }).click();
  await page.getByRole('button', { name: 'Reply options', exact: true }).click();
  const command = page.getByRole('menuitem', { name: 'Send and Close' });
  await expect(command).toBeVisible();
  expect(
    await command.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(rect.x + 8, rect.y + 8));
    }),
  ).toBe(true);
  await command.click();
  await page
    .locator('#support-queues')
    .getByRole('button', { name: /^Closed/ })
    .click();
  await page.getByRole('button', { name: /A little help with our team plan/ }).click();
  await expect(page.getByRole('combobox', { name: 'Conversation Status' })).toHaveValue('closed');
  // The conversation's two earlier replies, then the one just sent.
  await expect(page.locator('.support-message[data-kind=reply]')).toHaveCount(3);
});

test('Admin rich signatures and native joined numeric fields save and reset together', async ({ page }) => {
  await page.goto('/admin.html#/settings');
  const signature = page.getByRole('textbox', { name: 'Support Reply Signature' });
  await expect(signature).toBeVisible();
  await signature.fill('Kind regards, Mia');
  const days = page.getByRole('spinbutton', { name: 'Default Trial Length' });
  await days.fill('21');
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
  await signature.fill('Unsaved');
  await days.fill('7');
  await page.getByRole('button', { name: 'Reset Changes', exact: true }).click();
  await expect(signature).toHaveText('Kind regards, Mia');
  await expect(days).toHaveValue('21');
});

for (const scheme of ['light', 'dark'])
  test(`Support overlays stay within a phone and retain accessibility in ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/support.html');
    await page.getByRole('button', { name: /A little help with our team plan/ }).click();
    await page.getByRole('button', { name: 'Show customer details' }).click();
    const choice = page.getByRole('combobox', { name: 'Assigned To', exact: true });
    await choice.click();
    const list = page.locator('.f-combobox__options');
    await expect(list).toBeVisible();
    const rect = await list.boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(320);
    expect(
      await list.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(rect.x + 8, rect.y + 8));
      }),
    ).toBe(true);
    await expectAccessible(page);
  });
