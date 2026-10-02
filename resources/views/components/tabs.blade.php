@php(\FruitUI\Support\ComponentContract::semantics('tabs', $attributes, 'tablist'))
<div role="tablist" {{ $attributes->except('role')->class(['f-tabs']) }}>{{ $slot }}</div>
