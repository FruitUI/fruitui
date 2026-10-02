@php(\FruitUI\Support\ComponentContract::semantics('tab', $attributes, 'tab', 'button'))
<button type="button" role="tab" {{ $attributes->except(['type', 'role'])->class(['f-tab']) }}>{{ $slot }}</button>
