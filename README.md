# FruitUI

An Apple-inspired, CSS-first interface framework for HTML and Laravel. Familiar controls, thoughtful spacing, and clear hierarchy, with optional Alpine.js and Livewire behavior.

The reference interfaces are **Mail** and **Support**: familiar inboxes implemented in HTML with FruitUI’s own CSS. This is an early local package; it has not been published to npm or Packagist.

The [component policy](docs/component-policy.md) defines the boundary between tokens, variants, primitives, and composed patterns. Every Blade component has a documented semantic contract; contributors follow [AGENTS.md](AGENTS.md). Unsupported input types, button variants/types, and control type/role overrides raise clear render-time errors.

Every component, pattern, example, and interaction state must support dark mode. FruitUI's CSS follows the system appearance automatically, including changes while the page is open, without JavaScript.

## Run the examples

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 for Mail, http://127.0.0.1:5173/support.html for Support, or http://127.0.0.1:5173/components.html for the component gallery. The navigation links the examples side by side. `npm run build` creates a static example site in `dist/`; `npm run preview` serves that build.

Mail interactions include search, unread filtering, keyboard navigation with the arrow keys, mailbox selection, archive, trash, flag, reply, forward, and a native compose dialog. The inbox and composed messages live in memory for this demo; reloading resets them. No email is delivered. Choose **iPhone** above the example to preview the phone interface from a desktop browser, or resize the window with **Responsive** selected.

Both examples start in **All Inboxes**, a virtual view across multiple accounts or team mailboxes. Combined folders appear at the top of navigation; expand an account or mailbox below to open its own folders. Mail includes Work and Personal accounts, with combined Inbox, Flagged, Drafts, Sent, Archive, Junk, and Trash views. Support includes Support, Billing, and Feedback mailboxes, with combined Open, Assigned to me, Unassigned, Waiting, and Closed views. Search and filters apply to the selected scope; global and individual counts stay synchronized after actions. Mail inbox badges count unread messages; other Mail folder badges and Support badges count items.

Combined lists identify each item's source, and the reading/conversation pane keeps its account address visible. Mail replies and forwards start from the message's account; new messages start from the selected account, with a native **From** selector. Support replies use the conversation's mailbox, and new conversations choose a real destination mailbox. Each record has a stable `accountId` (Mail) or `mailboxId` (Support), separate from its folder/status. The virtual `all` scope is only a filter: moving a message or changing a ticket's status preserves its original owner. In Laravel, apply both scope and folder/status constraints to the query and calculate navigation counts within the authenticated user's accessible accounts or mailboxes.

## Support, reimagined

Support combines the shared-inbox workflow of Help Scout and FreeScout with Apple-style split panes, restrained materials, system typography, and a customer inspector. It is a working frontend example, with local sample data rather than a connected help desk.

- Switch between All Inboxes, Assigned to me, Unassigned, Waiting, and Closed, or the same views within an individual team mailbox. Counts follow scope, status, and assignment; search looks through the current view's subjects, customers, tags, and conversation bodies.
- Read customer messages, agent replies, and clearly labeled internal notes. Reply and note drafts stay separate for each ticket as you switch conversations. Notes leave the public reply, assignee, and status intact.
- Assign conversations, move them between statuses, add/remove tags, and open the customer's previous conversations. A reply to a closed conversation reopens it.
- Create an incoming conversation with a native, validated form. Replies and new conversations stay in memory; no email is sent, and reloading resets the workspace.

The workspace responds to its container: over 1100px it shows navigation, ticket list, conversation, and customer details; from 701–1100px it keeps list/conversation panes and lets you open customer details in place; up to 700px it presents views, list, conversation, and customer details as separate screens. Navigation and search preserve per-ticket drafts across these layouts. Light/dark appearance follows CSS automatically, with the same optional override used by Mail. Without JavaScript, a read-only sample still demonstrates the styled layout.

Support composes `f-toolbar`, `f-sidebar`, Button, Input, Select, Textarea, segmented radios, badges, Avatar, and Dialog. Its ticket layout, thread presentation, sample data, and workflow stay in `examples/support/`. The existing Avatar class now lives with shared controls because Mail and Support both use it; this example adds no Blade components or behavior modes to existing controls. In a Laravel application, render these same native controls with Blade, then let Alpine or Livewire own your ticket data and actions.

## One Mail interface, three layouts

The same messages, mailbox navigation, and reading pane adapt through CSS container queries. Layout depends on the space available to Mail, so the interface also works inside a narrower application panel on a wide screen.

| Mail container width | Layout |
| --- | --- |
| Over 900px | macOS-style sidebar, message list, and reading pane |
| 641–900px | Message list and reading pane, with a mailbox selector |
| Up to 640px | iPhone-style Mailboxes, inbox, and message screens |

The phone layout uses a large inbox title, sender avatars, touch controls of at least 44px, a translucent bottom action bar, and a search field with shared state. Opening a message reveals the reading view; Back returns focus to the message in the inbox. The Mailboxes control opens the existing sidebar as a full navigation screen. Previous/next controls and the message action bar stay available while reading.

