@props(['name' => null])
@php(\FruitUI\Support\ComponentContract::dialog($name, $attributes))
<dialog {{ $attributes->class(['f-dialog'])->merge(['data-fruit-dialog' => $name]) }} wire:ignore.self>{{ $slot }}</dialog>
