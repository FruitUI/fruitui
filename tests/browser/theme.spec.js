import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync } from 'node:fs';

const cssDirectory = new URL('../../src/css/', import.meta.url);

test('every color/effect token has matching automatic and explicit dark palettes', async ({ page }) => {
  const source = readFileSync(new URL('tokens.css', cssDirectory), 'utf8');
  const palettes = [...source.matchAll(/:where\([^{]+\)\s*\{([^}]+)\}/g)].map(([, block]) =>
    Object.fromEntries([...block.matchAll(/(--f-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])),
  );
  expect(palettes).toHaveLength(3);
  const [light, explicitDark, automaticDark] = palettes;
  // Tokens derived from other tokens (var(--f-…)) follow their source in every appearance.
  // CSS.supports accepts any value containing var(), so only literal values are classified.
  const literal = Object.fromEntries(Object.entries(light).filter(([, value]) => !value.includes('var(--f-')));
  const appearanceTokens = await page.evaluate(
    palette =>
      Object.entries(palette)
        .filter(([, value]) => CSS.supports('color', value) || CSS.supports('box-shadow', value))
        .map(([name]) => name),
    literal,
  );
  expect(appearanceTokens.length).toBeGreaterThan(0);
  for (const name of appearanceTokens) {
    expect(explicitDark, `${name} needs a dark value`).toHaveProperty(name);
  }
  expect(Object.keys(explicitDark).sort()).toEqual(appearanceTokens.sort());
  expect(automaticDark).toEqual(explicitDark);
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
      await expect(page.getByLabel('Your name')).toHaveCSS('background-color', 'rgb(57, 57, 62)');
      await expect(page.getByLabel('Default mailbox')).toHaveCSS('color-scheme', 'dark');
      await expect(page.locator('dialog[open]')).toHaveCSS('background-color', 'rgb(37, 37, 40)');
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
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCSS('color-scheme', theme);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(violations).toEqual([]);
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
  const input = page.getByLabel('Your name');
  // An html scope must not redefine rem through its own font size.
  await expect(page.locator('html')).toHaveCSS('font-size', '16px');
  await expect(page.locator('body')).toHaveCSS('font-size', '14px');
  await expect(input).toHaveCSS('font-size', '13px');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '20px';
  });
  await expect(input).toHaveCSS('font-size', '16.25px');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '10px';
    document.documentElement.style.setProperty('--f-text-root', '16px');
  });
  await expect(input).toHaveCSS('font-size', '13px');
});

test('Increase Contrast strengthens boundaries and secondary text in both appearances', async ({ page }) => {
  await page.goto('/components.html');
  const input = page.getByLabel('Your name');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, contrast: 'no-preference' });
    const normal = await input.evaluate(element => getComputedStyle(element).borderTopColor);
    await page.emulateMedia({ colorScheme, contrast: 'more' });
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