Switching layouts retains the selected account/folder scope, message, query, read state, and flags. The iPhone preview narrows the same container; it does not create a separate instance of the inbox. The medium-width native mailbox selector includes both combined folders and each account's folders; phone navigation uses the same expandable sidebar groups.

Wrap Mail markup in the named container to enable its responsive styles:

```html
<div class="f-mail-container">
  <section class="f-mail" data-view="list">
    <!-- Shared toolbar, navigation, message list, and reader -->
  </section>
</div>
```

On phones, `data-view="list"`, `data-view="message"`, or `data-view="mailboxes"` selects the visible screen. Alpine (as in this example) or Livewire can update that attribute; CSS determines the layout. Set `--f-mail-mobile-height` on the Mail element to control its height in your application, such as `100dvh` for a full-screen shell. The default is 740px; the example site adapts that height to the phone viewport. Bottom controls account for the device’s safe area.

## CSS alone

Install the checkout as a local dependency in your application:

```sh
npm install ../fruitui
```

Import the stylesheet through your existing asset build:

```js
import 'fruitui/css';
```

Or copy `src/fruitui.css` **and** `src/css/` together and link the entry stylesheet directly. No build tool is required to use the CSS.

```html
<html class="fruit-ui">
  <body>
    <label class="f-field">
      <span class="f-label">Your name</span>
      <input class="f-input" autocomplete="name">
    </label>

    <button class="f-button f-button--primary" type="button">Continue</button>

    <label class="f-switch">
      <input type="checkbox" role="switch">
      <span>Show message previews</span>
    </label>
  </body>
</html>
```

Apply `fruit-ui` to the root element or a containing element. Base element styles are scoped to that container; component classes use the `f-` prefix. Styles are organized into CSS cascade layers, so ordinary application CSS can override them without specificity battles. FruitUI does not require Tailwind or Bootstrap.

With just `class="fruit-ui"`, CSS uses `prefers-color-scheme` to follow the operating system and respond to live appearance changes. `data-theme="system"` does the same. Optional `data-theme="light"` and `data-theme="dark"` on that scope force an appearance even when the system differs. Native controls follow the matching `color-scheme`. This works for a whole page or a containing element, without JavaScript.

Design tokens use the `--f-` prefix and can be overridden on your container. Supply suitable values for both appearances when customizing colors or effects. Shared tokens cover surfaces, text, control states, shadows, and dialog backdrops. Color roles distinguish readable accent text from filled controls. System fonts use San Francisco on Apple platforms when available, and native fallbacks elsewhere. No Apple fonts or symbol assets are distributed.

Native checkbox/radio state, switches, segmented choices, form validation, and disclosure elements work without JavaScript. Dialogs use `<dialog>` for browser-managed focus and Escape dismissal; opening a modal calls its native `showModal()` method. Mail layout classes accept server-rendered HTML independently of the Alpine demonstration.

The framework includes visible focus states, system dark mode, reduced motion, reduced transparency where the browser supports it, and forced-colors adjustments. Web CSS approximates translucent materials; it does not reproduce native Liquid Glass rendering.

## Laravel

The Composer package contains anonymous Blade components and an auto-discovered service provider. In a Laravel application alongside this checkout:

```sh
composer config repositories.fruitui path ../fruitui
composer require fruitui/fruitui:@dev
npm install ../fruitui
```

Import `fruitui/css` in your app’s Vite entry and wrap the layout in `fruit-ui`. Components add classes and retain the caller’s attributes:

```blade
<x-fruit::card class="f-stack">
    <label class="f-field">
        <span class="f-label">Email</span>
        <x-fruit::input type="email" name="email" required />
    </label>

    <x-fruit::switch name="previews" checked>Show previews</x-fruit::switch>
    <x-fruit::button type="submit" variant="primary">Save</x-fruit::button>
</x-fruit::card>
```

Available components: `button` (`default`, `primary`, `ghost`, `danger`), `input`, `checkbox`, `radio`, `switch`, `select`, `textarea`, `card`, `disclosure` (with a `title` prop), and `dialog`. Supply an accessible label for inputs and dialogs. Checkbox, Radio, and Switch wrap their native control in a label; attributes are forwarded to the input, including `id`, `name`, `value`, `checked`, `disabled`, `x-model`, and `wire:model`. Group radios using the same `name` and a fieldset/legend. Blade buttons default to `type="button"`; supported types are `button`, `submit`, and `reset`.

Input accepts only `text`, `email`, `password`, `search`, `tel`, and `url`; `text` is the default. Use the dedicated selection components for checkbox, radio, and switch semantics. Other native control families need their own primitive when a real use arises. Controls keep their native element and role; normal value/action bindings remain available, while `as`, incompatible type/role attributes, and client bindings that change type/role are rejected.

