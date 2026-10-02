# Component policy

FruitUI components are organized by semantic purpose. Configuration changes the presentation of that purpose. Independent behaviors are composed from independent controls.

This policy is the acceptance rule for new components and API changes. The Blade validators reject unsupported options and semantic overrides. The contract tests require a catalog entry for every Blade component and exercise native controls and adapter behavior. Review still establishes whether a proposed abstraction has a distinct purpose and evidence of reuse; an automated test cannot determine that design judgment.

## Choosing the smallest appropriate change

| Need | Approach |
| --- | --- |
| Different color, spacing, or radius | Override an existing `--f-` design token in the relevant scope. |
| Primary, danger, or quiet button styling | Use an explicit variant of Button. |
| Different text, icon, description, or trailing content | Use a slot or compose existing layout classes and primitives. |
| A layout row containing a checkbox | Place Checkbox in the row; Checkbox owns checked state and the submitted value. |
| A distinct accessible purpose, value model, or interaction | Give that semantic control its own primitive and contract. |
| A recurring arrangement of primitives | Extract a pattern after two actual application/example uses demonstrate the need. |

Each public component must have a one-sentence purpose and document its native element/role, value or state, keyboard behavior, options, and slots. Prefer a small set of named options to unrelated boolean mode flags. Do not introduce `checkboxMode` on a list, a generic `as` prop on controls, or a component per button color. Shared CSS can serve separate semantic components.

Native HTML subtypes within a documented family are allowed: email and password are text-entry fields, button can submit a form, and a native select can have `multiple`. These retain the declared control purpose and use browser behavior. Selection controls, file pickers, date pickers, numeric spinners, and sliders are not text-like Input subtypes in FruitUI; add the appropriate distinct control when a real use requires it.

## Required light and dark appearances

Every component, composed pattern, and example must work in both light and dark appearances. This includes default, hover, focus, checked/selected, invalid, and disabled states, plus menus, dialogs, backdrops, and other overlays. Text, icons, control boundaries, and state indicators must remain readable in each appearance.

CSS follows `prefers-color-scheme` by default on each `.fruit-ui` scope and updates when the system preference changes. An omitted `data-theme` or `data-theme="system"` enables this behavior. No Alpine initialization, Livewire request, JavaScript media listener, or reload may be required. Optional `data-theme="light"` and `data-theme="dark"` overrides remain available on the same scope. Set `color-scheme` alongside the palette so native controls use the matching appearance.

Use shared semantic `--f-` tokens for colors, shadows, and backdrops. Define every new color/effect token in both palettes; automatic and explicitly selected dark appearances must use the same values. A value may deliberately stay the same in both palettes when it remains suitable, such as white content on a filled accent control. Core component CSS must not contain fixed color literals. Theme-independent decorative artwork, such as the example logo and window dots, can retain its identity colors after review in both appearances; text and control states still follow semantic tokens.

Custom token overrides must supply suitable light and dark values and preserve automatic switching and explicit overrides. Do not force an example or component to light mode. Browser checks enforce paired tokens, prevent fixed colors in core component styles, and verify automatic switching and explicit overrides without JavaScript. Existing gallery/Mail accessibility checks cover both appearances; review new visual states as part of change acceptance.

## Current Blade contracts

| Component | Purpose | Native element and role | Value or state | Keyboard | Options and slots |
| --- | --- | --- | --- | --- | --- |
| `button` | Invoke an action. | `button`, button role; native `aria-pressed` can describe a toggle action. | Native disabled state; explicit form button type. | Tab focuses; Enter/Space invokes. | `variant`: default, primary, ghost, danger. `type`: button (default), submit, reset. Slot: action label and optional decorative icon. |
| `input` | Enter a single line of text. | `input`; native role follows text-like type and native attributes. | Native string value, validation, disabled/readonly state. | Native text editing and focus behavior. | `type`: text (default), email, password, search, tel, url. No content slot; provide a label or accessible name. |
| `checkbox` | Include or exclude an independent option. | `input type=checkbox`, checkbox role inside its label. | Native checked state and submitted value; checked/required/disabled attributes. | Tab focuses; Space toggles. | Fixed type and role. Slot: label; attributes go to the input. |
| `radio` | Select one value in a named group. | `input type=radio`, radio role inside its label. | Native checked state and selected group value; name/value/required/disabled attributes. | Tab enters group; arrow keys select; Space checks. | Fixed type and role. Slot: label; attributes go to the input. Group using the same name and a fieldset/legend. |
| `switch` | Turn a boolean setting on or off. | `input type=checkbox`, switch role inside its label. | Native checked state and submitted value; checked/required/disabled attributes. | Tab focuses; Space toggles. | Fixed type and role. Slot: setting label; attributes go to the input. |
| `select` | Choose from native options. | `select`; native combobox or listbox role. | Native scalar or multiple selection and validation. | Native platform selection keyboard behavior. | Native select attributes, including multiple. Slot: option/optgroup elements. |
| `textarea` | Enter multiple lines of text. | `textarea`, textbox role. | Native string value, validation, disabled/readonly state. | Native text editing; Enter inserts a line break. | Native textarea attributes. Slot: initial text; Alpine/Livewire can own the value. |
| `dialog` | Present a focused task in a modal or nonmodal dialog. | `dialog`, dialog role. | Native open/modal state; browser-managed focus and Escape cancellation for modals. | showModal manages focus; Tab stays within a modal; Escape dismisses. | Native dialog attributes and an accessible name. Slot: composed content/actions. fruitDialog adds open/close helpers using x-ref=dialog. |
| `disclosure` | Reveal optional supporting content. | `details` with a native summary button. | Native open state. | Tab focuses summary; Enter/Space toggles. | `title`: summary text. Native details attributes. Slot: supporting content. |
| `card` | Group related content visually. | `section`; native container semantics, or an explicit group/region role. | No interaction or selection state. | No added keyboard behavior; children own their interaction. | Native section attributes; explicit role may be group or region. Slot: composed content and controls. |

