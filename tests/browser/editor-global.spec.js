import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// The prebuilt files a host without a bundler links: Alpine (as Livewire injects it), FruitUI and the editor.
const file = path => fileURLToPath(new URL(`../../${path}`, import.meta.url));

/** A fresh document and window, so no Alpine from another page is already running. */
async function openFixture(page, scripts) {
  await page.route('**/editor-fixture', route =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><link rel="stylesheet" href="/build/fruitui.css"></head>
        <body class="fruit-ui"><div class="f-editor" x-data="fruitEditor">
          <div class="f-editor__toolbar" hidden aria-label="Text formatting">
            <button class="f-button" type="button" data-fruit-command="bold">Bold</button>
            <button class="f-button" type="button" x-on:click="$dispatch('fruit-editor-insert', { html: ' <strong>there</strong>' })">Insert saved reply</button>
          </div>
          <textarea class="f-input" id="reply" name="reply" data-fruit-control aria-label="Reply">&lt;p&gt;Hello&lt;/p&gt;</textarea>
          <div class="f-editor__surface" hidden></div>
        </div></body></html>`,
    }),
  );
  await page.goto('/editor-fixture');
  // Alpine's CDN build starts on its own, after the plugins registered on alpine:init.
  for (const path of [...scripts, 'node_modules/alpinejs/dist/cdn.min.js'])
    await page.addScriptTag({ path: file(path) });
}

for (const order of [
  ['build/editor.global.js', 'build/livewire.global.js'],
  ['build/livewire.global.js', 'build/editor.global.js'],
]) {
  test(`the prebuilt editor registers itself and accepts content requests (${order.join(' then ')})`, async ({
    page,
  }) => {
    await openFixture(page, order);
    const surface = page.locator('.f-editor__surface [contenteditable]');
    await expect(surface).toBeVisible();
    await expect(page.locator('#reply')).toBeHidden();
    const changes = [];
    await page.exposeFunction('changed', value => changes.push(value));
    await page
      .locator('#reply')
      .evaluate(control => control.addEventListener('change', () => window.changed(control.value)));

    // Insert at the cursor from an app toolbar button inside the editor.
    await surface.click();
    await page.keyboard.press('End');
    await page.getByRole('button', { name: 'Insert saved reply' }).click();
    await expect(page.locator('#reply')).toHaveValue('<p>Hello <strong>there</strong></p>');
    // Replace from anywhere (as Livewire's dispatch() does), naming the editor's textarea.
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent('fruit-editor-set', { detail: { target: 'reply', html: '<p>Saved reply</p>' } }),
      ),
    );
    await expect(page.locator('#reply')).toHaveValue('<p>Saved reply</p>');
    await expect(surface).toHaveText('Saved reply');
    // A request naming another editor is ignored.
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('fruit-editor-set', { detail: { target: 'note', html: '<p>Other</p>' } })),
    );
    await expect(page.locator('#reply')).toHaveValue('<p>Saved reply</p>');
    expect(changes).toEqual(['<p>Hello <strong>there</strong></p>', '<p>Saved reply</p>']);
  });
}

test('without the editor plugin the native textarea answers the same requests', async ({ page }) => {
  await openFixture(page, ['build/livewire.global.js']);
  const control = page.locator('#reply');
  await expect(control).toBeVisible();
  await control.evaluate(element => element.setSelectionRange(element.value.length, element.value.length));
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('fruit-editor-insert', { detail: { target: 'reply', html: '<p>Signature</p>' } }),
    ),
  );
  await expect(control).toHaveValue('<p>Hello</p><p>Signature</p>');
});
