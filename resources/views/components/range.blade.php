@php(\FruitUI\Support\ComponentContract::semantics('range', $attributes, null, 'range'))
<input type="range" {{ $attributes->except('type')->class(['f-range']) }}>
