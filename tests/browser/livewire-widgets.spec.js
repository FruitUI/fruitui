import { test, expect } from '@playwright/test';

// Real installed Livewire/Alpine client; intercepted transport keeps this fixture
// independent of a Laravel web server. PHP tests cover server value validation.
const snapshot = data => ({ data, memo: { id: 'fruit-widgets', name: 'fruit-widgets', path: 'widgets', method: 'GET', children: {}, scripts: [], assets: [], errors: [], locale: 'en' }, checksum: 'fixture' });
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function markup(data, changed = false) {
  return `<main wire:id="fruit-widgets" wire:snapshot="${escape(JSON.stringify(snapshot(data)))}" wire:effects="{}">
    <h1>Support preferences</h1>
    <label for="wire-choice">${changed ? 'Conversation owner' : 'Assigned to'}</label>
    <div class="f-combobox" x-data="fruitCombobox"><select class="f-input" data-fruit-control id="wire-choice" name="assignee" wire:model="assignee"><option value="alex">Alex Morgan</option><option value="mia">Mia Patel</option></select><div data-fruit-ui wire:ignore></div></div>
    <label for="wire-tokens">Recipients</label><div class="f-token-field" x-data="fruitTokenField"><textarea class="f-input" data-fruit-control id="wire-tokens" name="recipients" wire:model="recipients" ${changed ? 'readonly' : ''}>${escape(data.recipients)}</textarea><div data-fruit-ui wire:ignore></div></div>
    <label for="wire-editor">Signature</label><div class="f-editor" x-data="fruitEditor"><div class="f-editor__toolbar" hidden wire:ignore><button class="f-button" type="button" data-fruit-command="bold">Bold</button></div><textarea class="f-input" data-fruit-control id="wire-editor" name="signature" wire:model="signature">${escape(data.signature)}</textarea><div class="f-editor__surface" hidden wire:ignore></div></div>
    <button class="f-button" type="button" wire:click="$refresh">Refresh from server</button>
  </main>`;
}

test('Livewire model events and server morphs preserve widgets while updating native controls', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const data = { assignee: 'alex', recipients: 'sophie@example.com', signature: '<p>Thanks, Alex</p>' };
  const fixture = `<!doctype html><html class="fruit-ui" lang="en"><head><title>Livewire widgets</title><link rel="stylesheet" href="/src/fruitui.css"><script>window.livewireScriptConfig = { csrf: 'fixture', uri: '/livewire-widget-update' };</script></head><body>${markup(data)}<script type="module">
    import { Livewire, Alpine } from '/vendor/livewire/livewire/dist/livewire.esm.js';
    import fruitUI from '/src/js/alpine.js'; import fruitEditor from '/src/js/editor.js';
    fruitUI(Alpine); fruitEditor(Alpine); Livewire.start();
  </script></body></html>`;
  let submitted;
  await page.route('**/livewire-widget-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.route('**/livewire-widget-update', route => {
    submitted = route.request().postDataJSON().components[0].updates;
    const server = { assignee: 'alex', recipients: 'noah@example.com', signature: '<p>Server signature</p>' };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ components: [{ snapshot: JSON.stringify(snapshot(server)), effects: { html: markup(server, true) } }], assets: [] }) });
  });
  await page.goto('/livewire-widget-fixture');
  const choice = page.getByRole('combobox', { name: 'Assigned to', exact: true });
  await expect(choice).toHaveValue('Alex Morgan');
  await choice.fill('Mia'); await choice.press('Enter');
  const recipients = page.getByRole('textbox', { name: 'Recipients', exact: true });
  await recipients.fill('mia@example.com'); await recipients.press('Enter');
  const editor = page.getByRole('textbox', { name: 'Signature', exact: true }); await editor.fill('Client signature');
  await page.getByRole('button', { name: 'Refresh from server' }).click();
  await expect(page.getByRole('combobox', { name: 'Conversation owner' })).toHaveValue('Alex Morgan');
  await expect(page.getByRole('button', { name: 'Remove noah@example.com' })).toBeDisabled();
  await expect(recipients).toHaveAttribute('readonly');
  await expect(editor).toHaveText('Server signature');
  await expect(page.locator('#wire-choice')).toBeHidden();
  await expect(page.locator('#wire-tokens')).toBeHidden();
  await expect(page.locator('#wire-editor')).toBeHidden();
  expect(submitted).toEqual({ assignee: 'mia', recipients: 'sophie@example.com\nmia@example.com', signature: '<p>Client signature</p>' });
  await page.getByText('Conversation owner', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Conversation owner' })).toBeFocused();
  expect(errors).toEqual([]);
});
