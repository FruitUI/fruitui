import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import { readFileSync, readdirSync } from 'node:fs';

const cssDirectory = new URL('../../src/css/', import.meta.url);

test('color and effect tokens are declared once and resolve per appearance', async ({ page }) => {
  const source = readFileSync(new URL('tokens.css', cssDirectory), 'utf8');
  const declarations = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const names = [...declarations.matchAll(/(--f-[\w-]+):/g)].map(([, name]) => name);
  expect(names.length).toBeGreaterThan(0);
  expect(new Set(names).size, 'each token has one declaration; use light-dark() for appearance pairs').toBe(
    names.length,
  );
  const paired = [...declarations.matchAll(/(--f-[\w-]+):[^;]*light-dark\(/g)].map(([, name]) => name);
  expect(paired.length).toBeGreaterThan(20);
  await page.goto('/components.html');
  const resolved = await page.evaluate(paired => {
    const probe = scheme => {
      const element = document.createElement('div');
      element.className = 'fruit-ui';
      element.dataset.theme = scheme;
      document.body.append(element);
      const values = paired.map(name => {
        element.style.setProperty('--probe', `var(${name})`);
        element.style.outlineColor = 'var(--probe)';
        element.style.boxShadow = 'var(--probe)';
        const style = getComputedStyle(element);
        return name.includes('shadow') ? style.boxShadow : style.outlineColor;
      });
      element.remove();
      return values;
    };
    return { light: probe('light'), dark: probe('dark') };
  }, paired);
  paired.forEach((name, index) =>
    expect(resolved.dark[index], `${name} differs in dark`).not.toBe(resolved.light[index]),
  );
});

test('core appearance declarations use shared tokens or native/system colors', () => {
  const appearanceProperty =
    /^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|inline-start|inline-end|block-start|block-end))?(?:-color)?|outline(?:-color)?|(?:box|text)-shadow|fill|stroke|accent-color|caret-color|text-decoration-color)$/;
  for (const file of readdirSync(cssDirectory).filter(name => name.endsWith('.css') && name !== 'tokens.css')) {
    const source = readFileSync(new URL(file, cssDirectory), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, property, value] of source.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=;|})/g)) {
      if (!appearanceProperty.test(property)) continue;
      let resolved = value;
      // Validate fallback literals too, resolving nested token references from the inside.
      while (/var\(--f-[\w-]+(?:,[^()]*)?\)/.test(resolved))
        resolved = resolved.replace(/var\(--f-[\w-]+(?:,([^()]*))?\)/g, (_, fallback) => fallback || '');
      const literal = resolved
        // color-mix() derives a color from tokens and keywords, which are checked like any other value.
        .replace(/color-mix\(in\s+[\w-]+/g, '')
        .replace(/linear-gradient\(\d+deg/g, '')
        .replace(/\//g, '')
        .replace(/[()]/g, '')
        .replace(
          /\b(?:none|transparent|currentColor|inherit|initial|unset|revert|inset|solid|dashed|dotted|double|ButtonText|Highlight|HighlightText|GrayText|Canvas|CanvasText)\b/g,
          '',
        )
        .replace(/-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%)?/g, '')
        .replace(/[\s,]/g, '');
      expect(literal, `${file}: ${property}: ${value.trim()} must use an appearance token`).toBe('');
    }
  }
});

