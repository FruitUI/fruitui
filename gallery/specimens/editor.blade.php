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
{{-- A channel's formats: Telegram supports bold, italic and links, so the toolbar offers only those, and
     shortcuts and pasted content cannot add other markup. Undo and Redo always stay. --}}
<form class="f-stack" id="editor-formats-example" @submit.prevent>
    <label class="f-label" for="gallery-chat-editor">Telegram Message</label>
    <x-fruit::editor id="gallery-chat-editor" name="message" :formats="['bold', 'italic', 'link']" aria-describedby="gallery-chat-editor-help"></x-fruit::editor>
    <p class="f-help" id="gallery-chat-editor-help">Bold, italic and links, as this channel supports.</p>
</form>
{{-- Inline: a chat's message field. One line that grows; Aa shows the channel's formatting bar above it;
     Enter sends and Shift+Enter breaks the line; Send shows only on touch screens. --}}
<form class="f-composer" id="editor-inline-example" x-data="{ message: '', sent: '' }" @submit.prevent="if (message.trim()) { sent = message; message = '' }">
    <label class="f-sr-only" for="gallery-inline-editor">Message Lena Wilson</label>
    <x-fruit::editor id="gallery-inline-editor" name="message" layout="inline" enter="submit" :formats="['bold', 'italic', 'link']" x-model="message" placeholder="Message Lena Wilson" aria-describedby="gallery-inline-editor-help">
        <x-slot:extras>
            <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Attach Files" title="Attach Files"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg></x-fruit::button>
            <x-fruit::button type="submit" variant="primary" class="f-button--icon f-composer__send" aria-label="Send"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg></x-fruit::button>
        </x-slot:extras>
    </x-fruit::editor>
    <p class="f-sr-only" id="gallery-inline-editor-help">Enter to send, Shift+Enter for a new line.</p>
    <p class="f-help" x-show="sent" x-cloak>Sent: <code x-text="sent"></code></p>
</form>
