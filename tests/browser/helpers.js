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
