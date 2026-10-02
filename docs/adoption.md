# Adopting FruitUI

FruitUI remains an unpublished 0.1 development package. Public contracts are the checked catalog, component policy and this guide. The npm package is private/UNLICENSED and Composer metadata is proprietary; no open-source redistribution license has been chosen. Existing private-project use can continue. Publication requires an explicit license and release decision.

## Delivery and CSS coexistence

`npm run build` builds the showcase in `dist/` and distributable assets in `build/`. `npm pack` builds and ships source, compiled assets, and documentation. The default `fruitui/css` entry retains the full existing stylesheet. For a smaller application stylesheet:

```css
@import 'fruitui/core.css';
/* Only if used: */
@import 'fruitui/layout.css';
@import 'fruitui/mail.css';
@import 'fruitui/editor.css';
```

Core includes controls, utilities and shared content patterns. Layout adds Toolbar, Sidebar, Workspace, Pane and Splitter presentation. Mail extends Core/Layout with only the reference Mail layout; Editor contains its optional presentation. Importing the editor's CSS does not install or initialize a rich editor.

Layered CSS is the default: application overrides can stay unlayered. Existing Bootstrap styles are also unlayered and therefore outrank layered declarations, even when loaded first. A legacy host can either put its existing styles into a lower cascade layer or use the generated **compatibility** styles after its existing stylesheet:

```html
<link rel="stylesheet" href="/css/bootstrap.css">
<link rel="stylesheet" href="/css/fruitui/core.compat.css">
<!-- Optional: layout.compat.css, then mail.compat.css, or editor.compat.css -->
<div class="fruit-ui">…FruitUI controls…</div>
```

Copy assets from `build/` to the host's public assets directory, or resolve `fruitui/dist/core.compat.css` in the host bundler. The all-in-one file is `fruitui.compat.css`. Both variants are generated from the same source; compatibility CSS removes layers and gives the scoped baseline normal class specificity. All generic resets stay within `.fruit-ui`, and component selectors use `f-*`. Do not put Bootstrap's `btn`/`form-control` and FruitUI classes on the same control. Hosts with more specific custom rules still need their own cascade review.

This fits FreeScout's existing Blade/Bootstrap/jQuery setup without changing its build pipeline. Start with a scoped screen; keep existing Select2 and Summernote controls until that screen deliberately adopts a FruitUI enhancement. FruitUI does not automatically replace controls or initialize another Alpine instance.

## JavaScript and optional editing

```js
import fruitUI from 'fruitui/alpine';
fruitUI(Alpine); // Existing instance, before Alpine/Livewire starts.
```

The compiled `fruitui/dist/alpine.js` provides the same exports without a bundler. `alpine.global.js` exposes `FruitUI.default(Alpine)` and `FruitUI.fruitToast`; load it before your existing instance starts. The helpers never include or start Alpine. With automatically loaded Livewire scripts, register in `alpine:init` before Livewire initializes. With Livewire's manual bundle, register on its exported Alpine, then call `Livewire.start()`.

Core installs no editor packages. To import the source `fruitui/editor` module, install its optional peers (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, compatible 3.x) in the host. Alternatively, `fruitui/dist/editor.js` bundles those dependencies; `editor.global.js` exposes `FruitEditor(Alpine)`. Register fruitUI first, then fruitEditor on that same instance, and load Editor CSS. Core registers a quiet native Editor fallback; the optional plugin replaces it before Alpine starts. Without it, Editor remains a native textarea; Token Field and Combobox also preserve editable native fallbacks without Alpine.

All form names, IDs, validation and models belong to the canonical select/textarea. Only generated presentation containers use `wire:ignore`; never ignore the whole control wrapper. Editor sends `input` during editing and one `change` when focus leaves the widget, including its toolbar; it forwards native `focus`/`blur`. Discrete option/token commits send `input` and `change`. An unchanged value sends no duplicate events. Resets and external value updates do not emit user edit events.

Respect the host Livewire version's modifiers: Livewire 3 uses `.change`/`.blur` for network timing; Livewire 4 uses `.live.change`/`.live.blur` for that behavior. FruitUI forwards events without changing those semantics. Server HTML sanitization, recipient validation, permission checks and upload transport stay with the application.

## Fields and presentation ownership

```blade
<x-fruit::field control-id="email" label="Email"
    description="Use your work address" :error="$errors->first('email')">
    <x-fruit::input type="email" name="email" wire:model.blur="email"
        aria-describedby="additional-help" />
</x-fruit::field>
```

Field associates one control with its label, merges help/error IDs into `aria-describedby`, and marks a supplied error invalid. Supported child adapters are Input, Textarea, Select, Number, Date, Time, File, Color, Range, Combobox, Token Field and Editor. They inherit a namespaced Field association, isolated from unrelated parent component props; a mismatched child ID is rejected. Give plain HTML children those associations yourself. Independent choice groups use Fieldset/Legend. Field owns no value, validation rule or model.

