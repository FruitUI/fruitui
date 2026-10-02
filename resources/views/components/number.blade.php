@php(\FruitUI\Support\ComponentContract::semantics('number', $attributes, null, 'number'))
<input type="number" {{ $attributes->except('type')->class(['f-input']) }}>
