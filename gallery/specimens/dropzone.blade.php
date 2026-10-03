<div x-data="{ names: [] }" class="f-stack">
    <x-fruit::field label="Attachments">
        <x-fruit::dropzone name="attachments[]" multiple accept=".txt,image/*" wire:model="attachments" @change="names = [...$event.target.files].map(file => file.name)">
            <x-slot:hint>Text files and images</x-slot:hint>
        </x-fruit::dropzone>
    </x-fruit::field>
    <p class="f-help" role="status" x-text="names.length ? names.join(', ') : 'No files chosen'">No files chosen</p>
</div>