test.describe('CSS appearance with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' });

  for (const scope of ['omitted', 'system', 'container']) {
    test(`${scope} scope follows live system changes and matches explicit dark mode`, async ({ page }) => {
      await page.goto('/components.html');
      await page.evaluate(scope => {
        const root = document.documentElement;
        if (scope !== 'system') root.removeAttribute('data-theme');
        if (scope === 'container') {
          root.classList.remove('fruit-ui');
          document.body.classList.add('fruit-ui');
        }
        // Native showModal lets this check include dialog and backdrop styling
        // without needing Alpine to open it.
        document.querySelector('dialog').showModal();
      }, scope);
      const root = page.locator(scope === 'container' ? 'body' : 'html');
      await expect(root).toHaveCSS('color-scheme', 'light');
      await expect(root).toHaveCSS('background-color', 'rgb(246, 245, 243)');

      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(root).toHaveCSS('color-scheme', 'dark');
      await expect(root).toHaveCSS('background-color', 'rgb(25, 25, 28)');
      await expect(page.locator('.f-card').first()).toHaveCSS('background-color', 'rgb(37, 37, 40)');
      await expect(page.getByLabel('Your Name')).toHaveCSS('background-color', 'rgb(57, 57, 62)');
      await expect(page.getByLabel('Default Mailbox')).toHaveCSS('color-scheme', 'dark');
      // Dialogs use the elevated surface, lighter than content in dark mode.
      await expect(page.locator('dialog[open]')).toHaveCSS('background-color', 'rgb(44, 44, 48)');
      expect(
        await page.locator('dialog[open]').evaluate(element => getComputedStyle(element, '::backdrop').backgroundColor),
      ).toBe('rgba(0, 0, 0, 0.5)');
      const automatic = await appearanceSnapshot(page);

      await root.evaluate(element => {
        element.dataset.theme = 'dark';
      });
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(root).toHaveCSS('color-scheme', 'dark');
      expect(await appearanceSnapshot(page)).toEqual(automatic);

      await root.evaluate((element, scope) => {
        if (scope === 'system') element.dataset.theme = 'system';
        else element.removeAttribute('data-theme');
      }, scope);
      await expect(root).toHaveCSS('color-scheme', 'light');
      await expect(root).toHaveCSS('background-color', 'rgb(246, 245, 243)');
    });
  }

  test('explicit light and dark container overrides hold as the system changes', async ({ page }) => {
    await page.goto('/components.html');
    await page.evaluate(() => {
      for (const theme of ['light', 'dark', 'system']) {
        const scope = document.createElement('section');
        scope.className = 'fruit-ui';
        scope.dataset.theme = theme;
        scope.id = `theme-${theme}`;
        scope.innerHTML = '<label>Option <select class="f-input"><option>One</option></select></label>';
        document.body.append(scope);
      }
    });
    for (const system of ['dark', 'light']) {
      await page.emulateMedia({ colorScheme: system });
      for (const theme of ['light', 'dark', 'system']) {
        const expected = theme === 'system' ? system : theme;
        const scope = page.locator(`#theme-${theme}`);
        await expect(scope).toHaveCSS('color-scheme', expected);
        await expect(scope.locator('select')).toHaveCSS('color-scheme', expected);
        await expect(scope).toHaveCSS(
          'background-color',
          expected === 'dark' ? 'rgb(25, 25, 28)' : 'rgb(246, 245, 243)',
        );
      }
    }
  });
});

for (const theme of ['light', 'dark']) {
  test(`gallery dialog is accessible in automatic ${theme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/components.html');
    await page.getByRole('button', { name: 'Open Dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCSS('color-scheme', theme);
    await expectAccessible(page);
  });
}

for (const theme of ['light', 'dark']) {
  test(`confirmations and toast tones are accessible in automatic ${theme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/components.html');
    await page.locator('#component-toast').getByRole('button', { name: 'Error' }).click();
    await page.locator('#component-copy-button').getByRole('button', { name: 'Copy Invite Link' }).click();
    await expect(page.locator('#component-suggestion').getByRole('region', { name: 'AI draft' })).toBeVisible();
    await page.locator('#component-remote-dialog').getByRole('link', { name: 'Merge Conversation…' }).click();
    await expect(page.getByRole('dialog', { name: 'Merge Conversation' }).getByRole('combobox')).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await page.locator('#component-confirm').getByRole('button', { name: 'Delete Conversation…' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCSS('color-scheme', theme);
    await expectAccessible(page);
  });
}

async function appearanceSnapshot(page) {
  return page.locator('[class*="f-"]').evaluateAll(elements =>
    elements.flatMap(element => {
      const styles = [getComputedStyle(element)];
      if (element.matches('.f-switch > input')) styles.push(getComputedStyle(element, '::before'));
      if (element.matches('dialog')) styles.push(getComputedStyle(element, '::backdrop'));
      return styles.map(style => [
        style.color,
        style.backgroundColor,
        style.borderColor,
        style.boxShadow,
        style.colorScheme,
        style.accentColor,
      ]);
    }),
  );
}

test('text follows the reader’s browser text size and a pixel-root host can pin it', async ({ page }) => {
  await page.goto('/components.html');
  const input = page.getByLabel('Your Name');
  // An html scope must not redefine rem through its own font size.
  await expect(page.locator('html')).toHaveCSS('font-size', '16px');
  await expect(page.locator('body')).toHaveCSS('font-size', '16px');
  // Controls read at the base size: the reader's own text size, 1rem.
  await expect(input).toHaveCSS('font-size', '16px');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '20px';
  });
  await expect(input).toHaveCSS('font-size', '20px');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '10px';
    document.documentElement.style.setProperty('--f-text-root', '16px');
  });
  await expect(input).toHaveCSS('font-size', '16px');
});

