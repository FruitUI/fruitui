@php(\FruitUI\Support\ComponentContract::semantics('card', $attributes, ['group', 'region']))
<section {{ $attributes->class(['f-card']) }}>{{ $slot }}</section>
