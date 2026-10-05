<form class="f-stack" id="token-example" x-data="{ recipients: 'sophie@example.com' }" @submit.prevent>
    <label class="f-label" for="gallery-recipients">Recipients</label>
    <x-fruit::token-field id="gallery-recipients" name="recipients" x-model="recipients" required placeholder="Add a recipient"
        @fruit-token-add="if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($event.detail.value)) { $event.detail.error = 'Enter an email address.'; $event.preventDefault(); }">sophie@example.com</x-fruit::token-field>
    <p class="f-help">Enter or comma to add. Backspace in the empty field focuses the last remove button.</p>
    <div class="f-row">
        <x-fruit::button @click="recipients = 'mia@example.com'">Set Recipients Externally</x-fruit::button>
        <x-fruit::button type="reset">Reset Recipients</x-fruit::button>
    </div>
</form>
{{-- submit="list" posts one invites[] value per token. Suggestions come from the options; with
     search="server", answer fruit-suggest events ($event.detail.query) with new options instead. --}}
<form class="f-stack" id="token-list-example" @submit.prevent>
    <label class="f-label" for="gallery-invites">Invite Teammates</label>
    <x-fruit::token-field id="gallery-invites" name="invites" submit="list" placeholder="Name or email">
        mia@studio.example
        <x-slot:options>
            <option value="alex@studio.example">Alex Morgan</option>
            <option value="mia@studio.example">Mia Patel</option>
            <option value="noah@studio.example">Noah Williams</option>
        </x-slot:options>
    </x-fruit::token-field>
</form>
