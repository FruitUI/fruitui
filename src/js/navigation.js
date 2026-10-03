import { fruitId } from './control-bridge.js';
import { fruitPopup } from './popup.js';

export function fruitMenu() {
  let details,
    trigger,
    popup,
    overlay,
    outside,
    keydown,
    click,
    toggle,
    timer,
    search = '',
    searchTimer;
  const owns = node => node?.closest('[data-fruit-menu], [x-data^="fruitMenu"]') === details;
  const items = () =>
    [...popup.querySelectorAll('[role="menuitem"]')].filter(
      item =>
        owns(item) &&
        !item.matches(':disabled') &&
        item.getAttribute('aria-disabled') !== 'true' &&
        item.getClientRects().length,
    );
  const close = restore => {
    details.open = false;
    overlay.hide();
    trigger.setAttribute('aria-expanded', 'false');
    if (restore) trigger.focus();
  };
  const focus = index => {
    const enabled = items();
    if (enabled.length) enabled[(index + enabled.length) % enabled.length].focus();
  };
  return {
    init() {
      details = this.$el;
      details.setAttribute('data-fruit-menu', '');
      trigger = details.querySelector('summary');
      popup = details.querySelector('[role="menu"]');
      if (!trigger || !popup) return;
      overlay = fruitPopup(popup, trigger, { above: details.dataset.placement === 'above' });
      popup.id ||= fruitId('fruit-menu');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-controls', popup.id);
      popup.querySelectorAll('[role="menuitem"]').forEach(item => {
        if (owns(item)) item.tabIndex = -1;
      });
      toggle = event => {
        if (event.target !== details) return;
        trigger.setAttribute('aria-expanded', String(details.open));
        if (details.open) {
          overlay.show();
          if (document.activeElement === trigger) focus(0);
        } else overlay.hide();
      };
      trigger.setAttribute('aria-expanded', String(details.open));
      details.addEventListener('toggle', toggle);
      outside = event => {
        if (!details.contains(event.target)) close(false);
      };
      keydown = event => {
        if (!owns(event.target)) return;
        const enabled = items(),
          index = enabled.indexOf(document.activeElement);
        if (event.target === trigger && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault();
          details.open = true;
          overlay.show();
          focus(event.key === 'ArrowDown' ? 0 : enabled.length - 1);
        } else if (details.open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          focus(
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? enabled.length - 1
                : index + (event.key === 'ArrowDown' ? 1 : -1),
          );
        } else if (details.open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        } else if (details.open && event.key === 'Tab') {
          timer = setTimeout(() => close(false), 0);
        } else if (
          details.open &&
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          event.preventDefault();
          clearTimeout(searchTimer);
          search += event.key.toLocaleLowerCase();
          const ordered = [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
          ordered.find(item => item.textContent.trim().toLocaleLowerCase().startsWith(search))?.focus();
          searchTimer = setTimeout(() => {
            search = '';
          }, 600);
        }
      };
      click = event => {
        const item = event.target.closest('[role="menuitem"]');
        if (owns(item) && !item.matches(':disabled') && item.getAttribute('aria-disabled') !== 'true') close(true);
      };
      document.addEventListener('pointerdown', outside);
      details.addEventListener('keydown', keydown);
      popup.addEventListener('click', click);
      if (details.open) overlay.show();
    },
    destroy() {
      clearTimeout(timer);
      clearTimeout(searchTimer);
      overlay?.destroy();
      document.removeEventListener('pointerdown', outside);
      details?.removeEventListener('keydown', keydown);
      details?.removeEventListener('toggle', toggle);
      popup?.removeEventListener('click', click);
    },
  };
}

export function fruitTooltip() {
  let root, keydown, leave, enter, overlay;
  return {
    init() {
      root = this.$el;
      const text = root.querySelector('[role="tooltip"]');
      if (text) overlay = fruitPopup(text, root.firstElementChild);
      enter = () => {
        if (!root.hasAttribute('data-dismissed')) overlay?.show();
      };
      keydown = event => {
        if (event.key === 'Escape' && (root.matches(':hover') || root.contains(document.activeElement))) {
          root.setAttribute('data-dismissed', '');
          overlay?.hide();
          event.stopPropagation();
        }
      };
      leave = event => {
        if (!root.contains(event.relatedTarget)) {
          root.removeAttribute('data-dismissed');
          if (!root.matches(':hover') && !root.contains(document.activeElement)) overlay?.hide();
        }
      };
      document.addEventListener('keydown', keydown);
      root.addEventListener('mouseleave', leave);
      root.addEventListener('focusout', leave);
      root.addEventListener('mouseenter', enter);
      root.addEventListener('focusin', enter);
    },
    destroy() {
      overlay?.destroy();
      document.removeEventListener('keydown', keydown);
      root.removeEventListener('mouseleave', leave);
      root.removeEventListener('focusout', leave);
      root.removeEventListener('mouseenter', enter);
      root.removeEventListener('focusin', enter);
    },
  };
}

/** In-page tabs only; navigation links retain ordinary link semantics. */
export function fruitTabs() {
  let root, keydown, click, observer;
  const owns = node => node?.closest('[data-fruit-tabs], [x-data^="fruitTabs"]') === root;
  const all = () => [...root.querySelectorAll('[role="tab"]')].filter(owns);
  const tabs = () => all().filter(tab => !tab.matches(':disabled') && tab.getAttribute('aria-disabled') !== 'true');
  const activate = tab => {
    for (const item of all()) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = [...root.querySelectorAll('[role="tabpanel"]')].find(
        panel => owns(panel) && panel.id === item.getAttribute('aria-controls'),
      );
      if (panel) panel.hidden = !selected;
    }
  };
  const reconcile = () => activate(tabs().find(tab => tab.getAttribute('aria-selected') === 'true') || tabs()[0]);
  return {
    init() {
      root = this.$el;
      root.setAttribute('data-fruit-tabs', '');
      reconcile();
      click = event => {
        const tab = event.target.closest('[role="tab"]');
        if (tabs().includes(tab)) activate(tab);
      };
      keydown = event => {
        const enabled = tabs(),
          index = enabled.indexOf(event.target);
        if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const rtl = getComputedStyle(root).direction === 'rtl';
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? enabled.length - 1
              : (index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1) + enabled.length) % enabled.length;
        activate(enabled[next]);
        enabled[next].focus();
      };
      root.addEventListener('click', click);
      root.addEventListener('keydown', keydown);
      observer = new MutationObserver(reconcile);
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
      });
    },
    destroy() {
      observer.disconnect();
      root.removeEventListener('click', click);
      root.removeEventListener('keydown', keydown);
    },
  };
}