test('Increase Contrast strengthens boundaries and secondary text in both appearances', async ({ page }) => {
  await page.goto('/components.html');
  const input = page.getByLabel('Your Name');
  // Firefox applies contrast emulation only to newly loaded documents.
  const emulate = async media => {
    await page.emulateMedia(media);
    await page.reload();
  };
  for (const colorScheme of ['light', 'dark']) {
    await emulate({ colorScheme, contrast: 'no-preference' });
    const normal = await input.evaluate(element => getComputedStyle(element).borderTopColor);
    await emulate({ colorScheme, contrast: 'more' });
    const more = await input.evaluate(element => getComputedStyle(element).borderTopColor);
    expect(more, `${colorScheme} border`).not.toBe(normal);
    const alpha = value => Number(value.match(/[\d.]+(?=\)$)/)?.[0] ?? 1);
    expect(alpha(more)).toBeGreaterThan(alpha(normal));
  }
});

test('pressed controls show the shared pressed overlay', async ({ page }) => {
  await page.goto('/components.html');
  const button = page.locator('#component-button').getByRole('button', { name: 'Default' });
  await expect(button).toHaveCSS('background-image', 'none');
  await button.hover();
  await page.mouse.down();
  await expect(button).not.toHaveCSS('background-image', 'none');
  await page.mouse.up();
});

test('Tailwind v4 utilities win once the documented layer order is declared', async ({ page }) => {
  const fixture = order => `<!doctype html><html class="fruit-ui" lang="en"><head><title>Layers</title>
    <style>${order}</style><link rel="stylesheet" href="/src/fruitui.css">
    <style>@layer utilities { .w-64 { width: 16rem; } }</style></head>
    <body><main><label for="sized">Sized</label><input id="sized" class="f-input w-64"></main></body></html>`;
  await page.route('**/layers-documented', route =>
    route.fulfill({ contentType: 'text/html', body: fixture('@layer theme, base, fruit, components, utilities;') }),
  );
  await page.route('**/layers-undeclared', route =>
    route.fulfill({ contentType: 'text/html', body: fixture('@layer theme, base, components, utilities;') }),
  );
  await page.goto('/layers-documented');
  await expect(page.getByLabel('Sized')).toHaveCSS('width', '256px');
  await page.goto('/layers-undeclared');
  await expect(page.getByLabel('Sized')).not.toHaveCSS('width', '256px');
});

test('data-theme="class" follows a Tailwind-style dark class instead of the system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/components.html');
  const html = page.locator('html');
  // The gallery's appearance switcher sets data-theme as Alpine starts; change it only after that.
  await expect(html).toHaveAttribute('data-theme', 'system');
  await html.evaluate(element => {
    element.dataset.theme = 'class';
    element.classList.remove('dark');
  });
  await expect(html).toHaveCSS('color-scheme', 'light');
  await html.evaluate(element => element.classList.add('dark'));
  await expect(html).toHaveCSS('color-scheme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveCSS('color-scheme', 'dark');
  // A nested scope can follow a .dark class on an ancestor.
  const nested = await page.evaluate(() => {
    document.documentElement.classList.remove('dark', 'fruit-ui');
    document.body.classList.add('dark');
    const scope = document.createElement('div');
    scope.className = 'fruit-ui';
    scope.dataset.theme = 'class';
    document.body.append(scope);
    return getComputedStyle(scope).colorScheme;
  });
  expect(nested).toBe('dark');
});

