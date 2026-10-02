@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('textarea', $attributes, 'textbox'))
<textarea {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
