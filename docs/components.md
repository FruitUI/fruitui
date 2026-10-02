# Public components and patterns

The [component gallery](../components.html) is the visual catalog of the CSS shipped by `fruitui/css`. Every entry has a live specimen and HTML/Blade usage. [component-catalog.json](component-catalog.json) maps public CSS families to gallery anchors, Blade adapters, and actual consumers. The [component policy](component-policy.md#current-blade-contracts) defines the complete native contracts for the fourteen Blade wrappers.

## CSS compositions and utilities

These use native markup and existing controls. A CSS composition does not require a separate Blade wrapper to be reusable.

| Family | Purpose and native markup | State and keyboard | Customization and composition |
| --- | --- | --- | --- |
| Field | Arrange an input, its label, and supporting text with `f-field`, `f-label`, `f-help`, and `f-error`. | The input owns validation; use `aria-invalid` and `aria-describedby`. Native editing and focus. | Compose Input, Select, or Textarea with labels and messages. |
| Search | Arrange a decorative SVG and `input type=search` in `f-search`. | Native text value/editing; application owns results. | Optional `f-icon`, accessible label, existing Input attributes. |
| Segmented choices | Present related native radios in `f-segmented` labels. | Native checked value; Tab enters, arrows select, Space checks. | Same radio name; each input is followed by its label span. Use fieldset/legend. No tablist or behavior modes. |
| Avatar | Present initials in a native span with `f-avatar`. | No interaction or keyboard behavior. | Decorative when a name is adjacent; otherwise supply an accessible identity. |
| Sidebar | Arrange navigation links/buttons and optional native disclosure groups with `f-sidebar`. | `details` owns open; links/buttons own actions and `aria-current=page`. Native Tab, Enter/Space. | Heading, item, nested item, identity text, count badge, decorative chevron. No navigation data model. |
| Toolbar | Arrange actions in a div/header with `f-toolbar`. | No added state or keyboard behavior. | Group independent controls with `f-toolbar__group`; flexible space with `f-toolbar__spacer`. |
| Badge | Present a count or short label in `span.f-badge`. | No value, interaction, or added keyboard behavior. | Text content; scoped semantic tokens for appearance. |
| Toast | Present a short status update in `div.f-toast`. | Application owns text and lifetime; use `role=status` for an appropriate announcement. No focus transfer. | Compose text or independent actions. No automatic timers or dismissal API. |
| Row / Stack | Arrange independent children with `f-row` or `f-stack`. | No owned state or keyboard behavior. | Content and controls; shared spacing tokens. |
| Muted text | Apply secondary text color with `f-muted`. | Native content semantics; no state or keyboard behavior. | Shared secondary token, automatically light/dark. |
| Screen-reader text | Preserve accessible content while visually hiding it with `f-sr-only`. | Native label/text semantics. | Use on labels and descriptions; not on focusable controls. |
| Icon | Size and stroke caller-owned SVG artwork with `f-icon`. | No added state or keyboard behavior. | Decorative artwork uses `aria-hidden=true`; the enclosing control supplies its label. No Apple artwork is distributed. |
| Mail shell | Arrange toolbars, navigation, list, and reader using `f-mail-container` and `f-mail`. | Application owns `data-view=list/message/mailboxes` and navigation. | Named container queries choose desktop, medium, and phone layouts; `--f-sidebar-width`, `--f-list-width`, and `--f-mail-mobile-height` adjust geometry. |

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

Admin's tables, charts, customer tabs, and breadcrumbs; Support's inspector; and Chat's thread arrangement remain example compositions. They are identified as such in the gallery. Application records, searches, queues, assignment, billing, and routing belong to the host application. New examples must compare existing arrangements and extract common presentation once a second actual use demonstrates the need.
