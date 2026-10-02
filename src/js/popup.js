/** Use the browser top layer to avoid clipping by scrollable panes/dialogs. */
export function fruitPopup(popup, anchor, { stretch = false, above = false } = {}) {
  const supported = typeof popup.showPopover === 'function';
  const originalStyle = popup.getAttribute('style');
  let showing = false;
  if (supported) popup.popover = 'manual';
  const position = () => {
    if (!showing || !supported) return;
    const rect = anchor.getBoundingClientRect(), viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
    popup.style.position = 'fixed'; popup.style.inset = 'auto'; popup.style.margin = '0'; popup.style.transform = 'none';
    popup.style.maxWidth = `${Math.max(0, width - 16)}px`;
    popup.style.maxHeight = `${Math.max(40, height - 16)}px`;
    popup.style.overflowY = 'auto';
    if (stretch) popup.style.width = `${Math.min(rect.width, width - 16)}px`;
    const size = popup.getBoundingClientRect();
    const x = stretch || getComputedStyle(anchor).direction === 'rtl' ? rect.left : rect.right - size.width;
    const below = top + height - rect.bottom - 8, before = rect.top - top - 8;
    const placeAbove = (above && before >= size.height) || (below < size.height && before > below);
    const available = placeAbove ? before : below;
    popup.style.maxHeight = `${Math.max(40, available)}px`;
    const actualHeight = popup.getBoundingClientRect().height;
    popup.style.left = `${Math.max(left + 8, Math.min(x, left + width - size.width - 8))}px`;
    popup.style.top = `${Math.max(top + 8, Math.min(placeAbove ? rect.top - actualHeight - 4 : rect.bottom + 4, top + height - actualHeight - 8))}px`;
  };
  const show = () => {
    showing = true;
    if (supported) popup.popover = 'manual';
    if (supported && !popup.matches(':popover-open')) popup.showPopover();
    position();
  };
  const hide = () => { showing = false; if (supported && popup.matches(':popover-open')) popup.hidePopover(); };
  window.addEventListener('resize', position); document.addEventListener('scroll', position, true);
  window.visualViewport?.addEventListener('resize', position); window.visualViewport?.addEventListener('scroll', position);
  return {
    show, hide,
    destroy() {
      hide(); window.removeEventListener('resize', position); document.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position); window.visualViewport?.removeEventListener('scroll', position);
      if (supported) popup.removeAttribute('popover');
      if (originalStyle === null) popup.removeAttribute('style'); else popup.setAttribute('style', originalStyle);
    },
  };
}
