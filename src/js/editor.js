import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { bridgeControl, publishValue } from './control-bridge.js';

/** Optional integration: import fruitui/editor explicitly on your existing Alpine. */
export default function fruitEditor(Alpine) {
  Alpine.data('fruitEditor', () => {
    // Keep ProseMirror outside Alpine's reactive proxy.
    let editor, control, surface, toolbar, dispose, click, lastValue;
    const commands = {
      bold: chain => chain.toggleBold(), italic: chain => chain.toggleItalic(),
      bulletList: chain => chain.toggleBulletList(), orderedList: chain => chain.toggleOrderedList(),
      blockquote: chain => chain.toggleBlockquote(), undo: chain => chain.undo(), redo: chain => chain.redo(),
    };
    const refresh = () => {
      const blocked = control.matches(':disabled') || control.readOnly;
      editor.setEditable(!blocked, false);
      editor.view.dom.tabIndex = control.matches(':disabled') ? -1 : control.tabIndex;
      editor.view.dom.setAttribute('aria-disabled', String(control.matches(':disabled')));
      editor.view.dom.setAttribute('aria-readonly', String(control.readOnly));
      for (const button of toolbar.querySelectorAll('[data-fruit-command]')) {
        const command = button.dataset.fruitCommand;
        button.disabled = blocked || !commands[command] || !commands[command](editor.can().chain()).run();
        if (!['undo', 'redo'].includes(command)) button.setAttribute('aria-pressed', String(editor.isActive(command)));
      }
    };
    return {
      init() {
        control = this.$el.querySelector('textarea[data-fruit-control]');
        surface = this.$el.querySelector('.f-editor__surface'); toolbar = this.$el.querySelector('.f-editor__toolbar');
        if (!control || !surface || !toolbar) return;
        lastValue = control.value;
        editor = new Editor({
          element: surface,
          extensions: [StarterKit.configure({ link: { openOnClick: false } })],
          content: control.value,
          editorProps: { attributes: { class: 'f-prose', role: 'textbox', 'aria-multiline': 'true' } },
          onUpdate: () => {
            lastValue = editor.isEmpty ? '' : editor.getHTML();
            publishValue(control, lastValue);
            editor.view.dom.removeAttribute('aria-invalid');
          },
          onTransaction: () => { if (editor) refresh(); },
        });
        dispose = bridgeControl(this, control, editor.view.dom, () => {
          if (control.value !== lastValue) { editor.commands.setContent(control.value, { emitUpdate: false }); lastValue = control.value; }
          refresh();
        });
        click = event => {
          const button = event.target.closest('[data-fruit-command]');
          if (button && !button.disabled && commands[button.dataset.fruitCommand]) commands[button.dataset.fruitCommand](editor.chain().focus()).run();
        };
        toolbar.addEventListener('click', click); toolbar.hidden = false; surface.hidden = false; control.hidden = true; refresh();
      },
      destroy() { dispose?.(); toolbar?.removeEventListener('click', click); editor?.destroy(); if (control) control.hidden = false; if (toolbar) toolbar.hidden = true; if (surface) surface.hidden = true; },
    };
  });
}
