# FruitUI

An Apple-inspired, CSS-first interface framework for HTML and Laravel. Familiar controls, thoughtful spacing, and clear hierarchy, with optional Alpine.js and Livewire behavior.

The reference interfaces are **Mail**, **Support**, **Chat**, and **Admin**: familiar workspaces implemented in HTML with FruitUI’s own CSS. The gallery and example pages are available in the repository checkout. This is an early local package; it has not been published to npm or Packagist.

The [component policy](docs/component-policy.md) defines the boundary between tokens, variants, primitives, and composed patterns. Every Blade component has a documented semantic contract; contributors follow [AGENTS.md](AGENTS.md). Unsupported input types, button variants/types, and control type/role overrides raise clear render-time errors.

The [adoption guide](docs/adoption.md) covers Bootstrap coexistence, compiled assets, optional editor installation, Field associations, localization, and compatibility/upgrade policy.

Every component, pattern, example, and interaction state must support dark mode. FruitUI's CSS follows the system appearance automatically, including changes while the page is open, without JavaScript.

The [component gallery](components.html) covers every public CSS family with live specimens and HTML/Blade usage. The [component guide](docs/components.md) documents compositions, slots, native behavior, and presentation tokens. A [checked catalog](docs/component-catalog.json) ties core CSS, Blade adapters, gallery coverage, and actual pattern consumers together.

Mail and Support share the same Conversation List and Conversation Row, including separators, hover/current states, text truncation, and previews. Mail uses the filled current-row appearance; Support uses the quiet appearance. Each example supplies its own responsive geometry and application actions. Mail and Chat share Attachment; all four examples share Empty State. These patterns ship in the CSS package and have Blade wrappers. A bulk-selection checkbox sits beside a conversation-opening button and keeps its own value.

