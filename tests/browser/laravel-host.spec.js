import { test, expect } from '@playwright/test';

test('single-file Mail preferences save and reload through the real Livewire host', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5180/preferences');
  const previews = page.getByRole('switch', { name: 'Show message previews' });
  const sounds = page.getByRole('switch', { name: 'Play a sound for new messages' });
  await expect(previews).toBeChecked();
  await expect(sounds).not.toBeChecked();
  await previews.uncheck();
  await sounds.check();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  await page.reload();
  await expect(previews).not.toBeChecked();
  await expect(sounds).toBeChecked();
  await expect(page.getByRole('status')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('real Laravel/Livewire host commits change and blur bindings and morphs enhanced controls', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5180');
  const editor = page.getByRole('textbox', { name: 'Signature', exact: true });
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await editor.fill('Hello from browser'); await expect(page.locator('#commits')).toHaveText('0 commits');
  await page.getByRole('heading').click(); await expect(page.locator('#commits')).toHaveText('1 commits');
  await expect(page.locator('#saved-signature')).toHaveText('<p>Hello from browser</p>');
  const blur = page.getByRole('textbox', { name: 'Blur signature', exact: true });
  await blur.fill('Blur value'); await expect(page.locator('#blur-commits')).toHaveText('0 blur commits');
  await page.getByRole('heading').click(); await expect(page.locator('#blur-commits')).toHaveText('1 blur commits');
  await expect(page.locator('#saved-blur-signature')).toHaveText('<p>Blur value</p>');
  await page.getByRole('button', { name: 'Update from server' }).click();
  const choice = page.getByRole('combobox', { name: 'Owner', exact: true }); await expect(choice).toHaveValue('Morgan');
  await choice.click(); await expect(page.getByRole('option', { name: 'Morgan', exact: true })).toBeVisible(); await choice.press('Escape');
  await expect(page.getByRole('button', { name: 'Remove mia@example.com' })).toBeDisabled();
  await expect(page.locator('#owner')).toBeHidden(); await expect(page.locator('#signature')).toBeHidden();
  expect(errors).toEqual([]);
});
