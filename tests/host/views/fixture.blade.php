<main class="f-stack" style="max-width:700px;padding:24px">
    <h1>Laravel adoption fixture</h1>
    <x-fruit::field control-id="owner" label="Owner" description="Choose an agent">
        <x-fruit::combobox name="owner" wire:model="owner">
            <option value="alex">Alex</option><option value="mia">Mia</option>
            @if($changed)<option value="morgan">Morgan</option>@endif
        </x-fruit::combobox>
    </x-fruit::field>
    <x-fruit::field control-id="recipients" label="Recipients">
        <x-fruit::token-field name="recipients" wire:model="recipients" :readonly="$readonly">{{ $recipients }}</x-fruit::token-field>
    </x-fruit::field>
    <x-fruit::field control-id="signature" label="Signature">
        <x-fruit::editor name="signature" wire:model.live.change="signature">{{ $signature }}</x-fruit::editor>
    </x-fruit::field>
    <p id="commits">{{ $commits }} commits</p><output id="saved-signature">{{ $signature }}</output>
    <x-fruit::field control-id="blur-signature" label="Blur signature">
        <x-fruit::editor name="blurSignature" wire:model.live.blur="blurSignature">{{ $blurSignature }}</x-fruit::editor>
    </x-fruit::field>
    <p id="blur-commits">{{ $blurCommits }} blur commits</p><output id="saved-blur-signature">{{ $blurSignature }}</output>
    <x-fruit::button wire:click="mutate">Update From Server</x-fruit::button>
</main>
