# Changelog

## Unreleased (0.1.0 development)

- Add clean-runner compatibility checks for Laravel 11/12/13 and Livewire 3/4, including portable Alpine event assertions. Laravel 11 is a historical compatibility target with an isolated CI-only advisory exception; new integrations should use Laravel 12/13.

- Add standalone layered core, Layout, Mail and Editor CSS and generated compatibility styles for existing unlayered hosts; preserve the all-in-one CSS entry.
- Ship ES module and browser-global helper bundles, complete package documentation, and optional editor peers. Core installation no longer pulls in Tiptap.
- Fix nested Tabs/Menu ownership, dynamic Combobox options, disabled ancestor fieldsets, enhancement presentation, and native focus/blur and editing event parity.
- Add Field associations, an Editor toolbar slot, translated default labels, generated-text hooks, inherited presentation tokens and logical CSS direction.
- Share Toast timing, replacement, pause/resume and cleanup across all reference applications.
- Add installed-package smoke checks, a real Laravel/Livewire browser host and a Laravel 11–13 / Livewire 3–4 / browser CI matrix.
- Place Admin notifications in the toolbar and separate settings navigation from the form.

This is an unpublished development package. See docs/adoption.md for the upgrade and validation policy.
