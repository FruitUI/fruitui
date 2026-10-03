<div x-data="uploadDemo" class="f-stack">
    <label class="f-label" for="gallery-files">Attachments</label>
    <input class="f-input f-file" type="file" id="gallery-files" multiple @change="addFiles($event.target.files)">
    <p class="f-help">Local upload simulation. Files stay in your browser.</p>
    <ul class="f-upload" aria-label="Attachments"><template x-for="file in files" :key="file.id"><li class="f-upload__row" :data-state="file.state"><div class="f-upload__body"><strong x-text="file.name"></strong><span class="f-help" role="status" x-text="file.state === 'error' ? 'Upload failed. Retry or remove the file.' : file.state"></span><progress class="f-progress" max="100" :value="file.progress" :aria-label="'Upload ' + file.name" x-show="file.state === 'uploading'"></progress><a x-show="file.state === 'complete'" :href="file.url" :download="file.name">Download local file</a></div><div class="f-upload__actions"><button class="f-button" type="button" @click="fail(file)" x-show="file.state === 'uploading'">Simulate error</button><button class="f-button" type="button" @click="cancel(file)" x-show="file.state === 'uploading'" :aria-label="'Cancel ' + file.name">Cancel</button><button class="f-button" type="button" @click="retry(file)" x-show="file.state === 'error' || file.state === 'cancelled'">Retry</button><button class="f-button" type="button" @click="remove(file)" :aria-label="'Remove ' + file.name">Remove</button></div></li></template></ul>
</div>
{{-- Server-rendered rows, for example Livewire temporary uploads: --}}
<x-fruit::upload-list aria-label="Uploaded files">
    <x-fruit::upload-row name="brief.pdf" state="uploading" :progress="60">
        <x-slot:actions><x-fruit::button size="small" wire:click="cancelUpload('brief.pdf')" aria-label="Cancel brief.pdf">Cancel</x-fruit::button></x-slot:actions>
    </x-fruit::upload-row>
    <x-fruit::upload-row name="notes.txt" state="complete">
        <a href="/attachments/fruitui-design-notes.txt" download>Download</a>
        <x-slot:actions><x-fruit::button size="small" wire:click="remove('notes.txt')" aria-label="Remove notes.txt">Remove</x-fruit::button></x-slot:actions>
    </x-fruit::upload-row>
</x-fruit::upload-list>
