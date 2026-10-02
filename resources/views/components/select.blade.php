@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('select', $attributes))
<select {{ $attributes->class(['f-input']) }}>{{ $slot }}</select>
