@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('textarea', $attributes))
<textarea {{ $attributes->class(['f-input']) }}>{{ $slot }}</textarea>
