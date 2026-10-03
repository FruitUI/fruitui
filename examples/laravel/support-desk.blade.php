<?php

/*
 * The Support reference interface as a Livewire 4 single-file component.
 *
 * It composes FruitUI's Blade adapters with server state: mailbox links use
 * wire:navigate, ticket rows and pagination call actions, enhanced controls
 * bind with wire:model, validation errors reach Field, and the server opens
 * dialogs and sends toasts through FruitUI\Fruit. Sample tickets live in the
 * session so each visitor can change them.
 */

use FruitUI\Fruit;
use Illuminate\Pagination\LengthAwarePaginator;
use Livewire\Attributes\Computed;
use Livewire\Component;
use Livewire\WithPagination;

new class extends Component
{
    use WithPagination;

    public const MAILBOXES = ['all' => 'All open', 'unassigned' => 'Unassigned', 'mine' => 'Assigned to me', 'closed' => 'Closed'];
    public const AGENTS = ['alex' => 'Alex Morgan', 'mia' => 'Mia Patel', 'noah' => 'Noah Williams'];
    public const REASONS = ['resolved' => 'Resolved', 'duplicate' => 'Duplicate', 'spam' => 'Spam'];
    private const PER_PAGE = 4;

    public string $mailbox = 'all';
    public string $search = '';
    public ?int $openId = null;
    public string $assignee = '';
    public string $cc = '';
    public string $reply = '';
    public string $closeReason = 'resolved';

    public bool $closing = false;

    public array $selected = [];

    public function mount(string $mailbox = 'all'): void
    {
        abort_unless(array_key_exists($mailbox, self::MAILBOXES), 404);
        $this->mailbox = $mailbox;
        $first = $this->filtered()->first();
        if ($first) {
            $this->open($first['id']);
        }
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function open(int $id): void
    {
        $ticket = $this->store()[$id] ?? null;
        if (! $ticket) {
            return;
        }
        $this->openId = $id;
        $this->assignee = $ticket['assignee'];
        $this->cc = $ticket['cc'];
        $this->reply = '';
        $this->resetValidation();
    }

    public function updatedAssignee(string $assignee): void
    {
        $this->assignee = array_key_exists($assignee, self::AGENTS) ? $assignee : '';
        $this->change(fn (array $ticket) => [...$ticket, 'assignee' => $this->assignee]);
        Fruit::toast($this->assignee === '' ? 'Conversation unassigned.' : 'Assigned to '.self::AGENTS[$this->assignee].'.');
    }

    public function send(): void
    {
        $this->validate([
            'reply' => ['required', 'string', 'min:3'],
            'cc' => [function (string $attribute, string $value, \Closure $fail) {
                foreach (preg_split('/\R/', $value, -1, PREG_SPLIT_NO_EMPTY) as $address) {
                    if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
                        $fail("“{$address}” is not an email address.");
                    }
                }
            }],
        ], ['reply.required' => 'Write a reply before sending.', 'reply.min' => 'Write at least three characters.']);
        $this->change(fn (array $ticket) => [...$ticket, 'cc' => $this->cc, 'messages' => [...$ticket['messages'], ['author' => 'Alex Morgan', 'body' => $this->reply]]]);
        $this->reply = '';
        Fruit::toast('Reply sent to '.$this->ticket['name'].'.');
    }

    public function confirmClose(): void
    {
        $this->closeReason = 'resolved';
        $this->closing = true;
    }

    public function closeTicket(): void
    {
        $id = $this->openId;
        $this->change(fn (array $ticket) => [...$ticket, 'status' => 'closed', 'reason' => $this->closeReason]);
        $this->closing = false;
        Fruit::flashToast("Conversation #{$id} closed as ".strtolower(self::REASONS[$this->closeReason]).'.');
        $this->redirect(url('/support/closed'), navigate: true);
    }

    public function closeSelected(): void
    {
        $tickets = $this->store();
        $closed = 0;
        foreach ($this->selected as $id) {
            if (($tickets[(int) $id]['status'] ?? null) === 'open') {
                $tickets[(int) $id] = [...$tickets[(int) $id], 'status' => 'closed', 'reason' => 'resolved'];
                $closed++;
            }
        }
        session(['fruit-support.tickets' => $tickets]);
        unset($this->ticket, $this->tickets, $this->counts);
        $this->selected = [];
        Fruit::toast(trans_choice('{1} :count conversation closed.|[2,*] :count conversations closed.', $closed, ['count' => $closed]));
    }

    #[Computed]
    public function ticket(): ?array
    {
        return $this->store()[$this->openId] ?? null;
    }

    #[Computed]
    public function tickets(): LengthAwarePaginator
    {
        $tickets = $this->filtered();

        return new LengthAwarePaginator($tickets->forPage($this->getPage(), self::PER_PAGE)->values(), $tickets->count(), self::PER_PAGE, $this->getPage());
    }

    #[Computed]
    public function counts(): array
    {
        return collect(self::MAILBOXES)->map(fn ($label, $mailbox) => $this->filtered($mailbox, '')->count())->all();
    }

    private function filtered(?string $mailbox = null, ?string $search = null)
    {
        $mailbox ??= $this->mailbox;
        $search = mb_strtolower(trim($search ?? $this->search));

        return collect($this->store())
            ->filter(fn ($ticket) => match ($mailbox) {
                'closed' => $ticket['status'] === 'closed',
                'unassigned' => $ticket['status'] === 'open' && $ticket['assignee'] === '',
                'mine' => $ticket['status'] === 'open' && $ticket['assignee'] === 'alex',
                default => $ticket['status'] === 'open',
            })
            ->filter(fn ($ticket) => $search === '' || str_contains(mb_strtolower($ticket['name'].' '.$ticket['subject']), $search))
            ->values();
    }

    private function change(\Closure $update): void
    {
        $tickets = $this->store();
        if (! isset($tickets[$this->openId])) {
            return;
        }
        $tickets[$this->openId] = $update($tickets[$this->openId]);
        session(['fruit-support.tickets' => $tickets]);
        unset($this->ticket, $this->tickets, $this->counts);
    }

    private function store(): array
    {
        return session('fruit-support.tickets') ?? collect([
            [1042, 'Sophie Chen', 'SC', 'Studio North', 'A little help with our team plan', 'alex', 'We’re growing the studio. What’s the best way to bring everyone along?'],
            [1041, 'Jordan Lee', 'JL', 'Fieldwork', 'Sign-in after changing our domain', '', 'Our new domain is live, but single sign-on still points at the old one.'],
            [1040, 'Emma Thompson', 'ET', 'Gather Studio', 'A new home for our workspace', 'mia', 'We’d like to move our workspace to the EU region.'],
            [1039, 'Daniel Brooks', 'DB', 'Good Measure', 'Invoices for last quarter', '', 'Could you resend the invoices for July through September?'],
            [1038, 'Maya Rodriguez', 'MR', 'Common Ground', 'Our project export is missing files', 'alex', 'The export finished, but the attachments folder is empty.'],
            [1037, 'Oliver Park', 'OP', 'Made by Oliver', 'Changing the account owner', '', 'I’m handing the studio to a colleague. How do I transfer ownership?'],
            [1036, 'Lena Wilson', 'LW', 'Small Hours', 'Calendar sync stopped', 'noah', 'Since Monday new events no longer appear in our shared calendar.'],
        ])->mapWithKeys(fn ($row) => [$row[0] => [
            'id' => $row[0], 'name' => $row[1], 'initials' => $row[2], 'company' => $row[3], 'subject' => $row[4],
            'assignee' => $row[5], 'cc' => '', 'status' => 'open', 'reason' => null,
            'email' => strtolower(strtok($row[1], ' ')).'@example.com',
            'messages' => [['author' => $row[1], 'body' => $row[6]]],
        ]])->all();
    }
};
?>

