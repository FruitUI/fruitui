@props(['wrapper' => []])
@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::control('editor', $attributes, $fruitField))
<div {{ \FruitUI\Support\ComponentContract::wrapper($wrapper)->class(['f-editor']) }} x-data="fruitEditor">
    <div class="f-editor__toolbar" wire:ignore hidden aria-label="{{ __('Text formatting') }}">
        @isset($toolbar)
            {{ $toolbar }}
        @else
        @foreach(['bold' => 'Bold', 'italic' => 'Italic', 'bulletList' => 'Bullets', 'orderedList' => 'Numbered list', 'blockquote' => 'Quote', 'undo' => 'Undo', 'redo' => 'Redo'] as $command => $label)
            <button class="f-button f-button--ghost" type="button" data-fruit-command="{{ $command }}">{{ __($label) }}</button>
        @endforeach
        @endisset
    </div>
    <textarea data-fruit-control {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
    <div class="f-editor__surface" wire:ignore hidden></div>
</div>
