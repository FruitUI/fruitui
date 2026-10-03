import { fruitToast } from './toast.js';
export { fruitToast } from './toast.js';
import { fruitDialog, listenForNamedDialogs } from './dialog.js';
import { fruitSplitter } from './splitter.js';
import { fruitCombobox, fruitTokenField } from './selection.js';
import { fruitMenu, fruitTooltip, fruitTabs, fruitFloatingDisclosure } from './navigation.js';

let stopListening;

/** Register on your existing Alpine instance before it starts (including Livewire's instance). */
export default function fruitUI(Alpine) {
  // The separate editor plugin replaces this native fallback before Alpine starts.
  Alpine.data('fruitEditor', () => ({}));
  Alpine.data('fruitToast', fruitToast);
  Alpine.data('fruitCombobox', fruitCombobox);
  Alpine.data('fruitTokenField', fruitTokenField);
  Alpine.data('fruitMenu', fruitMenu);
  Alpine.data('fruitTooltip', fruitTooltip);
  Alpine.data('fruitTabs', fruitTabs);
  Alpine.data('fruitSplitter', fruitSplitter);
  Alpine.data('fruitFloatingDisclosure', fruitFloatingDisclosure);
  Alpine.data('fruitDialog', fruitDialog);
  if (typeof window !== 'undefined') stopListening ??= listenForNamedDialogs(window);
}
