# Support interface components

These controls cover the gaps found while comparing FruitUI with FreeScout. They are implemented entirely in FruitUI. [The gallery](../components.html) includes every public family, working HTML, and Blade usage; [the policy](component-policy.md) records the semantic contracts.

## Choosing the right control

| Need | Use | Value and responsibility |
| --- | --- | --- |
| A persistent message | `f-alert` / `x-fruit::alert` | Application chooses message, tone, actions, and any live announcement role. |
| Action commands | `f-menu` + `f-menu-item` | `fruitMenu` owns command focus and dismissal; application owns commands. |
| Independent popup controls | Floating Disclosure | Ordinary controls retain their own keyboard contracts. |
| One searchable existing option | `f-combobox` / `x-fruit::combobox` | The native single select owns its scalar value. |
| Recipients or tags | `f-token-field` / `x-fruit::token-field` | The native textarea owns a newline-delimited string. |
| Rich formatted text | `f-editor` / `x-fruit::editor` | The native textarea owns HTML; an optional Tiptap module supplies editing. |
| Related panels in one page | `f-tabs`, `f-tab` | Linked tabs/panels; optional `fruitTabs`, or existing route-aware callbacks. |
| Related pages | `f-section-nav` | Ordinary links and `aria-current="page"`. |
| Page controls | `f-pagination` | Application pagination; independent links or native buttons. |

Menus follow the [WAI menu button keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/); searchable selection follows the [combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). Popups use the [browser top layer](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using) where available so scrollable panes do not clip them; unsupported browsers retain positioned panels. Register the existing plugin before Alpine starts, including Livewire's Alpine instance. Helpers do not start another instance.

```js
import fruitUI from 'fruitui/alpine';
fruitUI(Alpine);
```

For raw HTML, put `x-data="fruitCombobox"` on a `div.f-combobox` containing `select.f-input[data-fruit-control]`. Token Field uses `div.f-token-field[x-data="fruitTokenField"]` with `textarea.f-input[data-fruit-control]`. Blade emits that markup. Give the native control a label, name, initial value, and validation/model attributes. The helper creates an unnamed query, copies accessible labels/descriptions, and publishes native events when values change. Editor publishes input while typing and committed change on widget blur. See [adoption contracts](adoption.md) for wrapper attributes, localization and Field associations. Without JavaScript, the select or textarea remains editable and submits the same value format.

Blade includes stable `wire:ignore` containers for generated UI. The named native control remains outside them, so Livewire can update its model, options, labels, validation, disabled, and readonly attributes. For handwritten Livewire markup, include an empty `<div data-fruit-ui wire:ignore></div>` beside the native select/textarea. Rich Editor's toolbar and surface each use `wire:ignore`; its textarea remains outside those boundaries. Keep a widget's DOM identity stable, or key an outer container when replacing it.

```blade
<label for="assignee">Assigned to</label>
<x-fruit::combobox id="assignee" name="assignee" wire:model.live="assignee">
    <option value="">Unassigned</option>
    <option value="alex">Alex Morgan</option>
</x-fruit::combobox>

<label for="cc">Cc</label>
<x-fruit::token-field id="cc" name="cc" wire:model="cc"
    placeholder="Add a recipient">{{ $cc }}</x-fruit::token-field>
```

Token entry adds on Enter, comma, or a multiline/comma paste. Values are trimmed and exact duplicates are ignored. Empty Backspace/Left focuses the last remove button; arrows navigate remove buttons, Escape returns to entry. Adding is atomic for a paste: if application validation rejects any value, the native value is unchanged. Applications can cancel the bubbling `fruit-token-add` event and set `event.detail.error`, or normalize `event.detail.value`. Existing server-provided values are not validated by this event; validate the entire submitted string on the server. Arrays belong to the application: split/join the newline string in its binding or request handler.

Dispatch `fruit-token-reset` on the native textarea to discard pending entry and validation feedback without changing committed tokens. Mail uses it when starting another draft, including when the serialized model was already empty. Ordinary form resets also clear pending entry.