test('one brand tint recolors every accent shade in both appearances', async ({ page }) => {
  await page.goto('/components.html');
  const tokens = ['--f-accent', '--f-accent-fill', '--f-accent-fill-hover', '--f-selection', '--f-selection-text'];
  // Resolve each token to sRGB bytes through a canvas, whatever color syntax the engine reports.
  const shades = () =>
    page.evaluate(names => {
      const probe = document.createElement('div');
      document.querySelector('.fruit-ui').append(probe);
      const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const colors = Object.fromEntries(
        names.map(token => {
          probe.style.color = `var(${token})`;
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = getComputedStyle(probe).color;
          context.fillRect(0, 0, 1, 1);
          return [token, [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)];
        }),
      );
      probe.remove();
      return colors;
    }, tokens);
  const hex = value => [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
  // The default tint reproduces the previously hand-tuned shades.
  const tuned = {
    light: ['#006cde', '#0064d0', '#0055b5', '#e2edff', '#0759b1'],
    dark: ['#3c96ff', '#0064d0', '#0055b5', '#263e5a', '#9dcbff'],
  };
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await page.evaluate(() => document.querySelector('.fruit-ui').style.removeProperty('--f-tint'));
    const blue = await shades();
    tokens.forEach((token, index) => {
      const [r, g, b] = blue[token],
        [tr, tg, tb] = hex(tuned[colorScheme][index]);
      expect(Math.hypot(r - tr, g - tg, b - tb), `${colorScheme} ${token}`).toBeLessThan(8);
    });
    await page.evaluate(() => document.querySelector('.fruit-ui').style.setProperty('--f-tint', '#248a3d'));
    const green = await shades();
    for (const token of tokens) expect(green[token], `${colorScheme} ${token}`).not.toEqual(blue[token]);
    // Green tints keep green fills, not blue ones.
    expect(green['--f-accent-fill'][1]).toBeGreaterThan(green['--f-accent-fill'][2]);
  }
});

test('the compat build honours data-theme and keeps headings in the text color against host rules', async ({
  page,
}) => {
  const css = readFileSync(new URL('../../build/core.compat.css', import.meta.url), 'utf8');
  // A legacy host colors every heading; an application class still restyles its own heading.
  await page.setContent(`<!doctype html><html><head><style>${css}</style>
    <style>h1, h2, h3, h4, h5, h6 { color: #2a3b47 } .app-title { color: rgb(200, 0, 0) }</style></head>
    <body><main class="fruit-ui" data-theme="dark"><h2>Settings</h2><h3 class="app-title">Own</h3></main>
    <div class="dark"><section class="fruit-ui" data-theme="class"><h2>Class mode</h2></section></div></body></html>`);
  const main = page.locator('main');
  await expect(main).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('section')).toHaveCSS('color-scheme', 'dark');
  const text = await main.evaluate(element => getComputedStyle(element).color);
  await expect(page.locator('main h2')).toHaveCSS('color', text);
  await expect(page.locator('main h2')).not.toHaveCSS('color', 'rgb(42, 59, 71)');
  await expect(page.locator('.app-title')).toHaveCSS('color', 'rgb(200, 0, 0)');
});

