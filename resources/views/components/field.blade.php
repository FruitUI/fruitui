@php(\FruitUI\Support\ComponentContract::semantics('field', $attributes, 'group'))
<div {{ $attributes->class(['f-field']) }}>
    <label class="f-label" for="{{ $controlId }}">{{ $label }}</label>
    {{ $slot }}
    @if($description !== null && $description !== '')
        <p class="f-help" id="{{ $controlId }}-description">{{ $description }}</p>
    @endif
    @if($error !== null && $error !== '')
        <p class="f-error" id="{{ $controlId }}-error">{{ $error }}</p>
    @endif
</div>
