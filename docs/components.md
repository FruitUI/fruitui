# Public components and patterns

The [component gallery](../components.html) is the visual catalog of the CSS shipped by `fruitui/css` and the opt-in `fruitui/mail.css`. Every entry has a live specimen and HTML/Blade usage. [component-catalog.json](component-catalog.json) maps public CSS families to gallery anchors, Blade adapters, and actual consumers. The [component policy](component-policy.md#blade-contracts) defines the native contracts for every Blade adapter. Gallery specimens are rendered from the Blade sources in `gallery/specimens/` (`composer gallery`), so the live specimen and the Blade usage shown beside it are the same code.

## CSS compositions and utilities

These use native markup and existing controls. A CSS composition does not require a separate Blade wrapper to be reusable.

| Family | Purpose and native markup | State and keyboard | Customization and composition |
| --- | --- | --- | --- |
| Field | Arrange an input, its label, and supporting text with `f-field`, `f-label`, `f-help`, and `f-error`. | The input owns validation; use `aria-invalid` and `aria-describedby`. Native editing and focus. | Compose Input, Select, or Textarea with labels and messages. |
| Search | Arrange a decorative SVG and `input type=search` in `f-search`. | Native text value/editing; application owns results. | Optional `f-icon`, accessible label, existing Input attributes. |
| Segmented choices | Present related native radios in `f-segmented` labels. | Native checked value; Tab enters, arrows select, Space checks. | Same radio name; each input is followed by its label span. Use fieldset/legend. No tablist or behavior modes. |
| Avatar | Present initials in a native span with `f-avatar`; Blade `x-fruit::avatar`. | No interaction or keyboard behavior. | Decorative when a name is adjacent; otherwise supply an accessible identity (`label` in Blade). Scoped `--f-avatar-size`, `--f-avatar-radius`, `--f-avatar-border`, `--f-avatar-background`, `--f-avatar-color`, `--f-avatar-font-size`, and `--f-avatar-font-weight` customize presentation. |
| Sidebar | Arrange navigation links/buttons and optional native disclosure groups with `f-sidebar`; Blade `x-fruit::sidebar`, `sidebar-group` and `sidebar-item` (links). | `details` owns open; links/buttons own actions and `aria-current=page`. Native Tab, Enter/Space. | Heading, item, nested item (automatic inside a group), identity text, count badge, decorative chevron. No navigation data model. |
| Toolbar | Arrange actions in a div/header with `f-toolbar`. | No added state or keyboard behavior. | Group independent controls with `f-toolbar__group`; flexible space with `f-toolbar__spacer`. |
| Badge | Present a count or short label in `span.f-badge`; Blade `x-fruit::badge`. | No value, interaction, or added keyboard behavior. | Text content; scoped semantic tokens for appearance. |
| Toast | Present a short status update in `div.f-toast`. | Application owns text and lifetime; use `role=status` for an appropriate announcement. No focus transfer. | Compose text or independent actions. `x-fruit::toaster` adds a managed outlet for server-sent messages; see [server feedback](#server-feedback-dialogs-and-toasts). |
| Row / Stack | Arrange independent children with `f-row` or `f-stack`. | No owned state or keyboard behavior. | Content and controls; shared spacing tokens. |
| Muted text | Apply secondary text color with `f-muted`. | Native content semantics; no state or keyboard behavior. | Shared secondary token, automatically light/dark. |
| Screen-reader text | Preserve accessible content while visually hiding it with `f-sr-only`. | Native label/text semantics. | Use on labels and descriptions; not on focusable controls. |
| Icon | Size and stroke caller-owned SVG artwork with `f-icon`. | No added state or keyboard behavior. | Decorative artwork uses `aria-hidden=true`; the enclosing control supplies its label. No Apple artwork is distributed. |
| Mail shell | Opt-in: import `fruitui/mail.css` (or `mail.compat.css`) after the main stylesheet. Arrange toolbars, navigation, list, and reader using `f-mail-container` and `f-mail f-workspace`, with shared `f-pane` classes on its pane elements. | Application owns `data-view=list/message/mailboxes` and navigation. | Named container queries choose desktop, medium, and phone layouts; `--f-sidebar-width`, `--f-list-width`, and `--f-mail-mobile-height` adjust geometry. |

## Native forms and indicators

Shared `forms.css` covers checkbox/radio marks (including indeterminate checkboxes), fieldset/legend, readonly and autofilled inputs, search cancellation, and the additional native controls below. Admin table selection uses the same `f-check` styling as labeled choices. Admin and Support use the same `f-fieldset` reset and legend presentation. Scope `--f-check-size` to adjust a checkbox/radio's dimensions without changing its meaning.

| Purpose | HTML classes and element | Blade adapter |
| --- | --- | --- |
| Group fields | `fieldset.f-fieldset` with a native legend | `x-fruit::fieldset` |
| Choose files | `input.f-input.f-file type=file` | `x-fruit::file` |
| Numeric quantity | `input.f-input type=number` | `x-fruit::number` |
| Calendar value | `input.f-input type=date/datetime-local/month/week` | `x-fruit::date` with the corresponding type |
| Time of day | `input.f-input type=time` | `x-fruit::time` |
| Color value | `input.f-input.f-color type=color` | `x-fruit::color` |
| Bounded quantity | `input.f-range type=range` | `x-fruit::range` |
| Task completion/activity | `progress.f-progress` | `x-fruit::progress` |
| Bounded measurement | `meter.f-meter` | `x-fruit::meter` |

These adapters emit the native element directly. Put names, labels, validation attributes, `x-model`, and `wire:model` on the real input. Date's small subtype enum covers calendar values; it cannot become a time, file, or text control. Number, time, color, range, and file have fixed types. Keep Input for text-like entry. File uses its native `files` list: read `$event.target.files` in an Alpine `@change` action or use Livewire `wire:model` uploads; do not bind a filename with `x-model` or set a file input value. Application code owns uploads, data persistence, and announcements.

```blade
<x-fruit::fieldset>
    <legend>Import settings</legend>
    <label class="f-field">
        <span class="f-label">Attachment</span>
        <x-fruit::file name="attachment" accept=".csv" wire:model="attachment" />
    </label>
    <label class="f-field">
        <span class="f-label">Seats</span>
        <x-fruit::number name="seats" min="1" max="50" step="1" wire:model="seats" />
    </label>
</x-fruit::fieldset>
```

A readonly field has a secondary surface and text but remains focusable, selectable, and submitted. Disabled fields retain native exclusion from submission. Autofill follows the same palette through an inset surface and text styling where supported; browsers can reserve autofill properties for their own rendering. The native search clear affordance is styled in Blink/WebKit and keeps its input event. Other engines keep their own search rendering.

File, date/time, and color dialogs are provided by the browser or operating system. CSS styles their exposed field parts and supplies the matching `color-scheme`; it cannot skin OS dialogs. MDN describes these [native styling limits](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Advanced_form_styling). Numeric steppers stay available. Range keeps native stepping; Firefox exposes a filled track segment, while Blink/WebKit use the shared neutral track. No script is needed for any of these controls.

Progress represents a task: supply `value` and `max` for completion, omit `value` for indeterminate activity. Reduced motion holds the indeterminate cue still. Meter represents a measurement: native `min`, `max`, `low`, `high`, and `optimum` decide whether the fill uses success, warning, or danger. Include a visible numeric description so meaning does not depend on color. Both require a label or accessible name; progress fallback text alone is [not an accessible label](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress#labelling). `--f-indicator-height` adjusts indicator thickness; `--f-color-width` adjusts the color field. Forced colors preserve visible controls and indicator boundaries.

## Native rich text

Within `.fruit-ui`, `blockquote`, inline `code`, `kbd`, `hr`, and `pre` use shared typography and semantic appearance tokens. Code blocks scroll within their available width, nested code avoids a second backplate, and quoted content has a subtle leading rule. These are native HTML elements and work identically in Blade without extra wrappers. For code blocks that can scroll, use `tabindex="0"`, `role="region"`, and an accessible name on the `pre` so keyboard users can scroll it; focus receives the shared accent outline. Applications choose content hierarchy and keyboard shortcut wording.

## Select

Select always uses the real native control. Shared styles in `src/css/select.css` cover its options, groups, selected/hover/focus states, and disabled options using the existing appearance tokens. In desktop browsers supporting `appearance: base-select` and `::picker(select)`, the picker has rounded rows and selection checkmarks in the browser's top layer, so scrolling panes cannot clip it. Native keyboard navigation, validation, form submission/reset, and value/action bindings remain browser-owned.

Touch devices keep their operating system's picker. Unsupported browsers retain a native select with theme-aware option colors where the platform permits them. This is progressive CSS enhancement; native popup borders, spacing, and highlights are platform-controlled in the fallback. Multiple/size listboxes keep native rendering, keyboard range selection, and row sizing; shared option styling applies where supported. They deliberately retain `appearance: auto`: accepting `base-select` does not guarantee complete listbox keyboard support. See MDN's [customizable selects](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select).

```html
<label class="f-field">
  <span class="f-label">Mailbox</span>
  <select class="f-input" name="mailbox" required>
    <option value="all">All Inboxes</option>
    <optgroup label="Accounts">
      <option value="work">Work</option>
      <option value="personal">Personal</option>
      <option value="offline" disabled>Offline account</option>
    </optgroup>
  </select>
</label>
```

```blade
<label class="f-field">
    <span class="f-label">Included folders</span>
    <x-fruit::select name="folders[]" multiple size="3" wire:model="folders">
        <option value="inbox">Inbox</option>
        <option value="sent">Sent</option>
        <option value="archive">Archive</option>
    </x-fruit::select>
</label>
```

Use ordinary `option`/`optgroup` children and native attributes. Option content stays plain text for fallback compatibility; do not add a parallel hidden input, a synthetic listbox, or another Alpine instance. Light/dark, scoped theme overrides, and forced-colors selection states work through CSS.

## Item lists and rows

Mail messages and Support tickets use the same native list and item-opening button. The list owns arrangement, the button owns activation, and the application owns which item is open. The `quiet` and `filled` variants change appearance while keeping the same button contract. The list is not a listbox and adds no required arrow-key behavior. The examples supply their own arrow-key navigation and responsive screen transitions.

```html
<ul class="f-item-list" role="list" aria-label="Conversations">
  <li>
    <button class="f-item-row f-item-row--filled"
            type="button" aria-current="true">
      <span class="f-avatar f-item-row__leading" aria-hidden="true">SC</span>
      <span class="f-item-row__top">
        <span class="f-item-row__title">Sophie Chen</span>
        <span class="f-item-row__time">10:42</span>
      </span>
      <span class="f-item-row__subtitle">A fresh start</span>
      <span class="f-item-row__preview">A few thoughts on our next release.</span>
      <span class="f-item-row__meta">Work mailbox</span>
    </button>
  </li>
</ul>
```

```blade
<x-fruit::item-list aria-label="Conversations">
    @foreach ($conversations as $conversation)
        <li>
            <x-fruit::item-row variant="filled"
                :aria-current="$openId === $conversation->id ? 'true' : null"
                wire:click="open({{ $conversation->id }})">
                {{ $conversation->sender }}
                <x-slot:leading><span class="f-avatar" aria-hidden="true">{{ $conversation->initials }}</span></x-slot:leading>
                <x-slot:trailing>{{ $conversation->time }}</x-slot:trailing>
                <x-slot:subtitle>{{ $conversation->subject }}</x-slot:subtitle>
                <x-slot:preview>{{ $conversation->preview }}</x-slot:preview>
                <x-slot:meta>{{ $conversation->mailbox_name }}</x-slot:meta>
            </x-fruit::item-row>
        </li>
    @endforeach
</x-fruit::item-list>
```

The default slot supplies the title; an explicit `title` slot can replace it. `leading` is an optional decorative identity cue; `trailing` is time or similar short text; `subtitle`, `preview`, and `meta` are optional supporting content. Slot attributes reach their corresponding spans. All content inside the button must be noninteractive. For an unread cue, compose `span.f-item-row__unread` with `aria-hidden=true` and separate `f-sr-only` text explaining the unread state.

Bulk selection is a separate control beside the opening button:

```blade
<li class="f-row">
    <x-fruit::checkbox name="selected[]" value="42" wire:model="selected">
        Select conversation
    </x-fruit::checkbox>
    <x-fruit::item-row wire:click="open(42)">Sophie Chen</x-fruit::item-row>
</li>
```

Apply layout overrides for the available row width when composing side-by-side controls. Set presentation properties on the list/row through CSS; they do not change the control's native purpose:

| Property | Default / purpose |
| --- | --- |
| `--f-item-list-padding` | `0 8px 8px`; scroll-area padding. |
| `--f-item-row-padding` | `14px 12px`; row padding. |
| `--f-item-row-leading-inset` | `62px` when a leading cue exists, otherwise `12px`; content and separator start inset. |
| `--f-item-row-radius` | `9px`; row corner radius. |
| `--f-item-separator-end` | `12px`; trailing separator inset. |
| `--f-item-current-background`, `--f-item-current-hover` | Current-row surface and hover appearance. |
| `--f-item-current-color`, `--f-item-current-secondary`, `--f-item-current-unread`, `--f-item-current-border` | Current-row text, supporting text, unread cue, and separator appearance. |

Current-state appearance defaults are defined on the row; override them on the row rather than an ancestor. Use semantic `--f-` color tokens so overrides retain both appearances. Responsive Mail/Support aliases now specify only spacing, typography, identity placement, and presentation overrides; shared hover, current state, separators, truncation, and preview clamping live in `src/css/patterns.css`.

## Attachments and empty states

Mail and Chat use a native `a.f-attachment`. The caller supplies the file URL and optional `download` attribute. Blade requires `href`, `:href`, or `x-bind:href` on the native link. File text remains escaped; decorated slots are normal Blade content.

```blade
<x-fruit::attachment :href="$attachment->url" download>
    {{ $attachment->name }}
    <x-slot:detail>{{ $attachment->description }}</x-slot:detail>
    <x-slot:leading><!-- Decorative file SVG --></x-slot:leading>
    <x-slot:trailing><!-- Decorative download SVG --></x-slot:trailing>
</x-fruit::attachment>
```

HTML uses `f-attachment__body`, `f-attachment__detail`, and optional `f-attachment__leading` / `f-attachment__trailing` children. `--f-attachment-gap` and `--f-attachment-padding` adjust spacing. File actions remain native link actions.

All four examples use `f-empty-state` for empty results. It owns no filter state and does not automatically announce itself or move focus. Add appropriate native heading structure and independent recovery actions:

```blade
<x-fruit::empty-state>
    <x-slot:title><h2>No conversations</h2></x-slot:title>
    Try another search.
    <x-slot:actions>
        <x-fruit::button wire:click="clearFilters">Clear filters</x-fruit::button>
    </x-slot:actions>
</x-fruit::empty-state>
```

An optional `icon` slot contains decorative artwork. HTML uses `f-empty-state__icon`, `f-empty-state__title`, `f-empty-state__description`, and `f-empty-state__actions`. `--f-empty-gap`, `--f-empty-padding`, `--f-empty-min-height`, `--f-empty-title-size`, and `--f-empty-description-size` adjust presentation.

## Example boundaries

Charts, customer tabs, breadcrumbs, full Support inspectors, and Chat message arrangements remain example compositions. Their frames, panes, composers, facts, floating disclosures, and table presentation now use the public components below. They are identified as such in the gallery. Application records, searches, queues, assignment, billing, and routing belong to the host application. New examples must compare existing arrangements and extract common presentation once a second actual use demonstrates the need.

## Workspace frames, panes, and resizing

Mail, Support, Chat, and Admin share `.f-workspace` and `.f-pane`. A workspace supplies the grid frame; a pane supplies its surface/minimum sizing. `f-pane--column` arranges content vertically, `f-pane--scroll` scrolls the pane, and `f-pane--border-start/end` adds a divider. Inside a column pane, `f-pane__scroll` fills remaining space and scrolls independently. Name focusable scroll regions and use `tabindex="0"` for keyboard scrolling.

```html
<section class="f-workspace" aria-label="Inbox"
  style="--f-workspace-columns: var(--f-navigation-width, 220px) minmax(0, 1fr); --f-workspace-height: 600px">
  <nav id="navigation" class="f-pane f-pane--column f-pane--scroll f-pane--border-end f-sidebar" aria-label="Mailboxes">…</nav>
  <section id="content" class="f-pane f-pane--column" aria-label="Conversation">
    <header class="f-toolbar">Conversation actions</header>
    <div class="f-pane__scroll" tabindex="0" role="region" aria-label="Conversation history">…</div>
  </section>
  <div class="f-splitter" style="--f-splitter-column: 1" role="separator" tabindex="0"
    aria-orientation="vertical" aria-label="Mailboxes" aria-controls="navigation"
    x-data="fruitSplitter({pane: 'navigation', flexible: 'content', variable: '--f-navigation-width', min: 160, max: 300, reserve: 280})"></div>
</section>
```

```blade
<x-fruit::workspace aria-label="Inbox" style="--f-workspace-columns: var(--f-navigation-width, 220px) minmax(0, 1fr); --f-workspace-height: 600px">
    <nav id="navigation" class="f-pane f-pane--scroll f-sidebar" aria-label="Mailboxes">…</nav>
    <x-fruit::pane id="content" class="f-pane--column">…</x-fruit::pane>
    <x-fruit::splitter pane="navigation" flexible="content" variable="--f-navigation-width"
        :min="160" :max="300" :reserve="280" aria-label="Mailboxes" style="--f-splitter-column: 1" />
</x-fruit::workspace>
```

Workspace tokens: `--f-workspace-columns`, `--f-workspace-rows`, `--f-workspace-height`, `--f-workspace-min-height`, `--f-workspace-radius`, and `--f-workspace-background`. Pane tokens: `--f-pane-background` on the pane and `--f-pane-scroll-padding` on the scroll area. Surface overrides use semantic tokens. Native navigation/article/section elements may use the CSS classes directly; the Blade Workspace wrapper emits a section, and Pane emits a div.

Resize is optional. Register `fruitUI` on the existing Alpine/Livewire Alpine instance; each Splitter enhances only its own divider. It updates the declared `--f-` width variable on the nearest workspace. IDs must be unique and refer to distinct panes inside that frame; the flexible pane reserves `reserve` pixels while other visible tracks retain their widths. `min`/`max` are positive pixel limits. Bounds and accessible values update when the frame or other pane widths change. `--f-splitter-column` selects the pane’s grid track (default 1). Each splitter overlays its existing grid edge; it adds no extra track. `edge="start"` places it at a trailing inspector's leading edge and reverses its width adjustment.

Left/Right move the divider by 8px; Shift uses 32px. Home/End select the bounds. Escape or pointer cancellation restores the width from before a drag; double-click restores the initial width. RTL reverses physical movement correctly. Pane collapse stays with application navigation; resizing does not close a pane. No widths are persisted automatically.

Without Alpine, handles stay hidden and the CSS layout remains usable. **Applications must hide handles in compact container queries when panes stack, disappear, or are replaced by another screen.** Keep enough width for the declared minimums before enabling resizing. The four examples demonstrate this with their existing navigation attributes and breakpoints; narrowing the workspace removes inspectors first, then switches to one visible phone pane. Follow [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout) and [column views](https://developer.apple.com/design/human-interface-guidelines/column-views) when choosing that hierarchy.

## Message composers

Support replies/notes and Chat conversations/threads use the same `.f-composer` native form arrangement. Compose labels and `.f-input.f-composer__input` textareas, `.f-help`/`.f-error`, optional `f-composer__header`, and `f-composer__footer`. The Blade adapter has a default content slot and forwards native form and submit attributes to the form. Labels, `x-model`, `wire:model`, validation and keyboard shortcuts remain on their real controls. It never owns drafts, reply/note modes or sending behavior.

```blade
<x-fruit::composer wire:submit="send">
    <label class="f-label" for="reply">Reply</label>
    <x-fruit::textarea id="reply" name="reply" class="f-composer__input" wire:model="draft" required aria-describedby="reply-error" />
    @error('draft') <p class="f-error" id="reply-error">{{ $message }}</p> @enderror
    <footer class="f-composer__footer"><x-fruit::button type="submit" variant="primary">Send</x-fruit::button></footer>
</x-fruit::composer>
```

Use `--f-composer-padding`, `--f-composer-background`, `--f-composer-action-gap`, `--f-composer-footer-margin`, `--f-composer-input-min-height`, `--f-composer-input-max-height`, and `--f-composer-input-size`. Native Enter inserts a line break; Chat's send shortcut is example behavior, including Shift+Enter and composition input handling.

## Description lists

Support customer facts and Admin customer/subscription details share `.f-description-list` on a native `dl`. Supply native div groups containing `dt`/`dd`; the Blade adapter emits the same dl and accepts those groups in its default slot.

```blade
<x-fruit::description-list>
    <div><dt>Email</dt><dd>{{ $customer->email }}</dd></div>
    <div><dt>Plan</dt><dd>{{ $customer->plan }}</dd></div>
</x-fruit::description-list>
```

Tokens: `--f-description-columns` (grid tracks), `--f-description-gap`, `--f-description-margin`, `--f-description-term-size`, `--f-description-value-size`, `--f-description-value-margin`, and `--f-description-value-line-height`. Use a container query to reduce columns when facts no longer fit. Data and independent controls remain caller-owned.

## Floating disclosures

Mail's phone options and Chat's reaction picker share native `.f-floating-disclosure` details/summary, with `.f-floating-disclosure__content` holding independent actions. Default placement is below; `f-floating-disclosure--above` changes only positioning. Tokens: `--f-floating-gap`, `--f-floating-width`, `--f-floating-padding`, `--f-floating-radius`, `--f-floating-background`, `--f-floating-shadow`, and `--f-floating-backdrop`. Reduced transparency uses an opaque surface and removes blur.

```blade
<x-fruit::floating-disclosure placement="above" x-data="fruitFloatingDisclosure">
    <x-slot:trigger class="f-button">Options</x-slot:trigger>
    <x-slot:content class="f-stack">
        <x-fruit::button wire:click="markAllRead" x-on:click="close(true)">Mark all read</x-fruit::button>
    </x-slot:content>
</x-fruit::floating-disclosure>
```

`title` is a fallback for the trigger slot. Trigger attributes go to the summary; content attributes go to the panel; default content can replace the content slot. Keep the trigger noninteractive content inside its native summary. Native Enter/Space and open state work without JavaScript. Optional `fruitFloatingDisclosure` closes on an outside pointer without changing focus, or Escape with focus return. An action can call `close(true)` after it completes. There is no menu role, focus trap or arrow-key menu model. Keep enough room for the chosen panel placement within scroll/clipping boundaries.

## Native tables

Admin customers and subscriptions share `.f-table` presentation. The primitive owns native table structure only; callers supply caption, colgroup, thead, tbody, tfoot and scoped row/column headers. A surrounding `.f-table__scroll` region can provide horizontal scrolling without affecting table semantics. Sorting uses independent native buttons and caller-owned `aria-sort` on headers. Selection uses independent checkboxes and optional `data-selected="true"` row presentation.

```blade
<div class="f-table__scroll" tabindex="0" role="region" aria-label="Customers">
    <x-fruit::table>
        <caption>Customers</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Plan</th></tr></thead>
        <tbody>@foreach ($customers as $customer)
            <tr><th scope="row">{{ $customer->name }}</th><td>{{ $customer->plan }}</td></tr>
        @endforeach</tbody>
    </x-fruit::table>
</div>
```

Tokens: `--f-table-min-width`, `--f-table-font-size`, `--f-table-heading-size`, `--f-table-cell-padding`, and `--f-table-heading-padding`. Text wraps by default; examples may scope nowrap on suitable columns. There is no record fetching, sorting, pagination or CRUD dispatcher in the primitive. Native reading semantics are unchanged in HTML, Blade and Livewire.

## Support interface controls

See [support interface components](support-components.md) for the new selection, menu, feedback, navigation, upload, and rich editor contracts. Their working gallery specimens include both HTML and Blade usage. The optional `fruitui/editor` module is separate from `fruitui/alpine`; application workflows remain in the examples.


## Field associations and validation errors

`x-fruit::field` composes one native control with its `label`, an optional `description` and its error. Child form adapters, including Checkbox, Radio and Switch, inherit the id and merged ARIA descriptions. The id is `control-id` when given, otherwise the child's own `id`, otherwise one derived from its `wire:model` or `name` (`form.email` becomes `field-form-email`). Plain HTML children need `control-id` and their own associations. Field associates exactly one control and owns no value, rule or model; use Fieldset for choice groups.

The error comes from Laravel's shared `$errors` bag, the same one `@error` reads: Field shows the first message for its control's `wire:model` key, or its `name` (`items[0][title]` becomes `items.0.title`; a trailing `[]` is dropped). That covers controller validation after a redirect and Livewire `validate()` alike. `bag` reads a named bag, as with `validateWithBag()`. An explicit `error` string takes precedence, and `error=""` shows no error.

```blade
<x-fruit::field label="Email" description="Use your work address">
    <x-fruit::input type="email" wire:model.live.blur="form.email" />
</x-fruit::field>

<x-fruit::field label="Terms">
    <x-fruit::checkbox wire:model="terms">I accept the terms</x-fruit::checkbox>
</x-fruit::field>
```

## Server feedback: dialogs and toasts

Put one `<x-fruit::toaster />` in the layout. It announces `fruit-toast` window events and, on page load, a `fruit-toast` value flashed to the session. `duration` (default 4000 ms, 0 keeps it) controls dismissal; hover and focus pause it. It shows one message at a time and does not queue or route notifications.

`FruitUI\Fruit` sends feedback from Livewire components, form objects, actions and controllers:

```php
use FruitUI\Fruit;

Fruit::toast('Conversation closed.');   // now; outside a Livewire request, on the next page
Fruit::flashToast('Closed.');           // on the next page, e.g. before $this->redirect(...)
Fruit::openDialog('close-ticket');      // Livewire requests only
Fruit::closeDialog('close-ticket');
```

A dialog opens in one of two ways. Bind its open state when the server owns it; Escape and `<form method="dialog">` buttons close it and update the property:

```blade
<x-fruit::dialog wire:model="closing" aria-labelledby="close-title">
    …
    <form method="dialog"><x-fruit::button type="submit">Cancel</x-fruit::button></form>
</x-fruit::dialog>
```

Or give it a `name` and open or close it with events, from the server (`Fruit::openDialog`) or the browser (`$dispatch('fruit-dialog-open', { name: 'close-ticket' })`). Either way, Livewire morphs leave the dialog's own attributes alone, so an open dialog stays open while its content re-renders.

In tests, assert the browser events: `->assertDispatched('fruit-toast', message: 'Conversation closed.')`. `x-fruit::toast` remains the plain status container for application-owned `fruitToast` scopes; the four HTML examples use that helper directly.

## Pagination

`fruit::pagination.default` renders a Laravel paginator with `x-fruit::pagination`: a range summary, Previous/Next and page links. Use it with `$items->links('fruit::pagination.default')`, or make it the default with `Paginator::defaultView()` in a service provider.

In Livewire components, set `'pagination_theme' => 'fruit'` in `config/livewire.php`. Paginators then call Livewire's page actions instead of links, without a per-component `paginationView()`. Labels use Laravel translations: `Previous`, `Next`, `Page :page` and `:first–:last of :total`.

## Livewire request states

Livewire 4 marks the element that started a request with `data-loading`. Busy buttons show a progress cursor. During `wire:submit`, Livewire disables or locks every control in the form; FruitUI keeps their appearance instead of dimming the whole form. (A control that was already disabled looks enabled until the request ends.) Livewire also marks `wire:navigate` links for the current page with `data-current`; Sidebar items and Section Nav links style it like `aria-current="page"`, so a persisted sidebar stays correct after navigation.

## Text size

Text sizes are `--f-text-*` tokens in rem (`--f-text-sm` is 12px, `--f-text-base` 13px and `--f-text-md` 14px at the default browser size), so they follow the reader's browser text setting. An html scope sizes its body rather than html, which would redefine rem. A host that fixes a pixel font size on html (Bootstrap 3 uses 10px) pins the scale with `--f-text-root: 16px` on its `.fruit-ui` scope. Spacing and control heights remain in pixels.
