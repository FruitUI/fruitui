/** Optional helper for a dialog referenced by x-ref="dialog" inside the same scope. */
export function fruitDialog() {
  return {
    open() {
      this.$refs.dialog.showModal();
    },
    close() {
      this.$refs.dialog.close();
    },
  };
}

/** Named dialogs open and close from browser events, including Livewire dispatches. */
export function listenForNamedDialogs(target = window) {
  const find = name =>
    [...document.querySelectorAll('dialog[data-fruit-dialog]')].find(dialog => dialog.dataset.fruitDialog === name);
  const open = event => {
    const dialog = find(event.detail?.name);
    if (dialog && !dialog.open) dialog.showModal();
  };
  const close = event => {
    const dialog = find(event.detail?.name);
    if (dialog?.open) dialog.close(event.detail?.returnValue);
  };
  target.addEventListener('fruit-dialog-open', open);
  target.addEventListener('fruit-dialog-close', close);
  return () => {
    target.removeEventListener('fruit-dialog-open', open);
    target.removeEventListener('fruit-dialog-close', close);
  };
}
