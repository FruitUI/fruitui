# Changelog

## Unreleased (0.1.0 development)

Breaking changes in this pass, with migration:

- **Conversation List/Row is now Item List/Row.** Rename `x-fruit::conversation-list`/`conversation-row` to `x-fruit::item-list`/`item-row`, `f-conversation-*` classes to `f-item-*`, and `--f-conversation-*` tokens to `--f-item-*`. Markup and behavior are unchanged.
- **Mail CSS is opt-in.** `fruitui/css` (and `build/fruitui.css`) no longer include the Mail reference layout. Add `fruitui/mail.css` (or `mail.compat.css`) if you use `f-mail`.
- **Text uses rem.** Font sizes are `--f-text-*` tokens that follow the reader's browser text size, identical at the default size. An html `.fruit-ui` scope now sizes its body instead of html. Hosts that set a pixel font size on html (Bootstrap 3) add `--f-text-root: 16px` to their scope.
- **Field shows shared validation errors.** Without an `error` prop, Field shows the `$errors` message for its control's `wire:model` key or `name`. Pass `error=""` to opt out for a field.
- `x-fruit::attachment download` now renders `download=""` and keeps the URL's filename (it previously named every file "download").
- Dialogs rendered by `x-fruit::dialog` carry `wire:ignore.self`, so Livewire morphs no longer close an open dialog. Server-changed dialog attributes need a `wire:key` change to re-render.

Added:

- Blade adapters for Avatar, Badge, Tooltip, Sidebar (`sidebar`, `sidebar-group`, `sidebar-item`) and a managed `toaster` outlet.
- Named dialogs (`name`) opened and closed by `fruit-dialog-open`/`fruit-dialog-close` events; `fruitToast({ message })` initial messages.
- `FruitUI\Livewire\WithFruitUI` with `toast()`, `flashToast()`, `openDialog()` and `closeDialog()`.
- `fruit::pagination.default` for Laravel paginators, with Livewire page actions inside components.
- The Support interface as a Livewire single-file component (`examples/laravel`) with browser tests for morphs, `wire:navigate`, validation, dialogs, toasts and pagination.
- Blade contracts live in `docs/component-catalog.json`; `npm run build:docs` generates the policy table. Gallery specimens render from `gallery/specimens` (`composer gallery`); tests fail when either is stale.
- Pint, Prettier and ESLint (`composer lint`, `npm run lint`, `composer format`, `npm run format`), checked in CI.

- Simplify the README to installation and basic usage; keep detailed guidance in the component and adoption docs.
- Require Laravel 13 and PHP 8.3+, with Livewire 4 for optional server interactions. Remove older framework CI jobs and the Laravel 11 advisory exception.
- Convert Mail preferences to a native Livewire 4 single-file component using the class-based format previously provided by Volt. Keep the existing component tag and session data; replace PHP class references with `Livewire::test('fruit-mail-preferences')`. See docs/adoption.md for migration details.

- Add standalone layered core, Layout, Mail and Editor CSS and generated compatibility styles for existing unlayered hosts; preserve the all-in-one CSS entry.
- Ship ES module and browser-global helper bundles, complete package documentation, and optional editor peers. Core installation no longer pulls in Tiptap.
- Fix nested Tabs/Menu ownership, dynamic Combobox options, disabled ancestor fieldsets, enhancement presentation, and native focus/blur and editing event parity.
- Add Field associations, an Editor toolbar slot, translated default labels, generated-text hooks, inherited presentation tokens and logical CSS direction.
- Share Toast timing, replacement, pause/resume and cleanup across all reference applications.
- Add installed-package smoke checks, a real Laravel/Livewire browser host, PHP 8.3/8.5 checks, and Chromium/Firefox/WebKit CI jobs.
- Place Admin notifications in the toolbar and separate settings navigation from the form.

This is an unpublished development package. See docs/adoption.md for the upgrade and validation policy.
