@props(['variant' => 'default'])
@php(\FruitUI\Support\ComponentContract::menuItem($variant, $attributes))
<button type="button" role="menuitem" {{ $attributes->except(['type', 'role'])->class(['f-menu-item', 'f-menu-item--danger' => $variant === 'danger']) }}>{{ $slot }}</button>
