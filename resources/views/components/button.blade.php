@props(['variant' => 'default', 'type' => 'button'])
<button type="{{ $type }}" {{ $attributes->class([
    'f-button',
    'f-button--primary' => $variant === 'primary',
    'f-button--danger' => $variant === 'danger',
    'f-button--ghost' => $variant === 'ghost',
]) }}>{{ $slot }}</button>
