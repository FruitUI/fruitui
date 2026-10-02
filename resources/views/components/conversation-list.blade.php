@php(\FruitUI\Support\ComponentContract::semantics('conversation-list', $attributes, 'list'))
<ul role="list" {{ $attributes->except('role')->class(['f-conversation-list']) }}>{{ $slot }}</ul>
