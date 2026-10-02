let sequence = 0;
export const fruitId = prefix => `${prefix}-${++sequence}`;

/** Keep the native named control authoritative, including Alpine/Livewire events. */
export function publishValue(control, value) {
  control.value = value;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

export function bridgeControl(component, control, query, sync) {
  const cleanups = [];
  const listen = (node, event, handler) => {
    node?.addEventListener(event, handler);
    cleanups.push(() => node?.removeEventListener(event, handler));
  };
  const labels = () => [...(control.labels || [])];
  listen(control.ownerDocument, 'click', event => {
    if (labels().some(label => label.contains(event.target)) && (event.target === control || !event.target.closest('button, a, input, select, textarea'))) { event.preventDefault(); query.focus(); }
  });
  const attributes = () => {
    // Server morphs may remove this owned attribute or replace a label.
    if (!control.hidden) control.hidden = true;
    const currentLabels = labels();
    for (const label of currentLabels) label.id ||= fruitId('fruit-label');
    for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-invalid']) {
      if (control.hasAttribute(name)) query.setAttribute(name, control.getAttribute(name));
      else query.removeAttribute(name);
    }
    if (!query.hasAttribute('aria-label') && !query.hasAttribute('aria-labelledby') && currentLabels.length) {
      query.setAttribute('aria-labelledby', currentLabels.map(label => label.id).join(' '));
    }
    query.setAttribute('aria-required', String(control.required));
    query.tabIndex = control.matches(':disabled') ? -1 : control.tabIndex;
    if (control.hasAttribute('dir')) query.setAttribute('dir', control.getAttribute('dir'));
    if ('disabled' in query) query.disabled = control.matches(':disabled');
    if ('readOnly' in query) query.readOnly = control.readOnly || false;
    sync();
  };
  const valueChanged = () => { if ('value' in query) query.value = ''; query.setCustomValidity?.(''); attributes(); };
  listen(control, 'input', valueChanged);
  listen(control, 'change', valueChanged);
  listen(control, 'invalid', event => { event.preventDefault(); query.focus(); query.setAttribute('aria-invalid', 'true'); });
  let resetTimer;
  listen(control.form, 'reset', event => {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { if (!event.defaultPrevented) { if ('value' in query) query.value = ''; query.setCustomValidity?.(''); attributes(); } }, 0);
  });
  const observer = new MutationObserver(attributes);
  observer.observe(control, { attributes: true, childList: true, subtree: true });
  if (control.closest('fieldset')) observer.observe(control.closest('fieldset'), { attributes: true, attributeFilter: ['disabled'] });
  component.$nextTick(() => {
    if (control._x_model) cleanups.push(component.$watch(() => control._x_model.get(), () => component.$nextTick(valueChanged)));
    attributes();
  });
  attributes();
  return () => { observer.disconnect(); clearTimeout(resetTimer); cleanups.forEach(dispose => dispose?.()); };
}
