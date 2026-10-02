@props(['title'])
@php(\FruitUI\Support\ComponentContract::semantics('disclosure', $attributes, 'group'))
<details {{ $attributes->class(['f-disclosure']) }}>
    <summary>{{ $title }}</summary>
    <div>{{ $slot }}</div>
</details>
