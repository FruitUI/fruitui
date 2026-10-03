# FruitUI

FruitUI is an Apple-inspired, CSS-first UI framework for HTML and Laravel. It includes native controls, reusable layouts, and optional Alpine.js and Livewire behavior. Light and dark appearances follow the system automatically through CSS.

Requires **Laravel 13 and PHP 8.3+** for the Blade adapters. Livewire is optional; integrations target **Livewire 4**. The package is in development and is not published to npm or Packagist yet.

## Use with Laravel

From a Laravel application alongside this checkout:

```sh
composer config repositories.fruitui path ../fruitui
composer require fruitui/fruitui:@dev
npm install ../fruitui
```

Import the CSS in your application's Vite entry:

```js
import 'fruitui/css';
import 'fruitui/mail.css'; // only for the Mail reference layout
```

Wrap your layout in `fruit-ui` and use the Blade components:

```blade
<main class="fruit-ui">
    <x-fruit::card class="f-stack">
        <x-fruit::field control-id="email" label="Email">
            {{-- Shows the validation error for "email" from $errors automatically --}}
            <x-fruit::input type="email" name="email" required />
        </x-fruit::field>
        <x-fruit::button variant="primary">Continue</x-fruit::button>
    </x-fruit::card>
</main>
```

Use `data-theme="light"` or `data-theme="dark"` on the same container to override the system appearance. Customize presentation with the shared `--f-` CSS tokens.

## Use with HTML

Run `npm ci && npm run build:package` in this checkout, then copy `build/fruitui.css` into your application's public assets:

```html
<link rel="stylesheet" href="/css/fruitui.css">
<main class="fruit-ui">
    <button class="f-button f-button--primary" type="button">Continue</button>
</main>
```

The [component guide](docs/components.md) includes HTML and Blade examples. For Bootstrap coexistence, smaller CSS imports, and compiled JavaScript bundles, see [adoption](docs/adoption.md).

## Livewire and Alpine.js

Blade controls accept `wire:model`, `wire:click`, and other native bindings. The included Mail preferences example uses **Livewire 4 single-file components**: PHP and Blade together, using the class-based format previously provided by Volt. [Livewire 4 supports this format directly](https://livewire.laravel.com/docs/4.x/upgrading#upgrading-volt).

```sh
composer require "livewire/livewire:^4.0"
```

```blade
<main class="fruit-ui">
    <livewire:fruit-mail-preferences />
</main>
```

These example preferences are stored in the current session.

Components can send feedback from the server. Put `<x-fruit::toaster />` in your layout, then:

```php
use FruitUI\Livewire\WithFruitUI;

class Tickets extends Component
{
    use WithFruitUI;

    public function archive(): void
    {
        $this->closeDialog('confirm-archive'); // <x-fruit::dialog name="confirm-archive">
        $this->toast('Conversation archived.');
    }
}
```

Laravel paginators render with `$items->links('fruit::pagination.default')`, which also works inside Livewire components that use `WithPagination`.

For interactive helpers such as searchable choices, dialogs, and resizable panes, register `fruitui/alpine` on your application's existing Alpine instance. See [JavaScript setup](docs/adoption.md#javascript-and-optional-editing).

## Explore the examples

Requires Node 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open [Mail](http://127.0.0.1:5173/), [Support](http://127.0.0.1:5173/support.html), [Chat](http://127.0.0.1:5173/chat.html), [Admin](http://127.0.0.1:5173/admin.html), or the [component gallery](http://127.0.0.1:5173/components.html). These are interactive frontend examples using sample data.

The Support interface also exists as a Livewire 4 single-file component in [examples/laravel](examples/laravel/support-desk.blade.php). With `npm run dev` running, start the bundled Laravel host with `composer install && node scripts/serve-host.mjs` and open [the Livewire Support desk](http://127.0.0.1:5180/support).

## Documentation

- [Components](docs/components.md): usage, slots, and customization.
- [Adoption](docs/adoption.md): integration, compatibility, and verification.
- [Component policy](docs/component-policy.md): contracts and contributor rules.
