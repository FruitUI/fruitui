# Changelog

## Unreleased (0.1.0 development)

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
