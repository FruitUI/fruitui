@props(['tone' => 'neutral'])
@php(\FruitUI\Support\ComponentContract::validate('divider', $attributes, ['tone' => $tone]))
@php($label = trim(strip_tags($slot)))
<div role="separator" @if($label !== '') aria-label="{{ $label }}" @endif {{ $attributes->except(['role', 'aria-label'])->class(['f-divider', 'f-divider--accent' => $tone === 'accent']) }}>@if($label !== '')<span aria-hidden="true">{{ $slot }}</span>@endif</div>
