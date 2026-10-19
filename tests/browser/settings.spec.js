import { test, expect } from '@playwright/test';
import { expectAccessible, expectNoOverflow, selectMarkdown, tokenColor } from './helpers.js';

// The Settings example: grouped settings in a Drill-Down (settings.html).
const workspace = page => page.locator('#settings');
const sidebar = page => page.getByRole('navigation', { name: 'Settings', exact: true });
// A level, by its title; and the titles of the levels in view, in order.
const level = (page, name) =>
  workspace(page)
    .locator('.f-drilldown__column')
    .filter({ has: page.locator('.f-drilldown__header').getByRole('heading', { name, exact: true }) });
const shown = page =>
  workspace(page)
    .locator('.f-drilldown__column')
    .evaluateAll(columns =>
      columns
        .filter(column => column.checkVisibility())
        .map(column => column.querySelector('.f-drilldown__title')?.textContent ?? 'Settings'),
    );
const back = (page, name) => level(page, name).locator('.f-drilldown__header .f-back');

test.beforeEach(async ({ page }) => {
  await page.goto('/settings.html');
});

test('Settings is linked from every example, and its pages follow the URL', async ({ page }) => {
  for (const path of ['/', '/support.html', '/chat.html', '/admin.html', '/widget.html', '/components.html']) {
    await page.goto(path);
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Settings', exact: true }),
    ).toHaveAttribute('href', '/settings.html');
  }
  // Your own pages come first: Settings opens on your Profile.
  await page.goto('/settings.html');
  await expect(sidebar(page).getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Profile', level: 2 })).toBeVisible();
  await sidebar(page).getByRole('link', { name: 'General' }).click();
  await expect(page).toHaveURL(/#\/general$/);
  await expect(page.getByRole('region', { name: 'Company' })).toBeVisible();
});

test('each level opens beside the one before, and the rows on the way stay current', async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1000 });
  await expect.poll(() => shown(page)).toEqual(['Settings', 'Profile']);
  const links = sidebar(page).getByRole('link');
  const count = await links.count();
  const mailboxes = sidebar(page).getByRole('link', { name: 'Mailboxes' });
  await mailboxes.click();
  await expect(page).toHaveURL(/#\/mailboxes$/);
  await expect.poll(() => shown(page)).toEqual(['Settings', 'Mailboxes']);
  const list = level(page, 'Mailboxes').getByRole('region', { name: 'Mailboxes' });
  await expect(list.getByRole('link')).toHaveText([
    /Support.*support@forma\.example/,
    /Billing.*billing@forma\.example/,
    /Feedback.*feedback@forma\.example/,
  ]);
  const billing = list.getByRole('link', { name: /^Billing/ });
  await billing.click();
  await expect(page).toHaveURL(/#\/mailboxes\/billing$/);
  await expect.poll(() => shown(page)).toEqual(['Settings', 'Mailboxes', 'Billing']);
  // A level is a region named by its title. The row that opened it is current, and keeps focus beside
  // it; where a click doesn't focus a link (Safari), the new level's title takes focus instead.
  await expect(level(page, 'Billing')).toHaveAccessibleName('Billing');
  await expect
    .poll(() =>
      page.evaluate(() => document.activeElement?.matches('a[href="#/mailboxes/billing"], #settings-mailbox-heading')),
    )
    .toBe(true);
  await expect(billing).toHaveAttribute('aria-current', 'page');
  await expect(mailboxes).toHaveAttribute('aria-current', 'true');
  const mailbox = level(page, 'Billing');
  await expect(mailbox.getByLabel('Email Address', { exact: true })).toHaveValue('billing@forma.example');
  await expect(mailbox.getByRole('link', { name: 'Open Mailbox' })).toBeVisible();
  // A row per further page, with its current value.
  const row = name => mailbox.getByRole('link', { name: new RegExp(`^${name}`) });
  await expect(row('Connection')).toHaveText(/SMTP · smtp\.forma\.example/);
  await expect(row('Permissions')).toHaveText(/1 person/);
  await expect(row('Auto Reply')).toHaveText(/On/);
  await row('Connection').click();
  await expect(page).toHaveURL(/#\/mailboxes\/billing\/connection$/);
  await expect.poll(() => shown(page)).toEqual(['Settings', 'Mailboxes', 'Billing', 'Connection']);
  await expect(row('Connection')).toHaveAttribute('aria-current', 'page');
  await expect(billing).toHaveAttribute('aria-current', 'true');
  // With every level in view, none needs a way back.
  for (const name of ['Mailboxes', 'Billing', 'Connection']) await expect(back(page, name)).toBeHidden();
  // A change shows at once in the row beside it: there's nothing to save.
  await level(page, 'Connection').getByRole('radio', { name: 'The server’s mail' }).check();
  await expect(level(page, 'Connection').getByLabel('Server', { exact: true })).toHaveCount(0);
  await expect(row('Connection')).toHaveText(/The server’s mail/);
  await expect(workspace(page).getByRole('button', { name: 'Save' })).toHaveCount(0);
  // The sidebar never grows on the way.
  await expect(links).toHaveCount(count);
  // Choosing another row closes the levels below it.
  await list.getByRole('link', { name: /^Support/ }).click();
  await expect(page).toHaveURL(/#\/mailboxes\/support$/);
  await expect.poll(() => shown(page)).toEqual(['Settings', 'Mailboxes', 'Support']);
  await expect(level(page, 'Support').getByRole('link', { name: /^Connection/ })).toHaveText(/SMTP/);
  // Links to the earlier single mailbox open the Support mailbox.
  await page.goto('/settings.html#/mailbox/connection');
  await expect(page).toHaveURL(/#\/mailboxes\/support\/connection$/);
  await expect(level(page, 'Connection')).toBeVisible();
});

test('where the levels don’t all fit, the deepest show and the first leads back', async ({ page }) => {
  await page.goto('/settings.html#/mailboxes/billing/connection');
  // Levels are a large phone's width at least; 1440 fits three of them.
  await expect.poll(() => shown(page)).toEqual(['Mailboxes', 'Billing', 'Connection']);
  const widths = await workspace(page)
    .locator('.f-drilldown__column')
    .evaluateAll(columns => columns.filter(column => column.checkVisibility()).map(column => column.offsetWidth));
  for (const width of widths) expect(width).toBeGreaterThanOrEqual(440);
  await expect(back(page, 'Mailboxes')).toHaveText('Settings');
  await expect(back(page, 'Billing')).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect.poll(() => shown(page)).toEqual(['Billing', 'Connection']);
  await expect(back(page, 'Billing')).toHaveText('Mailboxes');
  await page.setViewportSize({ width: 800, height: 1000 });
  await expect.poll(() => shown(page)).toEqual(['Connection']);
  await expect(back(page, 'Connection')).toHaveText('Billing');
  // Back goes to that level's parent, focusing the row that leads where you were.
  await back(page, 'Connection').click();
  await expect(page).toHaveURL(/#\/mailboxes\/billing$/);
  await expect.poll(() => shown(page)).toEqual(['Billing']);
  await expect(level(page, 'Billing').getByRole('link', { name: /^Connection/ })).toBeFocused();
  // The sidebar counts at its own width, so the categories and a page share a tablet's width.
  await page.goto('/settings.html#/general');
  await expect.poll(() => shown(page)).toEqual(['Settings', 'General']);
  // Every level's title row keeps one height, with or without Back and actions.
  const heights = [];
  for (const hash of ['#/general', '#/mailboxes/support', '#/mailboxes/support/connection']) {
    await page.goto(`/settings.html${hash}`);
    for (const header of await workspace(page).locator('.f-drilldown__header').all())
      if (await header.isVisible()) heights.push((await header.boundingBox()).height);
  }
  expect(new Set(heights).size).toBe(1);
});

test('a level shows its current row after a page load, scrolling only itself', async ({ page }) => {
  // A short frame, so the open person's row and the sidebar's Users start out of their levels' view.
  // It comes with the stylesheet, as a page's own layout does.
  await page.route('**/examples/settings/settings.css*', async route => {
    const response = await route.fetch();
    const body = `${await response.text()}\n.settings-workspace { --f-workspace-height: 280px; }`;
    await route.fulfill({ response, body });
  });
  // A load, not a hash change: the page before this one is the same document.
  await page.goto('/settings.html#/users/noah');
  await page.reload();
  await expect(workspace(page)).toHaveCSS('height', '280px');
  const pageScroll = await page.evaluate(() => scrollY);
  const inView = async (row, scroller) => {
    const box = await row.boundingBox();
    const view = await scroller.boundingBox();
    return box.y >= view.y - 1 && box.y + box.height <= view.y + view.height + 1;
  };
  const users = level(page, 'Users');
  await expect
    .poll(() => inView(users.getByRole('link', { name: /^Noah Williams/ }), users.locator('.f-pane__scroll')))
    .toBe(true);
  await expect
    .poll(() =>
      inView(sidebar(page).getByRole('link', { name: 'Users' }), workspace(page).locator('.settings-sidebar')),
    )
    .toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
});

test('only a row that leads to a level is brought into view, not a current page link', async ({ page }) => {
  await page.evaluate(() => {
    const filler = Array.from({ length: 40 }, (_, index) => `<p>Entry ${index + 1}</p>`).join('');
    const level = (id, content) =>
      `<section class="f-drilldown__column" aria-labelledby="${id}-title"><header class="f-drilldown__header"><h2 class="f-drilldown__title" id="${id}-title">${id}</h2></header><div class="f-pane__scroll" id="${id}">${content}</div></section>`;
    const frame = document.createElement('section');
    frame.className = 'f-workspace';
    frame.style.setProperty('--f-workspace-height', '300px');
    frame.innerHTML = `<div class="f-drilldown" x-data="fruitDrilldown">${level(
      'Pages',
      `<div class="f-form-section__rows"><a class="f-form-row f-form-row--link" href="#a">A</a>${filler}<a class="f-form-row f-form-row--link" href="#z" aria-current="page">Z</a></div>`,
    )}${level('Log', `${filler}<nav class="f-pagination" aria-label="Log pages"><a href="#p1" aria-current="page">1</a><a href="#p2">2</a></nav>`)}</div>`;
    document.body.append(frame);
  });
  const top = id => page.locator(`#${id}`).evaluate(element => element.scrollTop);
  // The link row leading to the open level comes into view; the log's current page leaves it alone.
  await expect.poll(() => top('Pages')).toBeGreaterThan(0);
  expect(await top('Log')).toBe(0);
});

test('a phone shows one level at a time, from the list, with a way back', async ({ page }) => {
  await page.getByRole('radio', { name: 'Phone', exact: true }).check();
  // At Settings' root a phone shows the list; General waits beside it for a wider window.
  await expect.poll(() => shown(page)).toEqual(['Settings']);
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await expect.poll(() => shown(page)).toEqual(['Profile']);
  await expect(page.getByRole('heading', { name: 'Profile', level: 2 })).toBeFocused();
  // Switch rows keep the control at the trailing edge; text rows stack.
  const twoFactor = await page.getByRole('switch', { name: 'Two-Factor Authentication' }).boundingBox();
  const label = await page.locator('label[for="settings-two-factor"]').boundingBox();
  expect(twoFactor.x).toBeGreaterThan(label.x + label.width);
  const name = await page.getByLabel('Name', { exact: true }).boundingBox();
  const nameLabel = await page.locator('label[for="settings-name"]').boundingBox();
  expect(name.y).toBeGreaterThan(nameLabel.y + nameLabel.height - 1);
  await back(page, 'Profile').click();
  await expect.poll(() => shown(page)).toEqual(['Settings']);
  await expect(sidebar(page).getByRole('link', { name: 'Profile' })).toBeFocused();
  await expectNoOverflow(page, '#settings');
  // Down through a person, one level at a time, and back up the same way.
  await sidebar(page).getByRole('link', { name: 'Users' }).click();
  await page.getByRole('link', { name: /^Noah Williams/ }).click();
  await expect(page.getByRole('heading', { name: 'Noah Williams', level: 2 })).toBeFocused();
  await page.getByRole('link', { name: /^Permissions/ }).click();
  await expect.poll(() => shown(page)).toEqual(['Permissions']);
  await expectNoOverflow(page, '#settings');
  for (const [from, parent] of [
    ['Permissions', 'Noah Williams'],
    ['Noah Williams', 'Users'],
    ['Users', 'Settings'],
  ]) {
    await expect(back(page, from)).toHaveText(parent);
    await back(page, from).click();
  }
  await expect(sidebar(page).getByRole('link', { name: 'Users' })).toBeFocused();
});

test('every change is saved as it’s made; an entry a field can’t take says why in place', async ({ page }) => {
  await page.goto('/settings.html#/general');
  await expect(workspace(page).getByRole('button', { name: /Save|Revert/ })).toHaveCount(0);
  await expect(page.getByRole('switch', { name: 'Customer Photos' })).toHaveAccessibleDescription(
    'From Gravatar, for customers without a photo.',
  );
  await expect(page.getByLabel('Date Format', { exact: true })).toHaveValue('long');
  // A person's name is theirs everywhere at once: the list row and the level's title.
  await page.goto('/settings.html#/users/mia');
  const name = page.locator('#settings-user-name');
  await name.fill('Mia Chen');
  await expect(level(page, 'Mia Chen')).toBeVisible();
  await expect(level(page, 'Users').getByRole('link', { name: /^Mia Chen/ })).toBeVisible();
  // Emptied, the field says why when you leave it, and the message follows the entry until it's taken.
  await name.fill('');
  await name.blur();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  const message = await name.evaluate(input => input.validationMessage);
  await expect(name).toHaveAccessibleDescription(message);
  await expect(level(page, 'Person').locator('.f-error')).toHaveText(message);
  await name.fill('Mia');
  await expect(name).not.toHaveAttribute('aria-invalid');
  await expect(level(page, 'Mia').locator('.f-error')).toHaveCount(0);
  // Your own name is the account's, in the sidebar.
  await page.goto('/settings.html#/profile');
  await page.getByLabel('Name', { exact: true }).fill('Alex Kim');
  await expect(workspace(page).locator('.settings-account strong')).toHaveText('Alex Kim');
});

test('a person’s permissions: the mailboxes they open, and what General lets everyone do', async ({ page }) => {
  await page.goto('/settings.html#/users');
  const users = level(page, 'Users');
  await users.getByRole('link', { name: /^Mia Patel/ }).click();
  const person = level(page, 'Mia Patel');
  await expect(person.getByRole('link', { name: /^Permissions/ })).toHaveText(/2 mailboxes/);
  await person.getByRole('link', { name: /^Permissions/ }).click();
  await expect(page).toHaveURL(/#\/users\/mia\/permissions$/);
  const permissions = level(page, 'Permissions');
  // A mailbox's people, seen from the person: changing either changes both.
  const billing = permissions.getByRole('checkbox', { name: 'Billing' });
  await expect(billing).not.toBeChecked();
  await billing.check();
  await expect(person.getByRole('link', { name: /^Permissions/ })).toHaveText(/3 mailboxes/);
  // Default names what General allows, and follows it.
  const remove = permissions.getByRole('combobox', { name: 'Delete conversations' });
  await expect(remove.locator('option:checked')).toHaveText('Default (Not Allowed)');
  await page.goto('/settings.html#/general');
  await page.getByRole('checkbox', { name: 'Delete conversations' }).check();
  await page.goto('/settings.html#/mailboxes/billing/permissions');
  await expect(level(page, 'Permissions').getByRole('checkbox', { name: 'Mia Patel' })).toBeChecked();
  await page.goto('/settings.html#/users/mia/permissions');
  await expect(remove.locator('option:checked')).toHaveText('Default (Allowed)');
  await remove.selectOption('deny');
  await expect(remove).toHaveValue('deny');
  // Removing someone asks first.
  await level(page, 'Mia Patel').getByRole('button', { name: 'Remove…' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Remove Mia Patel?' });
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'This sample person stays.' })).toBeVisible();
});

test('your own settings are yours, under Profile; an administrator manages accounts under Users', async ({ page }) => {
  // Under Users, an administrator decides about accounts: someone else's can be reset or removed.
  await page.goto('/settings.html#/users/mia');
  const mia = level(page, 'Mia Patel');
  await expect(mia.getByRole('combobox', { name: 'Role' })).toBeEnabled();
  await expect(mia.getByRole('switch', { name: 'Can Sign In' })).toBeEnabled();
  await mia.getByRole('button', { name: 'Reset Password…' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'mia@forma.example' })).toBeVisible();
  // What a person sets for themselves isn't there.
  await expect(mia.getByRole('link', { name: /^Notifications/ })).toHaveCount(0);
  // Your own account is one of the people, as an administrator sees it; what would lock you out is
  // disabled and says why, and what you set for yourself is under Profile.
  await page.goto('/settings.html#/users');
  await level(page, 'Users')
    .getByRole('link', { name: /^Alex Morgan \(You\)/ })
    .click();
  await expect(page).toHaveURL(/#\/users\/alex$/);
  const me = level(page, 'Alex Morgan');
  await expect(me.getByRole('combobox', { name: 'Role' })).toBeDisabled();
  await expect(me.getByRole('combobox', { name: 'Role' })).toHaveAccessibleDescription(
    'You can’t change your own role.',
  );
  await expect(me.getByRole('switch', { name: 'Can Sign In' })).toBeDisabled();
  await expect(me.getByRole('switch', { name: 'Can Sign In' })).toHaveAccessibleDescription(
    'You can’t turn off your own sign-in.',
  );
  await expect(me.getByRole('button', { name: 'Remove…' })).toBeDisabled();
  await expect(me.getByRole('button', { name: 'Remove…' })).toHaveAccessibleDescription('You can’t remove yourself.');
  await expect(me.getByRole('button', { name: 'Reset Password…' })).toHaveCount(0);
  await me.getByRole('link', { name: /^Your Profile/ }).click();
  await expect(page).toHaveURL(/#\/profile$/);
  // Your notifications are your own page, beside Profile.
  await sidebar(page).getByRole('link', { name: 'Notifications' }).click();
  const notifications = level(page, 'Notifications');
  const desktop = notifications.getByRole('switch', { name: 'Desktop Notifications' });
  await expect(desktop).not.toBeChecked();
  await desktop.check();
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await sidebar(page).getByRole('link', { name: 'Notifications' }).click();
  await expect(level(page, 'Notifications').getByRole('switch', { name: 'Desktop Notifications' })).toBeChecked();
});

test('the destructive action asks first', async ({ page }) => {
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Delete Account…', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete Account', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Account deletion requested' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark']) {
  test(`every settings level is accessible and fits in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const hash of [
      '#/general',
      '#/mailboxes',
      '#/mailboxes/support',
      '#/mailboxes/support/connection',
      '#/mailboxes/support/permissions',
      '#/mailboxes/support/auto-reply',
      '#/mailboxes/support/ai',
      '#/ai',
      '#/profile',
      '#/users',
      '#/users/mia',
      '#/users/mia/permissions',
      '#/users/alex',
      '#/notifications',
    ]) {
      await page.goto(`/settings.html${hash}`);
      await expect(page.locator('.settings-sections').first()).toBeVisible();
      await expectAccessible(page, '#settings');
    }
    // A row whose level is open is selected, in the accent while its level has focus.
    await page.goto('/settings.html#/users/mia/permissions');
    await level(page, 'Mia Patel')
      .getByRole('link', { name: /^Permissions/ })
      .focus();
    await expectAccessible(page, '#settings');
    for (const width of [800, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await expectNoOverflow(page, '#settings');
    }
  });
}

test('the deepest level keeps its sections at a readable width, from its edge, on the grouped background', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/settings.html#/users/mia/permissions');
  const deepest = level(page, 'Permissions');
  const column = await deepest.boundingBox();
  const section = await deepest.locator('.f-form-section').first().boundingBox();
  expect(section.width).toBeLessThanOrEqual(641);
  // It starts at the level's edge, as the levels before it do, rather than centered in the room left.
  for (const name of ['Users', 'Mia Patel', 'Permissions']) {
    const box = await level(page, name).boundingBox();
    const start = await level(page, name).locator('.f-form-section').first().boundingBox();
    expect(Math.round(start.x - box.x)).toBe(Math.round(section.x - column.x));
  }
  await expect(deepest).toHaveCSS('background-color', await tokenColor(page, '--f-grouped-background'));
});

test('the accent color applies to the whole page at once', async ({ page }) => {
  await page.goto('/settings.html#/profile');
  const html = page.locator('html');
  const link = sidebar(page).getByRole('link', { name: 'General' });
  await expect(html).toHaveAttribute('data-fruit-accent', 'blue');
  // The accent as the page resolves it (sidebar icons are gray; the accent is for selection).
  const color = () => tokenColor(page, '--f-accent');
  const blue = await color();
  const group = page.getByRole('radiogroup', { name: 'Accent Color' });
  await group.getByRole('radio', { name: 'Blue' }).focus();
  // A native radio group: arrow keys move and select.
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Purple' })).toBeChecked();
  await expect(html).toHaveAttribute('data-fruit-accent', 'purple');
  await expect.poll(color).not.toBe(blue);
  // It stays chosen on the way through other pages.
  await link.click();
  await sidebar(page).getByRole('link', { name: 'Profile' }).click();
  await expect(
    page.getByRole('radiogroup', { name: 'Accent Color' }).getByRole('radio', { name: 'Purple' }),
  ).toBeChecked();
});

test('Status lists what needs attention with its fix, until everything is working', async ({ page }) => {
  const status = sidebar(page).getByRole('link', { name: /^Status/ });
  await expect(status).toHaveAccessibleName('Status, 3 need attention');
  await status.click();
  await expect(page).toHaveURL(/#\/status$/);
  // The last section keeps the page's end spacing.
  const end = await level(page, 'Status')
    .locator('.f-pane__scroll')
    .evaluate(scroller => {
      scroller.scrollTop = scroller.scrollHeight;
      const last = scroller.querySelector('.settings-sections > :last-child').getBoundingClientRect();
      return scroller.getBoundingClientRect().bottom - last.bottom;
    });
  expect(end).toBeGreaterThanOrEqual(24);
  const attention = page.getByRole('region', { name: 'Needs Attention' });
  await expect(attention.locator('.settings-problem')).toHaveCount(3);
  await expect(attention.getByText('* * * * * php /var/www/forma/artisan schedule:run')).toBeVisible();
  // Each fix sits beside its problem.
  await attention.getByRole('button', { name: 'Update Database' }).click();
  await expect(attention.locator('.settings-problem')).toHaveCount(2);
  const maintenance = page.getByRole('region', { name: 'Maintenance' });
  await expect(maintenance.getByRole('button', { name: 'Update Database' })).toBeDisabled();
  await expect(maintenance).toContainText('The database is up to date.');
  await attention.getByRole('button', { name: 'Retry All' }).click();
  await expect(page.getByRole('region', { name: 'Failed Jobs' })).toContainText('No failed jobs.');
  await attention.getByRole('button', { name: 'Check Again' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Everything is working.' })).toBeVisible();
  await expect(attention).toBeHidden();
  await expect(status).toHaveAccessibleName('Status');
  await expect(page.getByRole('region', { name: 'Background Tasks' })).toContainText('Last ran 1 minute ago');
});

test('Fetch Now runs with its options in a sheet, and Sign Out Everyone asks first', async ({ page }) => {
  await page.goto('/settings.html#/status');
  await page.getByRole('button', { name: 'Fetch Now…' }).click();
  const sheet = page.getByRole('dialog', { name: 'Fetch Emails Now' });
  await expect(sheet.getByRole('spinbutton', { name: 'Days' })).toHaveValue('3');
  await sheet.locator('label').filter({ hasText: /^All$/ }).click();
  await expect(sheet.getByRole('radio', { name: 'All' })).toBeChecked();
  await sheet.getByRole('switch', { name: 'Show Debug Output' }).check();
  await sheet.getByRole('button', { name: 'Fetch', exact: true }).click();
  await expect(sheet.getByRole('status')).toContainText('Fetching all emails from the last 3 days');
  await expect(sheet.getByRole('status')).toContainText('[debug] Connecting');
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole('button', { name: 'Sign Out Everyone…' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Sign out everyone?' });
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Sign Out Everyone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Everyone was signed out.' })).toBeVisible();
});

test('Logs shows one log at a time on a wide page, with details and a confirmed clear', async ({ page }) => {
  await page.goto('/settings.html#/status');
  const narrow = await page.locator('.settings-page').evaluate(element => element.getBoundingClientRect().width);
  await sidebar(page).getByRole('link', { name: 'Logs' }).click();
  // Tables get the wide column; settings pages keep the narrow one.
  await expect
    .poll(() => page.locator('.settings-page').evaluate(element => element.getBoundingClientRect().width))
    .toBeGreaterThan(narrow);
  const table = page.getByRole('table', { name: 'Outgoing Emails' });
  await expect(table.getByRole('row')).toHaveCount(6);
  await table.getByRole('button', { name: 'Details for Reply, Oct 6, 09:12' }).click();
  const details = page.getByRole('dialog', { name: 'Reply · Oct 6, 09:12' });
  await expect(details).toContainText('Retrying in 5 minutes.');
  await details.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('combobox', { name: 'Log' }).selectOption('send-errors');
  await expect(page.getByRole('table', { name: 'Send Errors' }).getByRole('row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear Log…' }).click();
  await page
    .getByRole('alertdialog', { name: 'Clear Send Errors?' })
    .getByRole('button', { name: 'Clear Log' })
    .click();
  await expect(page.getByRole('heading', { name: 'This log is empty.' })).toBeVisible();
  // App logs are files: choose one and search its lines.
  await page.getByRole('combobox', { name: 'Log' }).selectOption('app');
  await page.getByRole('searchbox', { name: 'Search the Log' }).fill('certificate');
  await expect(page.locator('.settings-page .settings-log-lines')).toHaveText(/IMAP certificate expired/);
  await expect(page.locator('.settings-page .settings-log-lines')).not.toContainText('quota');
  await expectNoOverflow(level(page, 'Logs').locator('.f-pane__scroll'));
});

for (const colorScheme of ['light', 'dark']) {
  test(`Status and Logs are accessible in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/settings.html#/status');
    await expect(page.getByRole('region', { name: 'Needs Attention' })).toBeVisible();
    await expectAccessible(page, '#settings');
    await page.goto('/settings.html#/logs');
    await expect(page.getByRole('table', { name: 'Outgoing Emails' })).toBeVisible();
    await expectAccessible(page, '#settings');
  });
}

test('a mailbox has a color from the named accents, which its row shows at once', async ({ page }) => {
  await page.goto('/settings.html#/mailboxes/support');
  const group = page.getByRole('radiogroup', { name: 'Color' });
  await expect(group.getByRole('radio')).toHaveCount(8);
  await expect(group.getByRole('radio', { name: 'Blue' })).toBeChecked();
  await group.getByRole('radio', { name: 'Green' }).check();
  await expect(
    level(page, 'Mailboxes')
      .getByRole('link', { name: /^Support/ })
      .locator('.settings-item__icon'),
  ).toHaveAttribute('data-fruit-mark', 'green');
});

test('a mailbox’s signature and automatic reply are written in Markdown and shown as sent', async ({ page }) => {
  await page.goto('/settings.html#/mailboxes/support');
  const mailbox = level(page, 'Support');
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
  await page.goto('/settings.html#/mailboxes/billing/auto-reply');
  const reply = level(page, 'Auto Reply');
  const message = reply.getByRole('textbox', { name: 'Message' });
  await selectMarkdown(message, { at: -1 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('Best, ');
  await reply.getByRole('button', { name: 'Insert Variable' }).click();
  await page.getByRole('menuitem', { name: 'Mailbox Name' }).click();
  await expect(page.locator('#settings-auto-body')).toHaveValue(/\nBest, \{%mailbox\.name%\}$/);
  await expect(reply.getByRole('figure', { name: 'Message as Sent' })).toContainText('Best, {%mailbox.name%}');
  // Off, the message, its toolbar and its preview step aside.
  await reply.getByRole('switch', { name: 'Send an automatic reply' }).uncheck();
  await expect(message).toBeDisabled();
  await expect(reply.getByRole('button', { name: 'Bold', exact: true })).toBeDisabled();
  // It takes no content, so the application's Insert Variable steps aside with the toolbar.
  await expect(reply.locator('.f-editor__toolbar')).toHaveJSProperty('inert', true);
  await expect(reply.getByRole('figure', { name: 'Message as Sent' })).toBeHidden();
});

test('a mailbox’s AI Assistant is one of its pages, and Settings › AI Assistant links to each', async ({ page }) => {
  await page.goto('/settings.html#/mailboxes/billing');
  const row = name => level(page, 'Billing').getByRole('link', { name: new RegExp(`^${name}`) });
  await expect(row('AI Assistant')).toHaveText(/On · Dutch/);
  await row('AI Assistant').click();
  const ai = level(page, 'AI Assistant');
  await expect(ai).toBeVisible();
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
  // With every feature off, the mailbox's row beside it says so.
  for (const name of ['Summaries', 'Translations', 'Drafts']) await ai.getByRole('switch', { name }).uncheck();
  await expect(row('AI Assistant')).toHaveText(/Off/);

  // The installation's page keeps providers and limits, and a row per mailbox that opens its AI page.
  await page.goto('/settings.html#/ai');
  const mailboxes = page.getByRole('region', { name: 'Mailboxes' });
  await expect(mailboxes.getByRole('link')).toHaveText([/Support.*On · English/, /Billing.*Off/, /Feedback.*Off/]);
  await page.getByLabel('Default Language', { exact: true }).selectOption('de');
  await expect(mailboxes.getByRole('link', { name: /^Support/ })).toHaveText(/On · German/);
  await mailboxes.getByRole('link', { name: /^Support/ }).click();
  await expect(page).toHaveURL(/#\/mailboxes\/support\/ai$/);
  await expect(level(page, 'AI Assistant').getByRole('combobox', { name: 'Language', exact: true })).toHaveValue(
    'default',
  );
  await expect(page.getByRole('option', { name: 'Default (German)' })).toBeAttached();
  // The sidebar, folded away beside three levels, still marks the way.
  await expect(workspace(page).locator('.settings-sidebar a[href="#/mailboxes"]')).toHaveAttribute(
    'aria-current',
    'true',
  );
});
