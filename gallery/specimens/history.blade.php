{{-- A chat column: a compact thread in a history that opens at the newest message and follows new ones;
     the composer stays docked below it. Scroll back to see Jump to Latest; sending returns to the newest message. --}}
<div class="f-pane f-pane--column" style="height: 400px; border: 1px solid var(--f-border); border-radius: var(--f-radius)" x-data="{ sent: [], draft: '' }">
    <x-fruit::history aria-label="Conversation with Sophie Chen" style="--f-pane-scroll-padding: 16px">
        <x-fruit::divider>Yesterday</x-fruit::divider>
        <x-fruit::thread density="compact">
            <li>
                <x-fruit::message aria-label="Customer Message">
                    <x-slot:author>Sophie Chen</x-slot:author>
                    <x-slot:time>4:12 PM</x-slot:time>
                    Hi! Our export has been running for an hour. Is that normal?
                </x-fruit::message>
            </li>
            <li>
                <x-fruit::message direction="outgoing" mine aria-label="Your Reply">
                    <x-slot:author>You</x-slot:author>
                    <x-slot:time>4:15 PM</x-slot:time>
                    Large workspaces can take a while. I’ll keep an eye on it for you.
                </x-fruit::message>
            </li>
            <li><x-fruit::message-event>You assigned this conversation to yourself.</x-fruit::message-event></li>
            <li>
                <x-fruit::message aria-label="Customer Message">
                    <x-slot:author>Sophie Chen</x-slot:author>
                    <x-slot:time>4:20 PM</x-slot:time>
                    Great, I’ll check again in the morning.
                </x-fruit::message>
            </li>
        </x-fruit::thread>
        <x-fruit::divider>Today</x-fruit::divider>
        <x-fruit::thread density="compact">
            <li>
                <x-fruit::message aria-label="Customer Message">
                    <x-slot:author>Sophie Chen</x-slot:author>
                    <x-slot:time>9:02 AM</x-slot:time>
                    It finished overnight, thank you!
                </x-fruit::message>
            </li>
            <template x-for="(text, index) in sent" :key="index">
                <li><article class="f-message f-message--outgoing f-message--mine" aria-label="Your Reply"><header class="f-message__header"><span class="f-message__identity"><strong class="f-message__author">You</strong></span><time class="f-message__time">Just now</time></header><div class="f-message__body" x-text="text"></div></article></li>
            </template>
        </x-fruit::thread>
    </x-fruit::history>
    <x-fruit::composer aria-label="Reply to Sophie Chen" x-on:submit.prevent="if (draft.trim()) { sent.push(draft.trim()); draft = '' }">
        <label class="f-sr-only" for="gallery-history-reply">Message Sophie Chen</label>
        {{-- One line that grows; Enter sends, so the Send button shows only on touch screens. --}}
        <div class="f-composer__field">
            <x-fruit::textarea id="gallery-history-reply" class="f-composer__input" rows="1" placeholder="Message Sophie Chen" x-model="draft" aria-describedby="gallery-history-help"
                x-on:keydown.enter="if (!$event.shiftKey && !$event.isComposing) { $event.preventDefault(); $el.form.requestSubmit() }" />
            <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Attach Files" title="Attach Files"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg></x-fruit::button>
            <x-fruit::button type="submit" variant="primary" class="f-button--icon f-composer__send" aria-label="Send"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg></x-fruit::button>
        </div>
        <p class="f-sr-only" id="gallery-history-help">Enter to send, Shift+Enter for a new line.</p>
    </x-fruit::composer>
</div>
