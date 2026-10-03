import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('docs/component-catalog.json', root), 'utf8'));

test('every public CSS family and Blade adapter is registered in the catalog', () => {
  const cssDirectory = new URL('src/css/', root);
  const css = readdirSync(cssDirectory, { recursive: true })
    .filter(name => name.endsWith('.css'))
    .map(name => readFileSync(new URL(name, cssDirectory), 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const families = [...new Set([...css.matchAll(/\.(f-[\w-]+)/g)].map(([, name]) => name.split(/__|--/)[0]))].sort();
  expect(
    [...new Set(catalog.flatMap(entry => entry.classes))].sort(),
    'New CSS families need a catalog entry and gallery specimen',
  ).toEqual(families);
  expect(new Set(catalog.map(entry => entry.id)).size).toBe(catalog.length);
  const adapters = readdirSync(new URL('resources/views/components/', root), { recursive: true })
    .filter(name => name.endsWith('.blade.php'))
    .map(name => name.replace('.blade.php', '').replace(/[\\/]/g, '.'))
    .sort();
  expect(catalog.flatMap(entry => entry.blade).sort(), 'Every Blade adapter needs gallery usage').toEqual(adapters);
});

test('every catalog entry has a live specimen plus HTML and Blade usage', async ({ page }) => {
  await page.goto('/components.html');
  await expect(page.locator('[data-component]')).toHaveCount(catalog.length);
  // One page round trip keeps this proportional to the catalog in every browser.
  const specimens = await page.evaluate(entries => {
    const index = document.querySelector('nav[aria-label="Component index"]');
    return entries.map(({ id, classes }) => {
      const element = document.querySelector(`[data-component="${id}"]`);
      const sources = [...(element?.querySelectorAll('.gallery-source') ?? [])];
      return {
        id: element?.id,
        missing: classes.filter(family => !element?.matches(`.${family}`) && !element?.querySelector(`.${family}`)),
        summaries: sources.map(source => source.querySelector(':scope > summary')?.textContent.trim()),
        blade: sources.at(-1)?.querySelector('pre')?.textContent ?? '',
        links: index?.querySelectorAll(`a[href="#component-${id}"]`).length ?? 0,
      };
    });
  }, catalog);
  catalog.forEach((entry, i) => {
    const specimen = specimens[i];
    expect(specimen.id, entry.id).toBe(`component-${entry.id}`);
    expect(specimen.missing, `${entry.id} needs live specimens for every family`).toEqual([]);
    expect(specimen.summaries, entry.id).toEqual(['HTML & CSS', 'Blade']);
    for (const adapter of entry.blade) expect(specimen.blade, entry.id).toContain(`<x-fruit::${adapter}`);
    expect(specimen.links, `${entry.id} is in the component index`).toBe(1);
  });
});

test('extracted patterns have at least two actual example consumers', () => {
  for (const entry of catalog.filter(entry => entry.kind === 'pattern')) {
    expect(new Set(entry.uses).size, `${entry.id} needs evidence of reuse`).toBeGreaterThanOrEqual(2);
    for (const file of entry.uses) {
      expect(file).not.toBe('components.html');
      const source = readFileSync(new URL(file, root), 'utf8');
      // Blade examples may use the entry's adapter instead of writing its classes.
      if (file.endsWith('.blade.php') && entry.blade.some(adapter => source.includes(`<x-fruit::${adapter}`))) continue;
      const classes = [...source.matchAll(/class="([^"<>]+)"/g)].flatMap(([, names]) => names.split(/\s+/));
      for (const family of entry.classes) expect(classes, `${file} must actually use ${family}`).toContain(family);
    }
  }
});

test('the policy contract table is generated from the catalog', async () => {
  const { renderPolicy } = await import('../../scripts/build-docs.mjs');
  const policy = readFileSync(new URL('docs/component-policy.md', root), 'utf8');
  expect(renderPolicy(policy, catalog), 'Run npm run build:docs').toBe(policy);
});