```blade
<div class="f-row">
    <x-fruit::checkbox name="sounds" value="1" wire:model="sounds">Play a sound</x-fruit::checkbox>
    <span class="f-badge">Optional</span>
</div>

<fieldset>
    <legend>Message density</legend>
    <x-fruit::radio name="density" value="comfortable" wire:model="density">Comfortable</x-fruit::radio>
    <x-fruit::radio name="density" value="compact" wire:model="density">Compact</x-fruit::radio>
</fieldset>
```

The row controls arrangement; Checkbox and Radio own their values. Appearance and behavior stay separate without adding mode flags to layout components.

The package allows Laravel 11–13 and PHP 8.2+ (Laravel 13 itself requires PHP 8.3+). Current automated PHP verification runs on Laravel 13 / Livewire 4; the earlier allowed versions have not yet been tested in a compatibility matrix.

## Alpine.js

Register the optional FruitUI helpers with the Alpine instance your application owns:

```js
import Alpine from 'alpinejs';
import fruitUI from 'fruitui/alpine';

fruitUI(Alpine);
Alpine.start();
```

```html
<div x-data="fruitDialog">
  <button class="f-button" type="button" @click="open">Open</button>
  <dialog class="f-dialog" x-ref="dialog" aria-label="Welcome">
    <div class="f-dialog__body">
      <p>Hello, FruitUI.</p>
      <button class="f-button" type="button" @click="close">Close</button>
    </div>
  </dialog>
</div>
```

The add-on registers `fruitDialog`; it neither imports Alpine nor starts a second instance. The Mail state and theme persistence in `examples/` belong to the demonstration site, rather than the framework.

## Livewire

The Blade controls work with Livewire attributes directly:

```blade
<x-fruit::input wire:model="subject" aria-label="Subject" />
<x-fruit::switch wire:model="previews">Show previews</x-fruit::switch>
<x-fruit::button wire:click="save" wire:loading.attr="disabled" variant="primary">
    Save changes
</x-fruit::button>
```

Livewire is optional. Install it in the Laravel host to enable the included session-backed preferences example:

```sh
composer require livewire/livewire
```

```blade
<main class="fruit-ui">
    <livewire:fruit-mail-preferences />
</main>
```

Use Livewire’s existing Alpine instance when combining the two. For a manually bundled Livewire setup, follow its [Alpine bundling instructions](https://livewire.laravel.com/docs/4.x/alpine), register `fruitUI(Alpine)` on the exported instance, then call `Livewire.start()`. With Livewire’s automatic assets, register the helper in an `alpine:init` listener loaded before Livewire initializes. The plain Blade components and preferences example do not need the Alpine helper.

## Project structure

```text
src/fruitui.css                CSS entry point
src/css/                      Tokens, controls, layout, Mail pattern
src/js/alpine.js              Optional Alpine helpers
src/Laravel/                  Service provider and optional Livewire component
resources/views/components/  Thin Blade wrappers for native elements
resources/views/livewire/    Livewire preferences view
examples/                     Mail/Support data, local behavior, showcase styling
index.html                    Mail reference interface
support.html                  Support ticketing reference interface
components.html               Component gallery and integration examples
tests/                        Browser, component-contract, and Laravel integration checks
docs/component-policy.md      Component contracts and change acceptance rules
AGENTS.md                     Contributor rules for component work
```

Keep reusable styles in `src/`, sample-specific presentation and data in `examples/`, and server behavior in the host application. Build additional familiar interfaces from the shared controls to expose gaps in the framework rather than duplicating page-specific styles.

## Verification

```sh
npm run build
npm test
composer install
composer test
```

Browser checks use a local Chrome installation when available, or Playwright’s Chromium (`npx playwright install chromium`). `CHROME_BIN` can select another Chrome executable. Checks cover combined and individual account/mailbox scopes, synchronized counts, sending identity, Mail actions and responsive layouts; Support queues, drafts, replies/notes, assignment, statuses, tags, customer history, and new conversations; appearance persistence; CSS-only operation; and automated WCAG AA checks in light and dark appearances. Theme checks require paired color/effect tokens, prevent fixed colors in core styles, and verify live system switching and explicit overrides on page/container scopes with JavaScript disabled. PHP checks cover contract catalog completeness, invalid options and semantic overrides, native attribute ownership, choice controls with Livewire bindings, and the Livewire session save/reload flow. Native iPhone/Safari verification has not yet been run.

## Design references

FruitUI translates the intent of Apple’s guidance into web-native HTML and CSS; it is an independent project.

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views)
- [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- [Mail reading and reply patterns](https://support.apple.com/en-euro/guide/mail/mlhlp1010/16.0/mac/26)
- [Mail on iPhone](https://support.apple.com/en-euro/guide/iphone/iph461684497/ios)
- [Help Scout shared inbox](https://www.helpscout.com/inbox/)
- [Help Scout folder views](https://docs.helpscout.com/article/1429-about-default-folder-views-in-help-scout)
- [FreeScout shared mailbox](https://www.freescout.net/)

References reviewed on October 2, 2026. Start with readable content, consistent hierarchy, native control semantics, and useful keyboard behavior; keep material effects in the navigation and control layer.
