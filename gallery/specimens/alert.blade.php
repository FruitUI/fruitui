<div class="f-stack">
    <x-fruit::alert><strong>A little context</strong><br>Messages are saved for this visit.</x-fruit::alert>
    <x-fruit::alert tone="success"><strong>All set</strong><br>Your changes have been saved.</x-fruit::alert>
    <x-fruit::alert tone="warning"><strong>Reconnect your mailbox</strong><br>Mail delivery is paused until you reconnect.</x-fruit::alert>
    {{-- Actions sit beside the text; when they don't fit, they wrap to a row under it. --}}
    <x-fruit::alert tone="warning">
        Images from other servers are not shown.
        <x-slot:actions>
            <x-fruit::button variant="ghost" size="small">Show Images</x-fruit::button>
            <x-fruit::button variant="ghost" size="small">Always Show Images From sophie@example.com</x-fruit::button>
        </x-slot:actions>
    </x-fruit::alert>
    <x-fruit::alert tone="danger"><strong>Could not save</strong><br>Check your connection and try again.</x-fruit::alert>
</div>
