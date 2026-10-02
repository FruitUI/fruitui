@php(\FruitUI\Support\ComponentContract::enhancedControl('editor', $attributes))
<div class="f-editor" x-data="fruitEditor">
    <div class="f-editor__toolbar" wire:ignore hidden aria-label="Text formatting">
        @foreach(['bold' => 'Bold', 'italic' => 'Italic', 'bulletList' => 'Bullets', 'orderedList' => 'Numbered list', 'blockquote' => 'Quote', 'undo' => 'Undo', 'redo' => 'Redo'] as $command => $label)
            <button class="f-button f-button--ghost" type="button" data-fruit-command="{{ $command }}">{{ $label }}</button>
        @endforeach
    </div>
    <textarea data-fruit-control {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
    <div class="f-editor__surface" wire:ignore hidden></div>
</div>