```html
<textarea data-fruit-control name="cc"
  @fruit-token-add="if (!isRecipient($event.detail.value)) {
    $event.detail.error = 'Enter an email address.';
    $event.preventDefault();
  }"></textarea>
```

Choice queries keep focus while `aria-activedescendant` identifies the highlighted option. Up/Down navigate, Enter commits, Escape restores the selected label, and Tab leaves without changing the selection. Disabled options/optgroups are skipped. The enhanced controls preserve form resets, native required/disabled/readonly behavior, label focus, external Alpine model updates, and helper cleanup. Combobox does not support multiple/size modes; use Select for native multiple selection or Token Field for free text tokens.

## Optional rich editing

The core Alpine module does not import Tiptap. Import the separate integration on pages that need editing. Its optional peers (installed only by source-editor consumers) are `@tiptap/core`, `@tiptap/pm`, and `@tiptap/starter-kit`; [Tiptap's vanilla installation](https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript) describes the underlying editor.

```js
import fruitEditor from 'fruitui/editor';
fruitEditor(Alpine); // before this same Alpine instance starts
```

```blade
<label for="signature">Reply signature</label>
<x-fruit::editor id="signature" name="signature" wire:model="signature">
    {{ $signature }}
</x-fruit::editor>
```

The toolbar offers bold, italic, lists, quotes, undo, and redo. Tiptap handles document editing and shortcuts. The adapter escapes the initial HTML into a textarea; with JavaScript disabled it is an editable HTML source field. The editor mirrors an HTML string back to the same named textarea. Empty documents serialize as an empty string for native required validation. Readonly and disabled controls block editing; form resets and external model changes update the document. Sanitize and validate submitted HTML in the application before storing or rendering it. The editor schema is not a server sanitizer.

Use `f-prose` around sanitized message content to scope paragraph, list, quote, image, and table presentation. Wrap wide tables in `f-prose__scroll` with `role="region"`, `tabindex="0"`, and an accessible name; this keeps keyboard scrolling within the message. Do not add `f-prose` to the entire application.

## Composing the remaining pieces

`f-button-group` joins independent Buttons and Menus for split actions. `f-input-group` joins native inputs, `f-input-group__addon` units, and action buttons; use `aria-describedby` for a meaningful unit. `f-chip` holds a value and an independent `f-chip__remove` button. None owns the surrounding form's value.

`f-upload` rows combine File, Progress, text/links, and independent cancel/retry/remove buttons. The application owns FileList handling and transport. The Mail and Support examples simulate upload progress locally and provide downloadable browser blobs; they send no files to a server. `f-spinner` is decorative activity: keep a readable action name, set `aria-busy`, and use native disabled when repeated activation must be blocked. Reduced motion stops spinning.

`f-avatar` also accepts an `img` with meaningful alt text, or empty alt when an adjacent name supplies identity. `<x-fruit::avatar>` is decorative by default; `label` gives it an accessible identity and `src` renders a photo. `f-avatar-group` overlaps independent avatars; `f-presence` must have adjacent readable status or equivalent accessible text. `f-notifications` arranges grouped native lists of destination links, badges, and independent actions; unread counts and read state stay in the application.

Tooltips use `f-tooltip` with `x-data="fruitTooltip"`, a focusable control referencing a noninteractive `f-tooltip__text[role="tooltip"]` through `aria-describedby`. CSS reveals help on hover/focus; the helper dismisses on Escape, including hover-only disclosure. Keep essential labels and instructions visible. In Blade, `text-id` names the tooltip text and the trigger references it, so the association is rendered by the server and survives Livewire morphs:

```blade
<x-fruit::tooltip text="Move this conversation to the archive." text-id="archive-help">
    <x-fruit::button aria-describedby="archive-help" wire:click="archive">Archive</x-fruit::button>
</x-fruit::tooltip>
``` Alerts do not automatically acquire a live role based on tone; add `role="status"` or `role="alert"` when new feedback should be announced.

All new CSS uses existing semantic appearance tokens, follows system light/dark changes, and supports explicit theme overrides. The examples keep routing, recipient rules, upload state, and record data outside the framework.
