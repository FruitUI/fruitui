import { test, expect } from '@playwright/test';

async function fixture(page, body) {
  await page.route('**/adoption-fixture', route =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html class="fruit-ui" lang="en"><head><title>Adoption contracts</title><link rel="stylesheet" href="/src/fruitui.css"></head><body>${body}<script type="module">import Alpine from '/node_modules/alpinejs/dist/module.esm.js'; import fruitUI from '/src/js/alpine.js'; fruitUI(Alpine); Alpine.start(); window.Alpine = Alpine;</script></body></html>`,
    }),
  );
  await page.goto('/adoption-fixture');
}

test('nested tabs preserve parent selection and RTL arrows follow visual direction', async ({ page }) => {
  await fixture(
    page,
    `<main x-data="fruitTabs" dir="rtl"><div role="tablist" aria-label="Outer"><button role="tab" aria-controls="outer-one" aria-selected="true">Outer one</button><button role="tab" aria-controls="outer-two">Outer two</button></div><section id="outer-one" role="tabpanel"><div x-data="fruitTabs"><div role="tablist" aria-label="Inner"><button role="tab" aria-controls="inner-one" aria-selected="true">Inner one</button><button role="tab" aria-controls="inner-two">Inner two</button></div><section id="inner-one" role="tabpanel">First</section><section id="inner-two" role="tabpanel">Second</section></div></section><section id="outer-two" role="tabpanel">Other</section></main>`,
  );
  await page.getByRole('tab', { name: 'Inner two' }).click();
  await expect(page.locator('#inner-two')).toBeVisible();
  await expect(page.locator('#outer-one')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Outer one' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Outer one' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Outer two' })).toBeFocused();
});

test('nested menus ignore each others commands and skip CSS-hidden items', async ({ page }) => {
  await fixture(
    page,
    `<details class="f-menu" x-data="fruitMenu"><summary>Outer</summary><div class="f-menu__items" role="menu" aria-label="Outer commands"><button role="menuitem">First</button><button role="menuitem" style="display:none">Hidden</button><button role="menuitem">Last</button><details class="f-menu" x-data="fruitMenu"><summary>Inner</summary><div class="f-menu__items" role="menu" aria-label="Inner commands"><button role="menuitem">Child</button></div></details></div></details>`,
  );
  await page.getByText('Outer', { exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Last' })).toBeFocused();
  await page.getByText('Inner', { exact: true }).click();
  await page.getByRole('menuitem', { name: 'Child' }).click();
  await expect(page.locator('details').first()).toHaveAttribute('open');
});

test('choice refreshes options without destroying search and inherits all disabled fieldsets', async ({ page }) => {
  await fixture(
    page,
    `<fieldset id="outer"><fieldset><label for="choice">Owner</label><div class="f-combobox" x-data="fruitCombobox" data-fruit-no-matches="Geen resultaten"><select id="choice" data-fruit-control name="owner"><option>Alex</option><option>Mia</option></select></div></fieldset></fieldset>`,
  );
  const choice = page.getByRole('combobox', { name: 'Owner' });
  await choice.fill('M');
  await page.locator('#choice').evaluate(control => {
    control.title = 'Pick an owner';
    control.add(new Option('Morgan', 'morgan'));
  });
  await expect(choice).toHaveValue('M');
  await expect(page.getByRole('option', { name: 'Morgan' })).toBeVisible();
  await page.locator('#choice').evaluate(control => {
    control.options[1].disabled = true;
  });
  await expect(page.getByRole('option', { name: 'Mia' })).toHaveCount(0);
  await choice.fill('unknown');
  await expect(page.locator('.f-combobox__empty')).toHaveText('Geen resultaten');
  await page.locator('#choice').evaluate(control => {
    control.value = 'morgan';
    control.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(choice).toHaveValue('Morgan');
  await expect(page.getByRole('listbox')).toBeHidden();
  await page.locator('#outer').evaluate(node => {
    node.disabled = true;
  });
  await expect(choice).toBeDisabled();
  await expect(page.getByRole('listbox')).toBeHidden();
  await page.locator('#outer').evaluate(node => {
    node.disabled = false;
  });
  await expect(choice).toBeEnabled();
});

test('token presentation, pending entry, translated removal and serialized maxlength stay consistent', async ({
  page,
}) => {
  await fixture(
    page,
    `<label for="tokens">Tags</label><div class="f-token-field" x-data="fruitTokenField" data-fruit-remove-label="Verwijder {value}" data-fruit-length-message="Maximaal {count} tekens"><textarea data-fruit-control id="tokens" name="tags" maxlength="8" style="width:180px">One</textarea></div>`,
  );
  const input = page.getByRole('textbox', { name: 'Tags' });
  await input.fill('Two');
  await page.locator('#tokens').evaluate(control => {
    control.setAttribute('aria-describedby', 'help');
  });
  await expect(input).toHaveValue('Two');
  await input.press('Enter');
  await expect(page.getByRole('button', { name: 'Verwijder Two' })).toBeVisible();
  await input.fill('Three');
  await input.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Maximaal 8 tekens');
  expect(await page.locator('.f-token-field__entry').evaluate(node => node.getBoundingClientRect().width)).toBe(180);
  await page.locator('#tokens').evaluate(control => {
    control.value = 'New';
    control.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(input).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Verwijder New' })).toBeVisible();
});

test('editor emits input while editing and change and blur once on leaving the widget', async ({ page }) => {
  await page.goto('/components.html');
  const editor = page.getByRole('textbox', { name: 'Reply Signature', exact: true });
  await page.locator('#gallery-editor').evaluate(control => {
    window.events = [];
    for (const type of ['input', 'change', 'blur']) control.addEventListener(type, () => window.events.push(type));
  });
  await editor.focus();
  await editor.press('ControlOrMeta+a');
  await editor.pressSequentially('Hello');
  expect(await page.evaluate(() => window.events.filter(type => type === 'change'))).toEqual([]);
  await page.locator('#editor-example').getByRole('button', { name: 'Bold', exact: true }).click();
  expect(await page.evaluate(() => window.events.filter(type => type === 'blur'))).toEqual([]);
  await page.getByRole('button', { name: 'Set Signature Externally' }).focus();
  expect(await page.evaluate(() => window.events.filter(type => type === 'change'))).toEqual(['change']);
  expect(await page.evaluate(() => window.events.filter(type => type === 'blur'))).toEqual(['blur']);
});

test('scoped input and avatar tokens inherit in both appearances', async ({ page }) => {
  await fixture(
    page,
    `<main style="--f-input-background:rgb(1,2,3);--f-avatar-color:rgb(4,5,6);--f-control-height:48px"><input class="f-input" aria-label="Name"><span class="f-avatar">A</span></main>`,
  );
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    expect(await page.locator('input').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(1, 2, 3)');
    expect(await page.locator('.f-avatar').evaluate(node => getComputedStyle(node).color)).toBe('rgb(4, 5, 6)');
    expect(await page.locator('input').evaluate(node => node.getBoundingClientRect().height)).toBe(48);
  }
});

test('toast replacement cancels old dismissal and pause preserves reading time', async ({ page }) => {
  await page.clock.install();
  await fixture(
    page,
    `<main x-data="fruitToast({duration:1000})"><button @click="notify('Saved')">Save</button><button @click="pauseNotice()">Pause</button><button @click="resumeNotice()">Resume</button><div role="status" x-text="notice"></div></main>`,
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await page.clock.fastForward(600);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.clock.fastForward(600);
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.fastForward(2000);
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.clock.fastForward(500);
  await expect(page.getByRole('status')).toBeEmpty();
});

test('core helpers preserve the native Editor when the optional plugin is absent', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await fixture(
    page,
    `<label for="fallback">Signature</label><div class="f-editor" x-data="fruitEditor"><div class="f-editor__toolbar" hidden><button data-fruit-command="bold">Bold</button></div><textarea class="f-input" id="fallback" name="signature" data-fruit-control>Plain fallback</textarea><div class="f-editor__surface" hidden></div></div>`,
  );
  const control = page.getByRole('textbox', { name: 'Signature' });
  await expect(control).toBeVisible();
  await control.fill('Native edit');
  await expect(control).toHaveValue('Native edit');
  expect(errors).toEqual([]);
  await expect(page.getByRole('button', { name: 'Bold' })).toBeHidden();
});

test('enhancement forwards autofocus and respects a changed external form owner on reset', async ({ page }) => {
  await fixture(
    page,
    `<form id="first"></form><form id="second"><button type="reset">Reset second</button></form><label for="external">Tags</label><div class="f-token-field" x-data="fruitTokenField"><textarea id="external" data-fruit-control name="tags" form="first" autofocus>Initial</textarea></div>`,
  );
  const input = page.getByRole('textbox', { name: 'Tags' });
  await expect(input).toBeFocused();
  await input.fill('Pending');
  await page.locator('#external').evaluate(control => {
    control.setAttribute('form', 'second');
  });
  await page.getByRole('button', { name: 'Reset second' }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove Initial' })).toBeVisible();
});

test('inherited presentation overrides apply to named variants and readonly states', async ({ page }) => {
  await fixture(
    page,
    `<main style="--f-input-background:rgb(1,2,3);--f-item-current-background:rgb(1,2,3);--f-alert-color:rgb(1,2,3);--f-composer-background:rgb(1,2,3);--f-floating-background:rgb(1,2,3)"><input class="f-input" readonly aria-label="Readonly"><button class="f-item-row f-item-row--filled" aria-current="true">Message</button><div class="f-alert f-alert--danger">Error</div><form class="f-composer">Compose</form><details class="f-floating-disclosure" open><summary>Options</summary><div class="f-floating-disclosure__content">Choice</div></details></main>`,
  );
  for (const selector of ['.f-input', '.f-item-row', '.f-composer', '.f-floating-disclosure__content'])
    await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(1, 2, 3)');
  await expect(page.locator('.f-alert')).toHaveCSS('border-inline-start-color', 'rgb(1, 2, 3)');
});
