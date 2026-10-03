<div class="f-stack">
    {{-- The error is the shared validation message for "email", as after a failed request or Livewire validation. --}}
    {{-- No control-id needed: the id comes from the input's name. --}}
    <x-fruit::field label="Contact email">
        <x-fruit::input type="email" name="email" value="alex@" />
    </x-fruit::field>
    <x-fruit::field control-id="workspace-id" label="Workspace ID" description="This identifier is read only.">
        <x-fruit::input name="workspace" value="forma" readonly />
    </x-fruit::field>
    <x-fruit::field control-id="invitation-code" label="Invitation code">
        <x-fruit::input name="invitation" value="Not available" disabled />
    </x-fruit::field>
</div>