All four examples share Workspace and Pane, with optional draggable/keyboard Splitter controls for column widths. Support and Chat share Composer; Support and Admin share Description List; Mail and Chat share Floating Disclosure. Admin customer/subscription tables use the native Table primitive. Workspace identity marks use scoped Avatar tokens. The [guide](docs/components.md#workspace-frames-panes-and-resizing) covers layout, resize bounds, compact behavior, and Blade usage.

## Run the examples

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 for Mail, http://127.0.0.1:5173/support.html for Support, http://127.0.0.1:5173/chat.html for Chat, http://127.0.0.1:5173/admin.html for Admin, or http://127.0.0.1:5173/components.html for the component gallery. The navigation links the examples side by side. `npm run build` creates a static example site in `dist/` and installable assets in `build/`; `npm run preview` serves that build.

Mail interactions include search, unread filtering, keyboard navigation with the arrow keys, mailbox selection, archive, trash, flag, reply, forward, and a native compose dialog. The inbox and composed messages live in memory for this demo; reloading resets them. No email is delivered. Choose **iPhone** above the example to preview the phone interface from a desktop browser, or resize the window with **Responsive** selected.

Mail and Support start in **All Inboxes**, a virtual view across multiple accounts or team mailboxes. Combined folders appear at the top of navigation; expand an account or mailbox below to open its own folders. Mail includes Work and Personal accounts, with combined Inbox, Flagged, Drafts, Sent, Archive, Junk, and Trash views. Support includes Support, Billing, and Feedback mailboxes, with combined Open, Assigned to me, Unassigned, Waiting, and Closed views. Search and filters apply to the selected scope; global and individual counts stay synchronized after actions. Mail inbox badges count unread messages; other Mail folder badges and Support badges count items.

Combined lists identify each item's source, and the reading/conversation pane keeps its account address visible. Mail replies and forwards start from the message's account; new messages start from the selected account, with a native **From** selector. Support replies use the conversation's mailbox, and new conversations choose a real destination mailbox. Each record has a stable `accountId` (Mail) or `mailboxId` (Support), separate from its folder/status. The virtual `all` scope is only a filter: moving a message or changing a ticket's status preserves its original owner. In Laravel, apply both scope and folder/status constraints to the query and calculate navigation counts within the authenticated user's accessible accounts or mailboxes.

## Support, reimagined

Support combines the shared-inbox workflow of Help Scout and FreeScout with Apple-style split panes, restrained materials, system typography, and a customer inspector. It is a working frontend example, with local sample data rather than a connected help desk.

- Switch between All Inboxes, Assigned to me, Unassigned, Waiting, and Closed, or the same views within an individual team mailbox. Counts follow scope, status, and assignment; search looks through the current view's subjects, customers, tags, and conversation bodies.
- Read customer messages, agent replies, and clearly labeled internal notes. Reply and note drafts stay separate for each ticket as you switch conversations. Notes leave the public reply, assignee, and status intact.
- Assign conversations, move them between statuses, add/remove tags, and open the customer's previous conversations. A reply to a closed conversation reopens it.
- Create an incoming conversation with a native, validated form. Replies and new conversations stay in memory; no email is sent, and reloading resets the workspace.

The workspace responds to its container: over 1100px it shows navigation, ticket list, conversation, and customer details; from 701–1100px it keeps list/conversation panes and lets you open customer details in place; up to 700px it presents views, list, conversation, and customer details as separate screens. Navigation and search preserve per-ticket drafts across these layouts. Light/dark appearance follows CSS automatically, with the same optional override used by Mail. Without JavaScript, a read-only sample still demonstrates the styled layout.

Support composes `f-toolbar`, `f-sidebar`, Button, Input, Select, Textarea, segmented radios, badges, Avatar, and Dialog. Its column placement, thread presentation, sample data, and workflow stay in `examples/support/`; its frame, panes, composer and facts use shared components. The existing Avatar class now lives with shared controls because Mail and Support both use it; shared layout patterns have equivalent Blade adapters without adding behavior modes to existing controls. In a Laravel application, render these same native controls with Blade, then let Alpine or Livewire own your ticket data and actions.

## Chat, reimagined

Chat brings a Slack-style team workspace to the same Apple-inspired visual system: a material sidebar, clear conversation hierarchy, and a thread inspector. It uses one local Forma workspace with channels and direct messages.

- Open channels or direct messages, create a channel with native name validation, and start a direct message with a teammate. Selecting an existing recipient reopens the same conversation.
- Send messages with Enter; use Shift + Enter for a new line. Each conversation and each thread retains its own draft across navigation and layout changes. Thread replies stay attached to the original message rather than appearing as new channel messages.
- Toggle reactions with per-person counts, download the sample interaction notes, and inspect a conversation's description and members.
- Search messages and thread replies across the workspace. Results keep their conversation context; opening a thread result takes you to its parent discussion.
- Use **All unread** for new messages across channels and direct messages, or **Threads** to return to discussions with replies. Opening a conversation marks its messages read; **Mark all read** clears the combined unread view.

| Chat container width | Layout |
| --- | --- |
| Over 1100px | Workspace sidebar, conversation, and thread inspector when open |
| 701–1100px | Workspace sidebar alongside the conversation or thread |
| Up to 700px | Workspace navigation, conversation, and thread as separate screens |

The same data, drafts, reactions, and selected conversation survive resizing. Navigation restores focus to the current conversation or thread trigger. Light/dark appearance follows CSS automatically; the shared appearance control offers an optional override. Without JavaScript, native channel disclosures and a read-only conversation demonstrate the layout.

Chat composes the existing Toolbar, Sidebar groups, Avatar, Button, Input, Textarea, Select, Badge, and Dialog styles. Its message flow, full thread arrangement, and application state stay in `examples/chat/`; frames, panes, composers and floating disclosures use shared CSS/Blade patterns. `roomId` owns conversation scope, `threadId` identifies a parent message, and drafts are keyed independently by conversation and thread. For Laravel, render the same HTML and let Alpine or Livewire own actions and data. Messages, membership, unread state, and reactions should be stored and authorized by the application.

This is a frontend example with sample people and messages. Sending, reacting, and creating conversations only changes the current page; nothing is delivered, and reloading resets it. It does not connect to Slack or provide a realtime backend.

## Admin, with a clearer view

Admin brings customer and subscription management to the same visual system. Its Overview combines current record statistics, a revenue history chart, a plan distribution chart, and a customer table. A two-level sidebar groups working destinations under Customers, Billing, Reports, and Settings. Group headings use native disclosures; independent links choose destinations. Navigating to a destination opens its group and highlights the corresponding link without closing unrelated groups.

| Sidebar group | Working destinations |
| --- | --- |
| Customers | Directory, Segments |
| Billing | Subscriptions, Plans |
| Reports | Revenue, Activity |
| Settings | Workspace |

Open a customer's name in the directory to see a detail screen with **Profile**, **Subscription**, and **Activity** tabs. The tablist uses native buttons with fixed tab roles, linked panels, and one tab stop; Left/Right wrap between tabs, Home/End choose the first/last tab, and Tab moves into the selected panel. Breadcrumb links return to the customer profile, directory, or Overview. Customer records stay out of the sidebar so the navigation hierarchy remains shallow.

Destinations and customer tabs have native hash links such as `admin.html#/plans` and `admin.html#/customers/cus_1001/subscription`. They support bookmarks, reloads, and browser Back/Forward. Opening a deep destination reveals its sidebar group. Invalid or deleted customer routes return to the directory; reloading always restores the original sample data.

- Create and edit customers in a native dialog with required fields, email validation, and duplicate email checks. Plan and status choices update monthly recurring revenue, active/trial counts, and the plan chart. Internal notes and the product updates checkbox retain their own values.
- Search names, companies, and email addresses; filter by plan and subscription status; sort with native table header buttons and `aria-sort`; and paginate with five or ten records per page.
- Open a lifecycle segment or plan to see its real customer records with the matching status/plan filter. The subscription table has its own search and status filter, and each subscription links to the matching customer's Subscription tab. Revenue presents the existing charts as a dedicated report.
- Select individual records with native checkboxes, or select the current page. Selection persists across pages, while changing filters or page size clears it. Delete one record or a selection through a confirmation dialog that names the customer or gives the selection count. Cancel and Escape leave records intact.
- Export all records matching the current search, plan, and status to CSV, across pages. Fields are quoted and leading spreadsheet formula characters are neutralized.
- Inspect historical revenue by month, change between three and six months, or expand the native disclosure for the equivalent data table. The historical sample stays independent of editable current subscriptions; the plan chart and summary statistics follow current records.
- Review customer/settings changes in Reports → Activity, or inspect only the selected customer's changes in their Activity tab. Save or reset workspace settings using native text fields and switches. Saved settings and records stay in this page; refreshing restores the fixtures. No subscription is billed or notification sent.

Layout follows the Admin container: above 700px, navigation sits beside the content; narrower containers use a toolbar disclosure for navigation, stacked charts, and touch controls. Table columns remain in a native table with a labeled, keyboard-focusable horizontal scroll area. Data, filters, selection, and forms survive resizing. CSS automatically follows light/dark system changes, and the shared appearance control offers an override. Without JavaScript, the read-only Overview, sample rows, charts, and native chart-data disclosure remain available.

Admin composes Toolbar, Sidebar groups, Card, Avatar, Button, Input, Select, Textarea, Checkbox, Switch, and Dialog. Its records, chart presentation, customer tablist, breadcrumbs, and hash navigation stay in `examples/admin/`; frames, panes, facts and native table presentation use shared components. The native table owns tabular semantics, independent checkboxes own record selection, and native buttons own sort/edit/delete actions. Customer tabs have their own fixed roles, selection, panel relationships, and keyboard behavior in the example. For Laravel, render the same markup with Blade and let Alpine or Livewire own records and actions; use application routes for navigation. Persistence, authorization, billing, and notifications belong to the host application.

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
  <section class="f-workspace f-mail" data-view="list">
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

Select uses the same native `<select class="f-input">` / `<x-fruit::select>` everywhere. Supporting desktop browsers receive a CSS-styled picker, option rows, selection checkmarks, groups, and disabled states; multiple/size listboxes keep their native values and visible row count. Both appearances switch automatically. Touch devices retain their operating system's picker, and browsers without [customizable select support](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) retain native rendering with the matching color scheme. Native popups can limit option styling. No JavaScript or replacement form control is needed. See [Select usage](docs/components.md#select).

Native forms share checkbox/radio marks, grouped fields, readonly/autofill states, search clearing, file buttons, range sliders, numeric/date/time fields, color swatches, progress, and meters. Quotes, code, keyboard hints, and dividers use shared baseline typography. Every family has gallery examples and automatically follows light/dark appearance; browser/OS picker dialogs retain their native presentation. See [native forms and indicators](docs/components.md#native-forms-and-indicators).

The framework includes visible focus states, system dark mode, reduced motion, reduced transparency where the browser supports it, and forced-colors adjustments. Web CSS approximates translucent materials; it does not reproduce native Liquid Glass rendering.

## Laravel

The Composer package contains Blade components and an auto-discovered service provider. In a Laravel application alongside this checkout:

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

The [checked catalog](docs/component-catalog.json) is the complete public CSS/Blade inventory, including Field, Toast, support controls and shared layouts. Supply an accessible label for inputs and dialogs. Checkbox, Radio, and Switch wrap their native control in a label; attributes are forwarded to the input, including `id`, `name`, `value`, `checked`, `disabled`, `x-model`, and `wire:model`. Group radios using the same `name` and a fieldset/legend. Blade buttons default to `type="button"`; supported types are `button`, `submit`, and `reset`. Conversation Row always uses `type="button"`; its slots contain noninteractive identity/preview content, while action bindings reach the button. Conversation List accepts native `li` children. Attachment requires a native URL; Empty State composes informational content and independent recovery actions. See the [pattern guide](docs/components.md) for HTML, Blade, and slot examples.

Input accepts only `text`, `email`, `password`, `search`, `tel`, and `url`; `text` is the default. Use the dedicated selection components for checkbox, radio, and switch semantics. File, Number, Date, Time, Color, and Range have dedicated native adapters; Progress and Meter display task completion and bounded measurements. Date accepts `date`, `datetime-local`, `month`, and `week`. Controls keep their native element and role; normal value/action bindings remain available, while `as`, incompatible type/role attributes, and client bindings that change type/role are rejected.

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

The package allows Laravel 11–13 and PHP 8.2+ (Laravel 13 itself requires PHP 8.3+). The [compatibility workflow](.github/workflows/test.yml) checks PHP 8.2 / Laravel 11 / Livewire 3, PHP 8.3 / Laravel 12 / Livewire 3, and PHP 8.5 / Laravel 13 / Livewire 4. Each job runs PHP contracts, package installation checks, and browser interaction with a real Laravel host. Laravel 11 is tested for historical compatibility; use Laravel 12/13 for new integrations because [Laravel 11's upstream security support ended](https://laravel.com/framework/docs/13.x/releases#support-policy). Check the [latest CI results](https://github.com/nielspeen/fruitui/actions/workflows/test.yml) for the current verification status.

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

The add-on registers `fruitDialog`, `fruitSplitter`, `fruitFloatingDisclosure`, `fruitCombobox`, `fruitTokenField`, `fruitMenu`, `fruitTooltip`, `fruitTabs`, `fruitToast`, and a native `fruitEditor` fallback (replaced by the optional editor plugin); it neither imports Alpine nor starts a second instance. The Mail state and theme persistence in `examples/` belong to the demonstration site, rather than the framework.

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
src/css/                      Tokens, controls, layout, shared patterns, Mail shell
src/js/alpine.js              Optional Alpine helpers
src/Laravel/                  Service provider and optional Livewire component
resources/views/components/  Thin Blade wrappers for native elements
resources/views/livewire/    Livewire preferences view
examples/                     Mail/Support/Chat/Admin data, local behavior, showcase styling
index.html                    Mail reference interface
support.html                  Support ticketing reference interface
chat.html                     Team chat reference interface
admin.html                    Administration reference interface
components.html               Component gallery and integration examples
tests/                        Browser, component-contract, and Laravel integration checks
docs/component-policy.md      Component contracts and change acceptance rules
docs/component-catalog.json   Checked public CSS/Blade inventory and reuse evidence
docs/components.md            Public compositions, slots, and presentation tokens
AGENTS.md                     Contributor rules for component work
```

Keep reusable styles in `src/`, sample-specific presentation and data in `examples/`, and server behavior in the host application. Build additional familiar interfaces from the shared controls to expose gaps in the framework rather than duplicating page-specific styles.

## Verification

```sh
npm run build
npm test
npm run test:package
composer install
composer test
```

Browser checks default to a local Chrome installation when available, or Playwright’s Chromium (`npx playwright install chromium`). `CHROME_BIN` can select another Chrome executable. Use `FRUITUI_BROWSERS=chromium,firefox,webkit npm test` for all three engines after installing them with `npx playwright install chromium firefox webkit`; CI runs all three on the Laravel 13 job. Checks cover combined and individual account/mailbox scopes, synchronized counts, sending identity, Mail actions and responsive layouts; Support queues, drafts, replies/notes, assignment, statuses, tags, customer history, and new conversations; Chat conversations, threads, workspace search, unread activity, drafts, reactions, and creation dialogs; Admin record CRUD, sorting/filtering, pagination, bulk selection, CSV export, charts, workspace settings, grouped navigation, customer tabs, breadcrumbs, and browser history; appearance persistence; CSS-only operation; and automated WCAG AA checks in light and dark appearances. Theme checks require paired color/effect tokens, prevent fixed colors in core styles, and verify live system switching and explicit overrides on page/container scopes with JavaScript disabled. PHP checks cover contract catalog completeness, invalid options and semantic overrides, native attribute ownership, choice controls with Livewire bindings, and the Livewire session save/reload flow. Native iPhone/Safari verification has not yet been run.

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
- [Slack conversations](https://slack.com/intl/en-gb/help/articles/1500000019301-Find-and-start-conversations)
- [Slack threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions)

References reviewed on October 2, 2026. Start with readable content, consistent hierarchy, native control semantics, and useful keyboard behavior; keep material effects in the navigation and control layer.

The [support interface components](docs/support-components.md) cover searchable choices, recipient tokens, action menus, persistent alerts, tabs, pagination, joined controls, upload rows, message content, and the optional rich editor. Working specimens and HTML/Blade usage are in the [component gallery](components.html).
