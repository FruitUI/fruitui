<?php

/*
 * Mailbox settings as a Livewire 4 single-file component, in grouped sections: the mailbox's page
 * holds its everyday settings and a row for each further page with that page's current value, as
 * settings drill down; a further page has a Back Link to the mailbox. Form sections of Field rows,
 * and a save bar.
 * wire:dirty shows unsaved changes; Save validates on the server and confirms with a toast through
 * the page layout's single <x-fruit::toaster />. Delete Mailbox asks first through the layout's
 * <x-fruit::confirmer />.
 */

use FruitUI\Fruit;
use Livewire\Attributes\Url;
use Livewire\Component;

new class extends Component
{
    /** The mailbox's further pages, each opened from a row on its page. */
    public const SECTIONS = ['connection' => 'Connection', 'auto-reply' => 'Auto Reply'];

    /** The address that receives this mailbox's forwarded email. */
    public const FORWARDING = 'support-7f3a@inbound.forma.example';

    #[Url]
    public string $section = '';

    public array $settings = [];

    public function mount(): void
    {
        $this->section = array_key_exists($this->section, self::SECTIONS) ? $this->section : '';
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

    /** The current value a row shows for one of the mailbox's further pages. */
    public function summary(string $section): string
    {
        if ($section === 'connection') {
            return $this->settings['sending'] === 'smtp' ? 'SMTP · '.$this->settings['host'] : 'The server’s mail';
        }

        return $this->settings['autoReply'] ? 'On' : 'Off';
    }

    public function deleteMailbox(): void
    {
        Fruit::toast('This sample mailbox stays.');
    }
};
?>

{{-- A narrow page column on the grouped background: the title, sections and save bar line up. --}}
<form class="fruit-settings" wire:submit="save" style="min-height: 100dvh; background: var(--f-grouped-background)">
<x-fruit::page width="narrow" :title="$section ? $this::SECTIONS[$section] : 'Support Mailbox'" style="--f-page-background: var(--f-grouped-background)">

    @if ($section)
        <x-slot:back>
            <x-fruit::back-link :href="request()->url()" wire:click.prevent="$set('section', '')">Support Mailbox</x-fruit::back-link>
        </x-slot:back>
    @endif

    @if ($section === '')
        <x-fruit::form-section title="Mailbox">
            <x-fruit::field label="Name" layout="row">
                <x-fruit::input wire:model="settings.name" required maxlength="40" />
            </x-fruit::field>
            <x-fruit::field label="Email Address" layout="row">
                <x-fruit::input type="email" wire:model="settings.email" required />
            </x-fruit::field>
            <x-fruit::field label="Signature" layout="row" description="Added below every reply from this mailbox.">
                <x-fruit::textarea wire:model="settings.signature" rows="4" />
            </x-fruit::field>
        </x-fruit::form-section>

        {{-- A row per further page, with its current value; each is a link, so it opens in a new tab too. --}}
        <x-fruit::form-section>
            @foreach ($this::SECTIONS as $key => $label)
                <a class="f-form-row f-form-row--link" href="?section={{ $key }}" wire:click.prevent="$set('section', '{{ $key }}')"><span>{{ $label }}</span><span class="f-form-row__value">{{ $this->summary($key) }}</span></a>
            @endforeach
        </x-fruit::form-section>

        <x-fruit::form-section title="Danger Zone">
            <div class="f-form-row">
                <div>
                    <strong class="f-headline">Delete Mailbox</strong>
                    <p class="f-help">Removes the mailbox and its conversations for everyone.</p>
                </div>
                <x-fruit::button variant="danger" x-on:click="$confirm({ title: 'Delete this mailbox?', message: 'Its conversations are removed for everyone.', confirm: 'Delete Mailbox', tone: 'danger' }).then(confirmed => confirmed && $wire.deleteMailbox())">Delete Mailbox…</x-fruit::button>
            </div>
        </x-fruit::form-section>
    @elseif ($section === 'connection')
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
        <x-fruit::form-section title="Automatic Reply">
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
