@props(['variant' => 'quiet'])
@php(\FruitUI\Support\ComponentContract::conversationRow($variant, $attributes))
<button type="button" {{ $attributes->except('type')->class(['f-conversation-row', 'f-conversation-row--filled' => $variant === 'filled']) }}>
    @isset($leading)<span {{ $leading->attributes->class(['f-conversation-row__leading']) }}>{{ $leading }}</span>@endisset
    <span class="f-conversation-row__top">
        <span class="f-conversation-row__title">{{ $title ?? $slot }}</span>
        @isset($trailing)<span {{ $trailing->attributes->class(['f-conversation-row__time']) }}>{{ $trailing }}</span>@endisset
    </span>
    @isset($subtitle)<span {{ $subtitle->attributes->class(['f-conversation-row__subtitle']) }}>{{ $subtitle }}</span>@endisset
    @isset($preview)<span {{ $preview->attributes->class(['f-conversation-row__preview']) }}>{{ $preview }}</span>@endisset
    @isset($meta)<span {{ $meta->attributes->class(['f-conversation-row__meta']) }}>{{ $meta }}</span>@endisset
</button>
