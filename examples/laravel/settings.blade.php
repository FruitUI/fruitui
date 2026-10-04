<?php

/*
 * Mailbox settings as a Livewire 4 single-file component, in grouped sections: Section Nav links for the mailbox's pages, form sections of Field rows, and a save bar.
 * wire:dirty shows unsaved changes; Save validates on the server and confirms with a toast through
 * the page layout's single <x-fruit::toaster />. Delete Mailbox asks first through the layout's
 * <x-fruit::confirmer />.
 */

use FruitUI\Fruit;
use Livewire\Attributes\Url;
use Livewire\Component;

new class extends Component
{
    public const TABS = ['general' => 'General', 'connection' => 'Connection', 'auto-reply' => 'Auto reply'];

    /** The address that receives this mailbox's forwarded email. */
    public const FORWARDING = 'support-7f3a@inbound.forma.example';

    #[Url]
    public string $tab = 'general';

    public array $settings = [];

    public function mount(): void
    {
        $this->tab = array_key_exists($this->tab, self::TABS) ? $this->tab : 'general';
        $this->settings = session('fruit-settings', [
            'name' => 'Support',
            'email' => 'support@forma.example',
            'signature' => "Thanks,\nThe Forma team",
            'sending' => 'smtp',
            'host' => 'smtp.forma.example',
            'port' => 587,
            'autoReply' => false,
            'autoSubject' => 'We received your message',
            'autoBody' => 'Thanks for writing. We usually reply within a day.',
        ]);
    }

    public function save(): void
    {
        $this->validate([
            'settings.name' => ['required', 'string', 'max:40'],
            'settings.email' => ['required', 'email'],
            'settings.sending' => ['required', 'in:php,smtp'],
            'settings.host' => ['required_if:settings.sending,smtp', 'nullable', 'string'],
            'settings.port' => ['required_if:settings.sending,smtp', 'nullable', 'integer', 'between:1,65535'],
            'settings.autoSubject' => ['required_if_accepted:settings.autoReply', 'nullable', 'string', 'max:120'],
        ], [], ['settings.name' => 'name', 'settings.email' => 'email address', 'settings.host' => 'server', 'settings.port' => 'port', 'settings.autoSubject' => 'subject']);
        session(['fruit-settings' => $this->settings]);
        Fruit::toast(__('Settings saved.'));
    }

    public function revert(): void
    {
        $this->resetValidation();
        $this->mount();
    }

    public function deleteMailbox(): void
    {
        Fruit::toast('This sample mailbox stays.');
    }
};
?>

{{-- A narrow page column on the grouped background: the title, sections and save bar line up. --}}
<form class="fruit-settings" wire:submit="save" style="min-height: 100dvh; background: var(--f-grouped-background)">
<x-fruit::page width="narrow" title="Support mailbox" style="--f-page-background: var(--f-grouped-background)">

    <x-fruit::section-nav aria-label="Mailbox settings">
        @foreach ($this::TABS as $key => $label)
            <a href="?tab={{ $key }}" wire:click.prevent="$set('tab', '{{ $key }}')" @if ($tab === $key) aria-current="page" @endif>{{ $label }}</a>
        @endforeach
    </x-fruit::section-nav>

    @if ($tab === 'general')
        <x-fruit::form-section title="Mailbox">
            <x-fruit::field label="Name" layout="row">
                <x-fruit::input wire:model="settings.name" required maxlength="40" />
            </x-fruit::field>
            <x-fruit::field label="Email address" layout="row">
                <x-fruit::input type="email" wire:model="settings.email" required />
            </x-fruit::field>
            <x-fruit::field label="Signature" layout="row" description="Added below every reply from this mailbox.">
                <x-fruit::textarea wire:model="settings.signature" rows="4" />
            </x-fruit::field>
        </x-fruit::form-section>

        <x-fruit::form-section title="Danger zone">
            <div class="f-form-row">
                <div>
                    <strong class="f-headline">Delete mailbox</strong>
                    <p class="f-help">Removes the mailbox and its conversations for everyone.</p>
                </div>
                <x-fruit::button variant="danger" x-on:click="$confirm({ title: 'Delete this mailbox?', message: 'Its conversations are removed for everyone.', confirm: 'Delete Mailbox', tone: 'danger' }).then(confirmed => confirmed && $wire.deleteMailbox())">Delete Mailbox…</x-fruit::button>
            </div>
        </x-fruit::form-section>
    @elseif ($tab === 'connection')
        <x-fruit::form-section title="Receiving">
            <x-fruit::field label="Forwarding address" layout="row" description="Forward this mailbox’s email here.">
                <div class="f-input-group">
                    <x-fruit::input id="settings-forwarding" value="{{ self::FORWARDING }}" readonly />
                    <x-fruit::copy-button value="{{ self::FORWARDING }}" aria-label="Copy forwarding address" />
                </div>
            </x-fruit::field>
        </x-fruit::form-section>
        <x-fruit::form-section title="Sending" footer="Use port 587 with STARTTLS, or 465 with TLS.">
            <x-fruit::fieldset>
                <legend>Send email with</legend>
                <x-fruit::radio name="sending" value="php" wire:model.live="settings.sending" description="Simple, but more likely to reach spam.">The server’s mail</x-fruit::radio>
                <x-fruit::radio name="sending" value="smtp" wire:model.live="settings.sending">SMTP</x-fruit::radio>
            </x-fruit::fieldset>
            @if ($settings['sending'] === 'smtp')
                <x-fruit::field label="Server" layout="row">
                    <x-fruit::input wire:model="settings.host" required />
                </x-fruit::field>
                <x-fruit::field label="Port" layout="row">
                    <x-fruit::number wire:model="settings.port" min="1" max="65535" required />
                </x-fruit::field>
            @endif
        </x-fruit::form-section>
    @else
        <x-fruit::form-section title="Automatic reply">
            <x-fruit::field label="Send an automatic reply" layout="row" description="To the first message of every new conversation.">
                <x-fruit::switch wire:model.live="settings.autoReply" />
            </x-fruit::field>
            <x-fruit::field label="Subject" layout="row">
                <x-fruit::input wire:model="settings.autoSubject" :disabled="! $settings['autoReply']" />
            </x-fruit::field>
            <x-fruit::field label="Message" layout="row">
                <x-fruit::textarea wire:model="settings.autoBody" rows="4" :disabled="! $settings['autoReply']" />
            </x-fruit::field>
        </x-fruit::form-section>
    @endif

    {{-- The save bar stays in view: status first, the primary action last. wire:dirty tracks unsynced edits. --}}
    <x-slot:footer>
        <p class="f-help" role="status">
            <span wire:dirty>You have unsaved changes.</span>
            <span wire:dirty.remove>Changes are saved when you press Save.</span>
        </p>
        <x-fruit::button type="button" wire:click="revert">Revert</x-fruit::button>
        <x-fruit::button type="submit" variant="primary">Save</x-fruit::button>
    </x-slot:footer>
</x-fruit::page>
</form>