test('the compat build keeps choice groups and legends intact under Bootstrap 3 base rules', async ({ page }) => {
  const css = readFileSync(new URL('../../build/core.compat.css', import.meta.url), 'utf8');
  // Bootstrap 3's label and legend rules, as on a host page that loads both.
  const bootstrap = `label { display: inline-block; max-width: 100%; margin-bottom: 5px; font-weight: bold }
    legend { display: block; width: 100%; padding: 0; margin-bottom: 20px; font-size: 21px; line-height: inherit;
      color: #333; border: 0; border-bottom: 1px solid #e5e5e5 }`;
  await page.setContent(`<!doctype html><html><head><style>${bootstrap}</style><style>${css}</style></head>
    <body><main class="fruit-ui" data-theme="dark" style="width: 900px"><fieldset class="f-fieldset">
      <legend>Permissions</legend>
      <label class="f-check"><input type="checkbox"><span>Tags</span></label>
      <label class="f-check"><input type="checkbox"><span>Folders</span></label>
      <label class="f-switch"><input type="checkbox" role="switch"><span>Photos</span></label>
    </fieldset></main></body></html>`);
  const boxes = await Promise.all(['Tags', 'Folders', 'Photos'].map(name => page.getByText(name).boundingBox()));
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y + boxes[0].height);
  expect(boxes[2].y).toBeGreaterThan(boxes[1].y + boxes[1].height);
  const label = page.locator('label.f-check').first();
  await expect(label).toHaveCSS('display', 'flex');
  await expect(label).toHaveCSS('margin-bottom', '0px');
  await expect(label).toHaveCSS('font-weight', '400');
  const legend = page.locator('legend');
  const text = await page.locator('main').evaluate(element => getComputedStyle(element).color);
  await expect(legend).toHaveCSS('color', text);
  await expect(legend).toHaveCSS('border-bottom-style', 'none');
  expect((await legend.boundingBox()).width).toBeLessThan(300);
});

test('the compat build keeps code, keyboard keys and code blocks in the text color under Bootstrap 3', async ({
  page,
}) => {
  const css = readFileSync(new URL('../../build/core.compat.css', import.meta.url), 'utf8');
  const bootstrap = `code { padding: 2px 4px; font-size: 90%; color: #c7254e; background-color: #f9f2f4; border-radius: 4px }
    kbd { padding: 2px 4px; font-size: 90%; color: #fff; background-color: #333; border-radius: 3px }
    pre { display: block; padding: 9.5px; margin: 0 0 10px; color: #333; word-break: break-all; word-wrap: break-word;
      background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px }`;
  await page.setContent(`<!doctype html><html><head><style>${bootstrap}</style><style>${css}</style></head>
    <body><main class="fruit-ui" data-theme="dark"><p>Key <code>npub1abc</code> <kbd>⌘</kbd></p>
    <pre><code>const ready = true;</code></pre></main></body></html>`);
  const text = await page.locator('main').evaluate(element => getComputedStyle(element).color);
  for (const selector of ['p code', 'kbd', 'pre', 'pre code'])
    await expect(page.locator(selector)).toHaveCSS('color', text);
  await expect(page.locator('pre')).toHaveCSS('word-break', 'normal');
  await expect(page.locator('pre')).not.toHaveCSS('background-color', 'rgb(245, 245, 245)');
});

