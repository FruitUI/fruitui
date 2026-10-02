@php(\FruitUI\Support\ComponentContract::choice('radio', $attributes))
<label class="f-check">
    <input type="radio" role="radio" {{ $attributes->filter(fn ($value, $name) => ! in_array(strtolower($name), ['type', 'role'], true)) }}>
    <span>{{ $slot }}</span>
</label>
