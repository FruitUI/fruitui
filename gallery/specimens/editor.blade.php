<form class="f-stack" id="editor-example" x-data="{ signature: '&lt;p&gt;Thanks,&lt;br&gt;&lt;strong&gt;Alex Morgan&lt;/strong&gt;&lt;/p&gt;' }" @submit.prevent>
    <label class="f-label" for="gallery-editor">Reply Signature</label>
    <x-fruit::editor id="gallery-editor" name="signature" x-model="signature" required>
        {{ '<p>Thanks,<br><strong>Alex Morgan</strong></p>' }}
        <x-slot:extras>
            <x-fruit::menu title="Insert Variable">
                <x-slot:trigger class="f-button--ghost">Insert Variable<span class="f-menu__chevron" aria-hidden="true"></span></x-slot:trigger>
                <x-fruit::menu-item x-on:click="$dispatch('fruit-editor-insert', { html: '{%customer.firstName%}' })">Customer First Name</x-fruit::menu-item>
                <x-fruit::menu-item x-on:click="$dispatch('fruit-editor-insert', { html: '{%mailbox.email%}' })">Mailbox Email</x-fruit::menu-item>
            </x-fruit::menu>
        </x-slot:extras>
    </x-fruit::editor>
    <div class="f-row">
        <x-fruit::button @click="signature = '&lt;p&gt;Mia Patel&lt;/p&gt;'">Set Signature Externally</x-fruit::button>
        <x-fruit::button type="reset">Reset Signature</x-fruit::button>
    </div>
</form>
