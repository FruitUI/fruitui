import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** The accessibility standard every page and state is checked against. */
export const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

/** No axe violations on the page, or only within the given selectors. */
export async function expectAccessible(page, ...include) {
  let builder = new AxeBuilder({ page }).withTags(wcag);
  for (const selector of include) builder = builder.include(selector);
  expect((await builder.analyze()).violations).toEqual([]);
}

/** Neither the page nor the given container scrolls horizontally. */
export async function expectNoOverflow(page, container) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (container)
    expect(await page.locator(container).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}

/** A color token resolved by the page, spelled the way this engine reports computed colors. */
export function tokenColor(page, token) {
  return page.evaluate(name => {
    const probe = document.createElement('span');
    (document.querySelector('.fruit-ui') ?? document.body).append(probe);
    probe.style.color = `var(${name})`;
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

/**
 * Select in a Markdown editor's surface as a person would, with the pointer or Shift+arrows: the first
 * `text` from offset `from` of its Markdown, or a caret `at` an offset (negative counts from the end).
 */
export function selectMarkdown(field, { text, from = 0, at } = {}) {
  return field.evaluate(
    async (element, { text, from, at }) => {
      const lines = [...element.children];
      const value = lines.map(line => line.textContent).join('\n');
      const start = text === undefined ? (at < 0 ? value.length + at + 1 : at) : value.indexOf(text, from);
      const end = text === undefined ? start : start + text.length;
      const point = offset => {
        let line = 0;
        while (offset > lines[line].textContent.length) offset -= lines[line++].textContent.length + 1;
        const walker = document.createTreeWalker(lines[line], NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (offset <= node.data.length) return [node, offset];
          offset -= node.data.length;
        }
        return [lines[line], 0];
      };
      // The editor puts its own selection back just after it takes focus.
      if (document.activeElement !== element) {
        element.focus();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      const range = document.createRange();
      range.setStart(...point(start));
      range.setEnd(...point(end));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      // The editor reads the selection on selectionchange: let it, before the next key or click.
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
    },
    { text, from, at },
  );
}

/** How many lines of a Show More's text show in full while it is collapsed, and how many it has. */
export function shownLines(content) {
  return content.evaluate(element => {
    const origin = element.getBoundingClientRect().top - element.scrollTop;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const tops = new Set();
    let shown = 0;
    while (walker.nextNode()) {
      range.selectNodeContents(walker.currentNode);
      for (const rect of range.getClientRects()) {
        const top = Math.round(rect.top - origin);
        if (!rect.width || tops.has(top)) continue;
        tops.add(top);
        if (rect.bottom - origin <= element.clientHeight + 1) shown++;
      }
    }
    return { shown, total: tops.size };
  });
}
