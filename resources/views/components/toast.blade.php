@php(\FruitUI\Support\ComponentContract::semantics('toast', $attributes, 'status'))
<div role="status" {{ $attributes->except('role')->class(['f-toast']) }}>{{ $slot }}</div>
