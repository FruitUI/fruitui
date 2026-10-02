@php(\FruitUI\Support\ComponentContract::enhancedControl('combobox', $attributes))
<div class="f-combobox" x-data="fruitCombobox">
    <select data-fruit-control {{ $attributes->class(['f-input']) }}>{{ $slot }}</select>
    <div data-fruit-ui wire:ignore></div>
</div>