<main class="support-desk">
    <x-fruit::workspace aria-label="Support desk" style="--f-workspace-columns: 210px 320px minmax(0, 1fr); --f-workspace-height: 760px">
        <x-fruit::sidebar class="f-pane f-pane--column f-pane--scroll f-pane--border-end" aria-label="Mailboxes">
            <p class="f-sidebar__heading">Mailboxes</p>
            @foreach (array_slice($this::MAILBOXES, 0, 3, true) as $key => $label)
                <x-fruit::sidebar-item :href="url('/support/'.$key)" :current="$mailbox === $key" wire:navigate>
                    {{ $label }}
                    <x-slot:badge>{{ $this->counts[$key] }}</x-slot:badge>
                </x-fruit::sidebar-item>
            @endforeach
            <x-fruit::sidebar-group title="Archive" open>
                <x-fruit::sidebar-item :href="url('/support/closed')" :current="$mailbox === 'closed'" wire:navigate>
                    Closed
                    <x-slot:badge>{{ $this->counts['closed'] }}</x-slot:badge>
                </x-fruit::sidebar-item>
            </x-fruit::sidebar-group>
        </x-fruit::sidebar>

        <x-fruit::pane class="f-pane--column f-pane--border-end" role="region" aria-label="Conversations">
            <div style="padding: var(--f-space-3)">
                <x-fruit::field control-id="support-search" label="Search conversations">
                    <x-fruit::input type="search" wire:model.live.debounce.200ms="search" />
                </x-fruit::field>
            </div>
            <div class="f-pane__scroll">
                @if ($this->tickets->isEmpty())
                    <x-fruit::empty-state>
                        <x-slot:title><h2>No conversations</h2></x-slot:title>
                        {{ $search === '' ? 'This mailbox is empty.' : 'Try another search.' }}
                    </x-fruit::empty-state>
                @else
                    <x-fruit::item-list aria-label="{{ $this::MAILBOXES[$mailbox] }}">
                        @foreach ($this->tickets as $item)
                            <li wire:key="ticket-{{ $item['id'] }}">
                                <x-fruit::checkbox wire:model.live="selected" value="{{ $item['id'] }}"><span class="f-sr-only">Select {{ $item['name'] }}</span></x-fruit::checkbox>
                                <x-fruit::item-row wire:click="open({{ $item['id'] }})" :aria-current="$openId === $item['id'] ? 'true' : null">
                                    {{ $item['name'] }}
                                    <x-slot:leading class="f-avatar" aria-hidden="true">{{ $item['initials'] }}</x-slot:leading>
                                    <x-slot:trailing>#{{ $item['id'] }}</x-slot:trailing>
                                    <x-slot:subtitle>{{ $item['subject'] }}</x-slot:subtitle>
                                    <x-slot:meta>{{ $item['assignee'] === '' ? 'Unassigned' : $this::AGENTS[$item['assignee']] }}</x-slot:meta>
                                </x-fruit::item-row>
                            </li>
                        @endforeach
                    </x-fruit::item-list>
                    <x-fruit::selection-bar :count="count($selected)" aria-label="Selected conversations">
                        <x-fruit::button variant="ghost" size="small" wire:click="$set('selected', [])">Clear selection</x-fruit::button>
                        <x-fruit::button size="small" wire:click="closeSelected">Close selected</x-fruit::button>
                    </x-fruit::selection-bar>
                    <div style="padding: 0 var(--f-space-3)">{{ $this->tickets->links() }}</div>
                @endif
            </div>
        </x-fruit::pane>

        <x-fruit::pane class="f-pane--column" role="region" aria-label="Conversation">
            @if ($ticket = $this->ticket)
                <header class="f-toolbar">
                    <div class="f-toolbar__group">
                        <x-fruit::avatar>{{ $ticket['initials'] }}</x-fruit::avatar>
                        <h1 style="font-size: var(--f-text-xl)">{{ $ticket['subject'] }}</h1>
                        <x-fruit::badge>{{ $ticket['status'] === 'open' ? 'Open' : 'Closed' }}</x-fruit::badge>
                    </div>
                    <span class="f-toolbar__spacer"></span>
                    @if ($ticket['status'] === 'open')
                        <x-fruit::tooltip text="Close when the customer needs nothing else." text-id="close-help">
                            <x-fruit::button wire:click="confirmClose" aria-describedby="close-help">Close conversation</x-fruit::button>
                        </x-fruit::tooltip>
                    @endif
                </header>
                <div class="f-pane__scroll f-stack" style="--f-pane-scroll-padding: var(--f-space-4)" wire:key="conversation-{{ $ticket['id'] }}">
                    <x-fruit::description-list>
                        <div><dt>Customer</dt><dd>{{ $ticket['name'] }}</dd></div>
                        <div><dt>Email</dt><dd>{{ $ticket['email'] }}</dd></div>
                        <div><dt>Company</dt><dd>{{ $ticket['company'] }}</dd></div>
                    </x-fruit::description-list>

                    <ol class="f-stack" aria-label="Messages" style="list-style: none; padding: 0">
                        @foreach ($ticket['messages'] as $message)
                            <li>
                                <x-fruit::message layout="stacked" aria-label="Message from {{ $message['author'] }}">
                                    <x-slot:avatar><x-fruit::avatar>{{ \Illuminate\Support\Str::of($message['author'])->explode(' ')->map(fn ($word) => $word[0])->join('') }}</x-fruit::avatar></x-slot:avatar>
                                    <x-slot:author>{{ $message['author'] }}</x-slot:author>
                                    <x-slot:meta>{{ $message['author'] === $ticket['name'] ? 'Customer' : 'Reply to customer' }}</x-slot:meta>
                                    {{ $message['body'] }}
                                </x-fruit::message>
                            </li>
                        @endforeach
                    </ol>

                    @if ($ticket['status'] === 'open')
                        <x-fruit::field control-id="support-assignee" label="Assigned to">
                            <x-fruit::combobox name="assignee" wire:model.live="assignee">
                                <option value="">Unassigned</option>
                                @foreach ($this::AGENTS as $agent => $name)
                                    <option value="{{ $agent }}">{{ $name }}</option>
                                @endforeach
                            </x-fruit::combobox>
                        </x-fruit::field>

                        <x-fruit::composer wire:submit="send" aria-label="Reply">
                            <x-fruit::field control-id="support-cc" label="Cc" description="Enter or comma adds an address.">
                                <x-fruit::token-field name="cc" wire:model="cc">{{ $cc }}</x-fruit::token-field>
                            </x-fruit::field>
                            <x-fruit::field control-id="support-reply" label="Reply to {{ $ticket['name'] }}">
                                <x-fruit::autocomplete trigger="@">
                                    <x-fruit::textarea name="reply" class="f-composer__input" rows="4" wire:model="reply" />
                                    <x-slot:options>
                                        @foreach ($this::AGENTS as $agent => $name)
                                            <option value="{{ '@'.$agent }}">{{ $name }}</option>
                                        @endforeach
                                    </x-slot:options>
                                </x-fruit::autocomplete>
                            </x-fruit::field>
                            <footer class="f-composer__footer">
                                <x-fruit::button type="submit" variant="primary" wire:loading.attr="disabled" wire:target="send">Send reply</x-fruit::button>
                            </footer>
                        </x-fruit::composer>
                    @else
                        <x-fruit::alert tone="success">This conversation was closed as {{ strtolower($this::REASONS[$ticket['reason']] ?? 'resolved') }}.</x-fruit::alert>
                    @endif
                </div>
            @else
                <x-fruit::empty-state>
                    <x-slot:title><h1>No conversation selected</h1></x-slot:title>
                    Choose a conversation from the list.
                </x-fruit::empty-state>
            @endif
        </x-fruit::pane>
    </x-fruit::workspace>

    <x-fruit::dialog wire:model="closing" aria-labelledby="close-ticket-title">
        <header class="f-dialog__header"><h2 id="close-ticket-title">Close this conversation?</h2></header>
        <div class="f-dialog__body f-stack">
            <x-fruit::field control-id="close-reason" label="Reason">
                <x-fruit::select name="closeReason" wire:model.live="closeReason">
                    @foreach ($this::REASONS as $reason => $label)
                        <option value="{{ $reason }}">{{ $label }}</option>
                    @endforeach
                </x-fruit::select>
            </x-fruit::field>
            <p id="close-summary">It will move to Closed as {{ strtolower($this::REASONS[$closeReason]) }}.</p>
        </div>
        <footer class="f-dialog__footer">
            <form method="dialog"><x-fruit::button type="submit">Cancel</x-fruit::button></form>
            <x-fruit::button variant="primary" wire:click="closeTicket">Close conversation</x-fruit::button>
        </footer>
    </x-fruit::dialog>
</main>
