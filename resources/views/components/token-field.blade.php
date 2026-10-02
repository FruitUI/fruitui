@php(\FruitUI\Support\ComponentContract::enhancedControl('token-field', $attributes))
<div class="f-token-field" x-data="fruitTokenField">
    <textarea data-fruit-control {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
    <div data-fruit-ui wire:ignore></div>
</div>