Enhanced adapters accept `:wrapper="['class' => 'account-picker', 'style' => 'max-width:20rem', 'data-fruit-no-matches' => __('No matches')]"`. The wrapper accepts id/class/style/dir/lang/data attributes. Native attributes and bindings remain on the control. Native class/style are mirrored to visible presentation, retaining the same no-JavaScript fallback. Token Field maxlength limits the complete newline-serialized string.

Editor accepts a named `toolbar` slot for translated/custom button content. Use native buttons with `data-fruit-command` set to bold, italic, bulletList, orderedList, blockquote, undo or redo. Unknown commands remain disabled. Default toolbar labels, menu/pagination labels and generated helper text use Laravel's `__()`; wrapper overrides take precedence. Use the same literal template keys (including curly placeholders) in the host JSON translations.

## Customization, direction and generated text

Component customization tokens inherit from an application scope. `--f-internal-*` variables implement variant defaults and are private; application reference layouts may still assign their own geometry tokens locally. A component uses its documented fallback rather than resetting that token on itself. Color overrides must provide both appearances. The existing default dimensions are retained; scopes can adjust `--f-control-height`, `--f-control-font-size`, `--f-control-line-height`, `--f-control-padding-block`, `--f-control-padding-inline`, `--f-button-height`, `--f-button-padding-block`, `--f-button-padding-inline`, and `--f-field-gap`. Coarse-pointer controls retain a 44px target floor and 16px input text. Size tokens change presentation only.

Set `dir="rtl"` on the application scope for logical shared spacing, search icons, pane borders, switch thumbs and popup alignment. Tab and token directional keys follow inline direction; splitters already account for RTL. Reference applications retain their own routing, language and column arrangements; product-level translation and mirroring still belong to the host.

Generated English text can be replaced on the helper root (or the Blade wrapper bag):

| Helper | Attributes and placeholders |
| --- | --- |
| Combobox | `data-fruit-no-matches` |
| Token Field | `data-fruit-placeholder`, `data-fruit-remove-label` (`{value}`), `data-fruit-removed-message` (`{value}`), `data-fruit-count-message` (`{count}`), `data-fruit-invalid-message`, `data-fruit-length-message` (`{count}`) |
| Splitter | `data-fruit-value-text` (`{count}` pixels) |

Text is rendered as text, with no HTML interpolation. For pluralization, set the template appropriate to the host language or supply application announcements. Visible supplied labels/options, validation messages and Toast text remain host content.

## Shared notices

`fruitToast({duration:4000})` can be registered as its own Alpine scope or spread into application state using the exported factory. `notify(message)` replaces the current message and cancels the old timer; `dismissNotice()`, `pauseNotice()` and `resumeNotice()` control its lifetime. Duration zero keeps it until explicitly dismissed. Call `destroyToast()` if the application's own destroy lifecycle overrides the factory's destroy method. Mail, Support, Chat and Admin use this same implementation.

The Blade Toast adapter renders a native status container with a content slot. It does not start timers. Add independent action/dismiss buttons as needed and pause the helper on pointer hover and focus within. For messages requiring a response, use persistent Alert or Dialog. Toast does not own a global bus or notification delivery.

## Compatibility and upgrades

Declared adapters support PHP 8.2+, Laravel 11–13 and optional Livewire 3–4. CI selects Testbench 9/10/11 with those Laravel generations and runs actual browser/server interaction. The local verified environment is PHP 8.5, Laravel 13 and Livewire 4; a committed workflow is not evidence that every remote matrix job has already passed.

Browser CI targets Chromium, Firefox and WebKit. Locally choose `FRUITUI_BROWSERS=chromium,firefox,webkit npm test` after installing Playwright browsers. These browser engines do not establish native macOS/iOS Safari or operating-system picker verification. Unsupported custom-select styling falls back to a native picker; lack of Popover support retains the CSS-positioned disclosure/list fallback.

Required checks: `composer test`, `npm run build`, `npm test`, and `npm run test:package`. The package smoke test installs an actual tarball in an isolated host, checks shipped docs/exports/bundles, and proves core installation does not pull in Tiptap. Browser coverage includes native/CSS fallbacks, themes, responsive layouts, keyboard/ARIA checks, nested ownership, dynamic options, resets, teardown and an actual Laravel/Livewire host. Keep security, business operations and application-specific workflows in application tests.

During 0.x, changing native markup, serialized values, documented options, tokens, selectors or events requires a changelog and migration guidance; breaking changes require a minor version increment before release. Patch versions preserve those public contracts. `__` descendants remain documented presentation parts where listed in the catalog/guide; private JavaScript implementation details are not an integration API. Default all-in-one imports and canonical native value formats remain compatible in this pass. When updating a Laravel installation, clear compiled Blade views (`php artisan view:clear`), particularly for the Field adapter. The corrected Editor change timing affects callers that previously relied on keystroke change events: use input/live bindings for immediate edits.
