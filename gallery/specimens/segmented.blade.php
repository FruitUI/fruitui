<div class="f-stack">
    <x-fruit::segmented legend="Preview Position">
        <x-fruit::segment name="preview" value="right" checked>Right</x-fruit::segment>
        <x-fruit::segment name="preview" value="below">Below</x-fruit::segment>
        <x-fruit::segment name="preview" value="off">Off</x-fruit::segment>
    </x-fruit::segmented>
    {{-- In a toolbar the group is named for assistive technology only. --}}
    <header class="f-toolbar" style="flex-wrap: wrap">
        <h3 class="f-headline">New Conversation</h3>
        <span class="f-toolbar__spacer"></span>
        <x-fruit::segmented legend="Conversation Type" legend-hidden>
            <x-fruit::segment name="conversation_type" value="email" checked>Email</x-fruit::segment>
            <x-fruit::segment name="conversation_type" value="phone">Phone</x-fruit::segment>
        </x-fruit::segmented>
    </header>
</div>
