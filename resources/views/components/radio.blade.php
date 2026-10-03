@php(\FruitUI\Support\ComponentContract::validate('radio', $attributes))
<label class="f-check">
    <input type="radio" role="radio" {{ $attributes->filter(fn ($value, $name) => ! in_array(strtolower($name), ['type', 'role'], true)) }}>
    <span>{{ $slot }}</span>
</label>
