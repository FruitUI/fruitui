@php(\FruitUI\Support\ComponentContract::semantics('textarea', $attributes, 'textbox'))
<textarea {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