test('components rendered as links need no host link reset in either build', async ({ page }) => {
  // No host stylesheet at all: the browser's own underlined, blue links are all that remain to override.
  const links = `
    <a class="f-item-row" href="#"><span class="f-item-row__top"><span class="f-item-row__title">Sophie</span><span class="f-item-row__time">10:42</span></span><span class="f-item-row__subtitle">Team Plan</span><span class="f-item-row__preview">Preview</span><span class="f-item-row__meta">Work</span></a>
    <div class="f-menu__items" role="menu"><a class="f-menu-item" role="menuitem" href="#">Open</a></div>
    <nav class="f-sidebar"><a class="f-sidebar__item" href="#">Inbox</a></nav>
    <nav class="f-section-nav"><a href="#" aria-current="page">General</a><a href="#">Connection</a></nav>
    <a class="f-button" href="#">Edit</a><a class="f-button f-button--primary" href="#">New Conversation</a>
    <a class="f-button f-button--ghost f-back" href="#"><span>Back</span></a>
    <nav class="f-breadcrumbs"><ol><li><a href="#">Customers</a></li></ol></nav>
    <div role="listbox"><a class="f-command" role="option" href="#">Support</a></div>
    <div class="f-tabs" role="tablist"><a class="f-tab" role="tab" href="#" aria-selected="true">Details</a></div>
    <a class="f-attachment" href="#"><span class="f-attachment__body"><strong>Notes</strong></span></a>
    <nav class="f-pagination"><a href="#">Next</a></nav>
    <ol class="f-notifications"><li class="f-notifications__item"><a href="#">Sophie replied</a></li></ol>`;
  // A compat host loads core and layout; the layered all-in-one file has both.
  for (const files of [['build/core.compat.css', 'build/layout.compat.css'], ['build/fruitui.css']]) {
    const file = files.join(' + ');
    const css = files.map(name => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8')).join('\n');
    await page.setContent(
      `<!doctype html><html><head><style>${css}</style></head><body class="fruit-ui">${links}</body></html>`,
    );
    const report = await page.evaluate(() =>
      [...document.querySelectorAll('a'), ...document.querySelectorAll('a *')].map(element => {
        const style = getComputedStyle(element);
        return { name: element.className || element.tagName, line: style.textDecorationLine, color: style.color };
      }),
    );
    for (const { name, line, color } of report) {
      expect(line, `${file} ${name}`).toBe('none');
      expect(color, `${file} ${name}`).not.toBe('rgb(0, 0, 238)');
    }
  }
});

test('every form-section row spans the group, and a disclosure row has no box of its own', async ({ page }) => {
  const css = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body class="fruit-ui">
    <section class="f-form-section" style="width: 600px"><div class="f-form-section__rows">
      <label class="f-check"><input type="checkbox"><span>Short</span></label>
      <div class="f-choice"><label class="f-check"><input type="checkbox" aria-describedby="d"><span>Tags</span></label>
        <p class="f-help f-choice__description" id="d">Shown on conversations.</p></div>
      <details class="f-disclosure"><summary>Advanced</summary><div>More settings</div></details>
    </div></section></body></html>`);
  const rows = page.locator('.f-form-section__rows > *');
  const width = await page.locator('.f-form-section__rows').evaluate(element => element.clientWidth);
  for (const row of await rows.all()) expect((await row.boundingBox()).width).toBeCloseTo(width, 0);
  const disclosure = page.locator('.f-disclosure');
  await expect(disclosure).toHaveCSS('border-left-width', '0px');
  await expect(disclosure).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(disclosure).toHaveCSS('border-top-width', '1px');
  await expect(page.locator('.f-choice')).toHaveCSS('border-top-width', '1px');
});

test('links in a message author and time keep the header text style until hovered', async ({ page }) => {
  const css = readFileSync(new URL('../../build/fruitui.css', import.meta.url), 'utf8');
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body class="fruit-ui">
    <article class="f-message"><header class="f-message__header"><span class="f-message__identity">
      <strong class="f-message__author"><a href="#customer">Sophie Chen</a></strong></span>
      <time class="f-message__time"><a href="#thread-123" title="2 October 2026, 10:42">10:42 AM</a></time></header>
      <div class="f-message__body">Hello</div></article>
    <div class="f-message-event"><span class="f-message-event__text">Assigned</span><time class="f-message-event__time"><a href="#event-9">10:45 AM</a></time></div>
    </body></html>`);
  for (const [link, holder] of [
    ['.f-message__author a', '.f-message__author'],
    ['.f-message__time a', '.f-message__time'],
    ['.f-message-event__time a', '.f-message-event__time'],
  ]) {
    const color = await page.locator(holder).evaluate(element => getComputedStyle(element).color);
    await expect(page.locator(link)).toHaveCSS('color', color);
    await expect(page.locator(link)).toHaveCSS('text-decoration-line', 'none');
    await page.locator(link).hover();
    await expect(page.locator(link)).toHaveCSS('text-decoration-line', 'underline');
  }
});
