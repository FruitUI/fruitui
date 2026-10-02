<form class="f-card f-stack" wire:submit="save" aria-label="Mail preferences">
    <h2>Mail preferences</h2>
    <x-fruit::switch wire:model="previews">Show message previews</x-fruit::switch>
    <x-fruit::switch wire:model="sounds">Play a sound for new messages</x-fruit::switch>
    <p class="f-help">These example preferences are saved in your current session.</p>
    <div class="f-row">
        <x-fruit::button type="submit" variant="primary" wire:loading.attr="disabled" wire:target="save">Save changes</x-fruit::button>
        <span role="status">@if($saved) Changes saved. @endif</span>
    </div>
</form>