/** Native disclosure controls keep their own semantics; reuse popup placement only. */
export function fruitFloatingDisclosure() {
  let details, trigger, overlay, outside, escape, toggle;
  return {
    init() {
      details = this.$el;
      trigger = details.querySelector('summary');
      const content = details.querySelector('.f-floating-disclosure__content');
      if (trigger && content)
        overlay = fruitPopup(content, trigger, { above: details.classList.contains('f-floating-disclosure--above') });
      outside = event => {
        if (details.open && !details.contains(event.target)) this.close();
      };
      escape = event => {
        if (event.key === 'Escape' && details.open && event.target.closest('.f-floating-disclosure') === details) {
          event.preventDefault();
          event.stopPropagation();
          this.close(true);
        }
      };
      toggle = event => {
        if (event.target === details) {
          if (details.open) overlay?.show();
          else overlay?.hide();
        }
      };
      document.addEventListener('pointerdown', outside);
      details.addEventListener('keydown', escape);
      details.addEventListener('toggle', toggle);
      if (details.open) overlay?.show();
    },
    close(restoreFocus = false) {
      overlay?.hide();
      details.open = false;
      if (restoreFocus) trigger?.focus();
    },
    destroy() {
      overlay?.destroy();
      document.removeEventListener('pointerdown', outside);
      details.removeEventListener('keydown', escape);
      details.removeEventListener('toggle', toggle);
    },
  };
}
