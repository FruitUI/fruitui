# Public components and patterns

The [component gallery](../components.html) is the visual catalog of the CSS shipped by `fruitui/css`. Every entry has a live specimen and HTML/Blade usage. [component-catalog.json](component-catalog.json) maps public CSS families to gallery anchors, Blade adapters, and actual consumers. The [component policy](component-policy.md#current-blade-contracts) defines the complete native contracts for the twenty-one Blade wrappers.

## CSS compositions and utilities

These use native markup and existing controls. A CSS composition does not require a separate Blade wrapper to be reusable.

| Family | Purpose and native markup | State and keyboard | Customization and composition |
| --- | --- | --- | --- |
| Field | Arrange an input, its label, and supporting text with `f-field`, `f-label`, `f-help`, and `f-error`. | The input owns validation; use `aria-invalid` and `aria-describedby`. Native editing and focus. | Compose Input, Select, or Textarea with labels and messages. |
| Search | Arrange a decorative SVG and `input type=search` in `f-search`. | Native text value/editing; application owns results. | Optional `f-icon`, accessible label, existing Input attributes. |
| Segmented choices | Present related native radios in `f-segmented` labels. | Native checked value; Tab enters, arrows select, Space checks. | Same radio name; each input is followed by its label span. Use fieldset/legend. No tablist or behavior modes. |
| Avatar | Present initials in a native span with `f-avatar`. | No interaction or keyboard behavior. | Decorative when a name is adjacent; otherwise supply an accessible identity. Scoped `--f-avatar-size`, `--f-avatar-radius`, `--f-avatar-border`, `--f-avatar-background`, `--f-avatar-color`, `--f-avatar-font-size`, and `--f-avatar-font-weight` customize presentation. |
| Sidebar | Arrange navigation links/buttons and optional native disclosure groups with `f-sidebar`. | `details` owns open; links/buttons own actions and `aria-current=page`. Native Tab, Enter/Space. | Heading, item, nested item, identity text, count badge, decorative chevron. No navigation data model. |
| Toolbar | Arrange actions in a div/header with `f-toolbar`. | No added state or keyboard behavior. | Group independent controls with `f-toolbar__group`; flexible space with `f-toolbar__spacer`. |
| Badge | Present a count or short label in `span.f-badge`. | No value, interaction, or added keyboard behavior. | Text content; scoped semantic tokens for appearance. |
| Toast | Present a short status update in `div.f-toast`. | Application owns text and lifetime; use `role=status` for an appropriate announcement. No focus transfer. | Compose text or independent actions. No automatic timers or dismissal API. |
| Row / Stack | Arrange independent children with `f-row` or `f-stack`. | No owned state or keyboard behavior. | Content and controls; shared spacing tokens. |
| Muted text | Apply secondary text color with `f-muted`. | Native content semantics; no state or keyboard behavior. | Shared secondary token, automatically light/dark. |
| Screen-reader text | Preserve accessible content while visually hiding it with `f-sr-only`. | Native label/text semantics. | Use on labels and descriptions; not on focusable controls. |
| Icon | Size and stroke caller-owned SVG artwork with `f-icon`. | No added state or keyboard behavior. | Decorative artwork uses `aria-hidden=true`; the enclosing control supplies its label. No Apple artwork is distributed. |
| Mail shell | Arrange toolbars, navigation, list, and reader using `f-mail-container` and `f-mail f-workspace`, with shared `f-pane` classes on its pane elements. | Application owns `data-view=list/message/mailboxes` and navigation. | Named container queries choose desktop, medium, and phone layouts; `--f-sidebar-width`, `--f-list-width`, and `--f-mail-mobile-height` adjust geometry. |

## Conversation lists and rows

Mail and Support use the same native list and conversation-opening button. The list owns arrangement, the button owns activation, and the application owns which conversation is open. The `quiet` and `filled` variants change appearance while keeping the same button contract. The list is not a listbox and adds no required arrow-key behavior. The examples supply their own arrow-key navigation and responsive screen transitions.

```html
<ul class="f-conversation-list" role="list" aria-label="Conversations">
  <li>
    <button class="f-conversation-row f-conversation-row--filled"
            type="button" aria-current="true">
      <span class="f-avatar f-conversation-row__leading" aria-hidden="true">SC</span>
      <span class="f-conversation-row__top">
        <span class="f-conversation-row__title">Sophie Chen</span>
        <span class="f-conversation-row__time">10:42</span>
      </span>
      <span class="f-conversation-row__subtitle">A fresh start</span>
      <span class="f-conversation-row__preview">A few thoughts on our next release.</span>
      <span class="f-conversation-row__meta">Work mailbox</span>
    </button>
  </li>
</ul>
```

```blade
<x-fruit::conversation-list aria-label="Conversations">
    @foreach ($conversations as $conversation)
        <li>
            <x-fruit::conversation-row variant="filled"
                :aria-current="$openId === $conversation->id ? 'true' : null"
                wire:click="open({{ $conversation->id }})">
                {{ $conversation->sender }}
                <x-slot:leading><span class="f-avatar" aria-hidden="true">{{ $conversation->initials }}</span></x-slot:leading>
                <x-slot:trailing>{{ $conversation->time }}</x-slot:trailing>
                <x-slot:subtitle>{{ $conversation->subject }}</x-slot:subtitle>
                <x-slot:preview>{{ $conversation->preview }}</x-slot:preview>
                <x-slot:meta>{{ $conversation->mailbox_name }}</x-slot:meta>
            </x-fruit::conversation-row>
        </li>
    @endforeach
</x-fruit::conversation-list>
```

The default slot supplies the title; an explicit `title` slot can replace it. `leading` is an optional decorative identity cue; `trailing` is time or similar short text; `subtitle`, `preview`, and `meta` are optional supporting content. Slot attributes reach their corresponding spans. All content inside the button must be noninteractive. For an unread cue, compose `span.f-conversation-row__unread` with `aria-hidden=true` and separate `f-sr-only` text explaining the unread state.

Bulk selection is a separate control beside the opening button:

```blade
<li class="f-row">
    <x-fruit::checkbox name="selected[]" value="42" wire:model="selected">
        Select conversation
    </x-fruit::checkbox>
    <x-fruit::conversation-row wire:click="open(42)">Sophie Chen</x-fruit::conversation-row>
</li>
```

Apply layout overrides for the available row width when composing side-by-side controls. Set presentation properties on the list/row through CSS; they do not change the control's native purpose:

| Property | Default / purpose |
| --- | --- |
| `--f-conversation-list-padding` | `0 8px 8px`; scroll-area padding. |
| `--f-conversation-row-padding` | `14px 12px`; row padding. |
| `--f-conversation-row-leading-inset` | `62px` when a leading cue exists, otherwise `12px`; content and separator start inset. |
| `--f-conversation-row-radius` | `9px`; row corner radius. |
| `--f-conversation-separator-end` | `12px`; trailing separator inset. |
| `--f-conversation-current-background`, `--f-conversation-current-hover` | Current-row surface and hover appearance. |
| `--f-conversation-current-color`, `--f-conversation-current-secondary`, `--f-conversation-current-unread`, `--f-conversation-current-border` | Current-row text, supporting text, unread cue, and separator appearance. |

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
