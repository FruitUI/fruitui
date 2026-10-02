import { fruitSplitter } from './splitter.js';

/** Register on your existing Alpine instance before it starts (including Livewire's instance). */
export default function fruitUI(Alpine) {
  Alpine.data('fruitSplitter', fruitSplitter);
  Alpine.data('fruitFloatingDisclosure', () => {
    let details, outside, escape;
    return {
      init() {
        details = this.$el;
        outside = event => { if (details.open && !details.contains(event.target)) this.close(); };
        escape = event => { if (event.key === 'Escape' && details.open) { event.preventDefault(); event.stopPropagation(); this.close(true); } };
        document.addEventListener('pointerdown', outside);
        details.addEventListener('keydown', escape);
      },
      close(restoreFocus = false) {
        details.open = false;
        if (restoreFocus) details.querySelector('summary')?.focus();
      },
      destroy() {
        document.removeEventListener('pointerdown', outside);
        details.removeEventListener('keydown', escape);
      },
    };
  });
  Alpine.data('fruitDialog', () => ({
    open() { this.$refs.dialog.showModal(); },
    close() { this.$refs.dialog.close(); },
  }));
}
