# FruitUI development rules

Read [docs/component-policy.md](docs/component-policy.md) before adding or changing a component API. These are the project's acceptance rules:

- Give each primitive one semantic purpose and a stable native element, state model, and keyboard contract. Add its contract to the policy catalog.
- Use existing design tokens for visual customization and small, explicit enums for supported variants. Do not create a new component solely for a color or add behavior-changing mode flags to an unrelated primitive.
- Every component, pattern, example, and interaction state must support light and dark appearances. Follow the system preference automatically through CSS, including live changes without JavaScript. Use shared semantic color/effect tokens with both palettes; keep optional explicit light/dark overrides. Check both appearances, including focus, hover, selection, errors, disabled controls, and overlays.
- Compose independent controls and use slots for content arrangements. A layout row can contain a checkbox; it must not become the checkbox or own its value.
- Introduce a new primitive when it represents a distinct semantic control. Extract reusable patterns after two actual uses demonstrate the same need; keep single-example details in `examples/`. The initial Mail reference pattern is the project's existing starting point.
- Preserve the same contract in HTML/CSS, Blade, Alpine, and Livewire. Put classes and native controls in the CSS/Blade layers; add local or server behavior through the existing Alpine/Livewire instance. Do not start another Alpine instance.
- Preserve native form attributes, labels, `x-model`, `wire:model`, and action attributes on the real control. Protect fixed element/type/role semantics instead of allowing polymorphic `as` or client bindings that change the kind of control.
- For component work, run `composer test`, `npm run build`, and `npm test`. Test changed contracts, invalid options, form values, and integration behavior. Reuse the existing accessibility, theme, and responsive checks; add focused cases when behavior changes.
- Explain a new primitive's distinct purpose or a new pattern's two real uses in the change description. Describe supported options and slots, and update the policy catalog and component gallery when the public API changes.
- Update `docs/component-catalog.json` for every public CSS family or Blade adapter. Each entry needs a gallery specimen, HTML and Blade usage, and actual example paths for extracted patterns. When adding an example, compare repeated arrangements with existing examples and extract common presentation once two real uses exist; explain any differences left local.

Keep changes focused. Do not add speculative configuration, universal component dispatchers, or a new abstraction solely to reduce the component count.