Native attributes and `x-*`/`wire:*` bindings belong on the underlying element, not the surrounding label. Checkbox, Radio, and Switch share `f-check`/`f-switch` styling rather than adding per-state components. Both checkbox and radio examples already exist in the component gallery; the Blade wrappers expose those native contracts to Laravel.

The CSS-only `.f-avatar` presents initials as an identity cue. Use a native span with no interaction or selection state; mark it `aria-hidden="true"` when an adjacent name supplies the identity, or provide an accessible name when it stands alone. It has no options, added keyboard behavior, or value model. Mail sender/account identities and Support customer/agent identities are its two actual uses, so its unchanged styling belongs in shared `components.css`.

The `.f-sidebar__group` navigation pattern composes a native `details`/`summary` disclosure with independent links or buttons using `.f-sidebar__item--nested`. Its two actual uses are Mail account folders and Support team mailbox views. The disclosure owns only its native `open` state and Enter/Space interaction; child controls own navigation actions and `aria-current`. `.f-sidebar__identity` arranges optional primary/secondary text; `.f-sidebar__chevron` is a decorative icon that follows native open state. There are no behavior modes or new Blade primitives. Counts, account/mailbox ownership, the virtual `all` scope, and folder filters belong to application data in `examples/`, not this CSS pattern.

## Runtime boundaries

- Input rejects types outside its text-like allowlist, including checkbox/radio, number, date, range, file, and hidden.
- Button rejects unknown variants and types. Unknown values raise clear exceptions rather than falling back to default styling.
- Controls keep their element and role. `as`, incompatible `type`/`role`, and explicit client `:type`/`x-bind:type`/`:role`/`x-bind:role` bindings are rejected. Server-bound Blade `:type` and `:variant` props are validated at render time.
- Matching fixed choice type/role attributes are accepted and emitted once. Input and Select infer their roles from native HTML and reject explicit role overrides; the other controls accept only their declared role. Card permits group/region roles and rejects interactive roles such as checkbox or button.
- Normal labels, native form attributes, custom classes, `aria-*` descriptions/validation, and Alpine/Livewire value and action bindings continue to pass through.

Plain HTML/CSS consumers follow the same documented contracts through their markup. Runtime validation belongs to the Blade adapters; arbitrary consumer JavaScript or attribute spread objects are outside that validation boundary. Keep that distinction explicit in claims about enforcement.

## Pattern and adapter rules

Use `f-row`, `f-stack`, and slots to compose content before adding API options. A row with a checkbox is ordinary composition:

```blade
<div class="f-row">
    <x-fruit::checkbox name="selected[]" value="message-42" wire:model="selected">
        A fresh start for FruitUI
    </x-fruit::checkbox>
    <span class="f-badge">Unread</span>
</div>
```

The layout owns arrangement; the checkbox owns selection. A real application with multiple repeated row arrangements may justify a Row pattern with leading/default/trailing slots. Until then, these layout classes are sufficient.

Mail, Support, Chat, and Admin are the current reference interfaces. Their sample data and application behavior stay in `examples/`; Support's ticket layout, conversation threads, and customer inspector are example compositions. Chat reuses Toolbar, Sidebar groups, Avatar, native form controls, and Dialog; its message flow, reaction picker, and thread layout stay in `examples/chat/`. A reaction is an independent native button with `aria-pressed`; a message row does not become a selection control. Channels, unread state, and drafts are application state rather than control options. Admin composes native tables, independent selection checkboxes, sort/action buttons, forms, and SVG charts in `examples/admin/`. Its sidebar reuses the existing disclosure pattern. Its customer tabs, breadcrumbs, and hash routing remain example-local: tab buttons have fixed tab roles, linked panels, selection state, and Left/Right/Home/End behavior; navigation links retain native link semantics. Records and record tabs do not become sidebar behavior modes. Its first use does not justify a universal Table/CRUD primitive; records, pagination, and chart series belong to the application. Additional interfaces should demonstrate actual shared needs before producing more reusable patterns. Core primitives can start from one real use when they represent a distinct native control.

CSS handles appearance and layout, Blade emits the same native controls, Alpine adds local state, and Livewire adds server actions. Their semantic contracts remain the same. Do not add a second Alpine instance, automatic DOM role switching, or adapter-specific behavior flags. Test a control's changed behavior and integration; use the existing gallery checks for light/dark, focus, accessibility, and narrow layouts.

## Change acceptance

Before adding a primitive or option, describe the requested use, the semantic purpose, existing composition considered, supported options, and attribute ownership. For a new pattern, name its two actual uses. Update the contract catalog and relevant gallery examples, retain adapter parity, verify every affected state in light and dark appearances, and add focused regression coverage for new behavior or validation. `composer test`, `npm run build`, and `npm test` must pass for component changes.
