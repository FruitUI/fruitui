@php(\FruitUI\Support\ComponentContract::validate('toast', $attributes))
<div role="status" {{ $attributes->except('role')->class(['f-toast']) }}>{{ $slot }}</div>
