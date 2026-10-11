<?php

/*
 * Mailbox settings as a Livewire 4 single-file component, in a Drill-Down: the mailbox's level holds
 * its everyday settings and a row for each further page with that page's current value; a row opens
 * its page as the next level, named in the URL. A narrow window shows the deepest level, with a Back
 * Link to the mailbox.
 * Every change is saved as it's made: wire:model.live.blur for text (on leaving the field), .live
 * for choices. updated() checks the one changed field on the server and keeps it only if it passes;
 * otherwise its Field shows why.
 * Delete Mailbox asks first through the layout's <x-fruit::confirmer />.
 */

use FruitUI\Fruit;
use Livewire\Attributes\Url;
use Livewire\Component;

new class extends Component
{
    /** The mailbox's further pages, each opened from a row on its level. */
    public const SECTIONS = ['connection' => 'Connection', 'auto-reply' => 'Auto Reply'];

    /** The address that receives this mailbox's forwarded email. */
    public const FORWARDING = 'support-7f3a@inbound.forma.example';

    public const DEFAULTS = [
        'name' => 'Support',
        'email' => 'support@forma.example',
        'signature' => "Thanks,\nThe Forma team",
        'sending' => 'smtp',
        'host' => 'smtp.forma.example',
        'port' => 587,
        'autoReply' => false,
        'autoSubject' => 'We received your message',
        'autoBody' => 'Thanks for writing. We usually reply within a day.',
    ];

    /** The open page, in the URL; the mailbox's own level has none. */
    #[Url(except: '')]
    public string $section = '';

    public array $settings = [];

    public function mount(): void
    {
        $this->section = array_key_exists($this->section, self::SECTIONS) ? $this->section : '';
        $this->settings = session('fruit-settings', self::DEFAULTS);
    }

    protected function rules(): array
    {
        return [
            'settings.name' => ['required', 'string', 'max:40'],
            'settings.email' => ['required', 'email'],
            'settings.signature' => ['nullable', 'string'],
            'settings.sending' => ['required', 'in:php,smtp'],
            'settings.host' => ['required_if:settings.sending,smtp', 'nullable', 'string'],
            'settings.port' => ['required_if:settings.sending,smtp', 'nullable', 'integer', 'between:1,65535'],
            'settings.autoReply' => ['boolean'],
            'settings.autoSubject' => ['required_if_accepted:settings.autoReply', 'nullable', 'string', 'max:120'],
            'settings.autoBody' => ['nullable', 'string'],
        ];
    }

    protected function validationAttributes(): array
    {
        return ['settings.name' => 'name', 'settings.email' => 'email address', 'settings.host' => 'server', 'settings.port' => 'port', 'settings.autoSubject' => 'subject'];
    }

    /** A change is saved on its own once it passes; one that doesn't leaves the saved value as it was. */
    public function updated(string $property): void
    {
        if (! str_starts_with($property, 'settings.')) {
            return;
        }
        $this->validateOnly($property);
        $key = substr($property, strlen('settings.'));
        session(['fruit-settings' => [...session('fruit-settings', self::DEFAULTS), $key => $this->settings[$key]]]);
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

{{-- The whole window: the mailbox's level, then the page its current row opened. fruitDrilldown keeps
     focus in view as the levels change. --}}
<x-fruit::workspace frame="fill" class="fruit-settings" aria-label="Mailbox settings" style="--f-workspace-background: var(--f-grouped-background)">
    <h1 class="f-sr-only">Mailbox Settings</h1>
    <x-fruit::drilldown x-data="fruitDrilldown">
        <x-fruit::drilldown-column :title="$settings['name'] ?: 'Mailbox'" id="settings-mailbox">
            <x-fruit::page width="narrow" style="--f-page-background: var(--f-grouped-background)">
                <x-fruit::form-section title="Mailbox" :level="3">
                    <x-fruit::field label="Name" layout="row">
                        <x-fruit::input wire:model.live.blur="settings.name" required maxlength="40" />
                    </x-fruit::field>
                    <x-fruit::field label="Email Address" layout="row">
                        <x-fruit::input type="email" wire:model.live.blur="settings.email" required />
                    </x-fruit::field>
                    <x-fruit::field label="Signature" layout="row" description="Added below every reply from this mailbox.">
                        <x-fruit::textarea wire:model.live.blur="settings.signature" rows="4" />
                    </x-fruit::field>
                </x-fruit::form-section>

                {{-- A row per further page, with its current value; each is a link, so it opens in a new tab too.
                     The open page's row is current. --}}
                <x-fruit::form-section>
                    @foreach ($this::SECTIONS as $key => $label)
                        <a class="f-form-row f-form-row--link" href="?section={{ $key }}" wire:click.prevent="$set('section', '{{ $key }}')" @if ($section === $key) aria-current="page" @endif><span>{{ $label }}</span><span class="f-form-row__value">{{ $this->summary($key) }}</span></a>
                    @endforeach
                </x-fruit::form-section>

                <x-fruit::form-section title="Danger Zone" :level="3">
                    <div class="f-form-row">
                        <div>
                            <strong class="f-headline">Delete Mailbox</strong>
                            <p class="f-help">Removes the mailbox and its conversations for everyone.</p>
                        </div>
                        <x-fruit::button variant="danger" x-on:click="$confirm({ title: 'Delete this mailbox?', message: 'Its conversations are removed for everyone.', confirm: 'Delete Mailbox', tone: 'danger' }).then(confirmed => confirmed && $wire.deleteMailbox())">Delete Mailbox…</x-fruit::button>
                    </div>
                </x-fruit::form-section>
            </x-fruit::page>
        </x-fruit::drilldown-column>

        @if ($section)
            <x-fruit::drilldown-column :title="$this::SECTIONS[$section]" :id="'settings-'.$section" wire:key="settings-{{ $section }}">
                <x-slot:back>
                    <x-fruit::back-link href="?" wire:click.prevent="$set('section', '')">{{ $settings['name'] ?: 'Mailbox' }}</x-fruit::back-link>
                </x-slot:back>
                <x-fruit::page width="narrow" style="--f-page-background: var(--f-grouped-background)">
                    @if ($section === 'connection')
                        <x-fruit::form-section title="Receiving" :level="3">
                            <x-fruit::field label="Forwarding address" layout="row" description="Forward this mailbox’s email here.">
                                <div class="f-input-group">
                                    <x-fruit::input id="settings-forwarding" value="{{ self::FORWARDING }}" readonly />
                                    <x-fruit::copy-button value="{{ self::FORWARDING }}" aria-label="Copy forwarding address" />
                                </div>
                            </x-fruit::field>
                        </x-fruit::form-section>
                        <x-fruit::form-section title="Sending" :level="3" footer="Use port 587 with STARTTLS, or 465 with TLS.">
                            <x-fruit::fieldset>
                                <legend>Send email with</legend>
                                <x-fruit::radio name="sending" value="php" wire:model.live="settings.sending" description="Simple, but more likely to reach spam.">The server’s mail</x-fruit::radio>
                                <x-fruit::radio name="sending" value="smtp" wire:model.live="settings.sending">SMTP</x-fruit::radio>
                            </x-fruit::fieldset>
                            @if ($settings['sending'] === 'smtp')
                                <x-fruit::field label="Server" layout="row">
                                    <x-fruit::input wire:model.live.blur="settings.host" required />
                                </x-fruit::field>
                                <x-fruit::field label="Port" layout="row">
                                    <x-fruit::number wire:model.live.blur="settings.port" min="1" max="65535" required />
                                </x-fruit::field>
                            @endif
                        </x-fruit::form-section>
                    @else
                        <x-fruit::form-section title="Automatic Reply" :level="3">
                            <x-fruit::field label="Send an automatic reply" layout="row" description="To the first message of every new conversation.">
                                <x-fruit::switch wire:model.live="settings.autoReply" />
                            </x-fruit::field>
                            <x-fruit::field label="Subject" layout="row">
                                <x-fruit::input wire:model.live.blur="settings.autoSubject" :disabled="! $settings['autoReply']" />
                            </x-fruit::field>
                            <x-fruit::field label="Message" layout="row">
                                <x-fruit::textarea wire:model.live.blur="settings.autoBody" rows="4" :disabled="! $settings['autoReply']" />
                            </x-fruit::field>
                        </x-fruit::form-section>
                    @endif
                </x-fruit::page>
            </x-fruit::drilldown-column>
        @endif
    </x-fruit::drilldown>
</x-fruit::workspace>
