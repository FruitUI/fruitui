<?php

/*
 * The Support reference interface as a Livewire 4 single-file component.
 *
 * It composes FruitUI's Blade adapters with server state: mailbox links use
 * wire:navigate, ticket rows and pagination call actions, enhanced controls
 * bind with wire:model, validation errors reach Field, and the server opens
 * dialogs and sends toasts through FruitUI\Fruit. The customer's earlier
 * conversations are a lazy island: a Skeleton placeholder until the pane
 * scrolls into view, then re-rendered on its own when another ticket opens.
 * Ticket rows have a context menu whose commands are also on the toolbar.
 * Sample tickets live in the session so each visitor can change them.
 */

use FruitUI\Fruit;
use FruitUI\Rules\Tokens;
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

    /** Earlier conversations per customer email, standing in for a slower CRM or billing lookup. */
    private const HISTORY = [
        'sophie@example.com' => [['Moving to annual billing', 'Resolved by Mia Patel', '2026-08-14'], ['Adding a second workspace', 'Resolved by Alex Morgan', '2026-05-02']],
        'emma@example.com' => [['Exporting last year’s projects', 'Resolved by Noah Williams', '2026-07-21']],
        'maya@example.com' => [['A missing invoice', 'Resolved by Alex Morgan', '2026-09-03']],
    ];

    /** The address book the Cc field searches on the server, standing in for a customer database. */
    private const CONTACTS = [
        'sophie@example.com' => 'Sophie Chen', 'jordan@example.com' => 'Jordan Lee', 'emma@example.com' => 'Emma Thompson',
        'maya@example.com' => 'Maya Rodriguez', 'oliver@example.com' => 'Oliver Park', 'ana@studio-north.example' => 'Ana Ortiz',
    ];

    public string $mailbox = 'all';
    public string $search = '';
    public ?int $openId = null;
    public string $assignee = '';
    public string $cc = '';
    public string $ccSearch = '';
    public string $mergeInto = '';
    public string $mergeSearch = '';
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

    /** Cc suggestions: contacts whose name or address contains the text being typed. */
    #[Computed]
    public function ccMatches(): array
    {
        $query = mb_strtolower(trim($this->ccSearch));

        return $query === '' ? [] : array_filter(
            self::CONTACTS,
            fn (string $name, string $email) => str_contains(mb_strtolower("{$name} {$email}"), $query),
            ARRAY_FILTER_USE_BOTH,
        );
    }

    /**
     * Other conversations matching the merge search, by number, subject or customer. The current
     * choice stays among the options, so the select keeps its value while results change.
     *
     * @return array<int, string>
     */
    #[Computed]
    public function mergeMatches(): array
    {
        $query = mb_strtolower(trim($this->mergeSearch));
        $label = fn (array $ticket) => "#{$ticket['id']} {$ticket['subject']} · {$ticket['name']}";

        return collect($this->store())
            ->except($this->openId)
            ->filter(fn (array $ticket) => (string) $ticket['id'] === $this->mergeInto
                || ($query !== '' && str_contains(mb_strtolower($label($ticket)), ltrim($query, '#'))))
            ->map($label)
            ->all();
    }

    public function merge(): void
    {
        $this->validate(['mergeInto' => ['required', 'in:'.implode(',', array_keys($this->mergeMatches))]], ['mergeInto.required' => 'Choose a conversation to merge into.'], ['mergeInto' => 'conversation']);
        Fruit::toast("Conversation #{$this->openId} merged into #{$this->mergeInto}.");
        $this->mergeInto = '';
        $this->mergeSearch = '';
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
        $this->mergeInto = '';
        $this->mergeSearch = '';
        $this->resetValidation();
        // Islands are skipped on ordinary updates; this one follows the open ticket.
        $this->renderIsland('history');
    }

    public function updatedAssignee(string $assignee): void
    {
        $this->assignee = array_key_exists($assignee, self::AGENTS) ? $assignee : '';
        // The thread records the change as an event between messages.
        $event = $this->assignee === '' ? 'Alex Morgan unassigned this' : 'Alex Morgan assigned this to '.self::AGENTS[$this->assignee];
        $this->change(fn (array $ticket) => [...$ticket, 'assignee' => $this->assignee, 'messages' => [...$ticket['messages'], ['event' => $event, 'time' => now()->format('g:i A')]]]);
        Fruit::toast($this->assignee === '' ? 'Conversation unassigned.' : 'Assigned to '.self::AGENTS[$this->assignee].'.');
    }

    public function send(): void
    {
        $this->validate([
            'reply' => ['required', 'string', 'min:3'],
            'cc' => ['nullable', new Tokens('email')],
        ], ['reply.required' => 'Write a reply before sending.', 'reply.min' => 'Write at least three characters.'], ['cc' => 'Cc']);
        $this->change(fn (array $ticket) => [...$ticket, 'cc' => $this->cc, 'messages' => [...$ticket['messages'], ['author' => 'Alex Morgan', 'body' => $this->reply]]]);
        $this->reply = '';
        Fruit::toast('Reply sent to '.$this->ticket['name'].'.');
    }

    /** Quote a customer message or reply into the reply draft; internal notes are never quoted. */
    public function quote(int $index): void
    {
        $message = $this->ticket['messages'][$index] ?? null;
        if (! $message || isset($message['event'])) {
            return;
        }
        $quoted = collect(preg_split('/\R/', $message['body']))->map(fn ($line) => "> {$line}")->implode("\n");
        $this->reply = ltrim(rtrim($this->reply)."\n\n").$quoted."\n\n";
        $this->js("document.getElementById('support-reply')?.focus()");
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
        $this->closeMany($this->selected);
        $this->selected = [];
    }

    public function closeOne(int $id): void
    {
        $this->closeMany([$id]);
        $this->selected = array_values(array_diff($this->selected, [(string) $id]));
    }

    private function closeMany(array $ids): void
    {
        $tickets = $this->store();
        $closed = 0;
        foreach ($ids as $id) {
            if (($tickets[(int) $id]['status'] ?? null) === 'open') {
                $tickets[(int) $id] = [...$tickets[(int) $id], 'status' => 'closed', 'reason' => 'resolved'];
                $closed++;
            }
        }
        session(['fruit-support.tickets' => $tickets]);
        unset($this->ticket, $this->tickets, $this->counts);
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
    public function history(): array
    {
        return self::HISTORY[$this->ticket['email'] ?? ''] ?? [];
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
                                {{-- The same commands are on the toolbar and the selection bar. --}}
                                <x-fruit::context-menu title="Conversation actions">
                                    <x-fruit::menu-item wire:click="open({{ $item['id'] }})">Open conversation</x-fruit::menu-item>
                                    @if ($item['status'] === 'open')
                                        <x-fruit::menu-item wire:click="closeOne({{ $item['id'] }})">Close conversation</x-fruit::menu-item>
                                    @endif
                                </x-fruit::context-menu>
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
                <div class="f-pane__scroll f-stack" style="--f-pane-scroll-padding: var(--f-space-4)">
                    <x-fruit::description-list>
                        <div><dt>Customer</dt><dd>{{ $ticket['name'] }}</dd></div>
                        <div><dt>Email</dt><dd>{{ $ticket['email'] }}</dd></div>
                        <div><dt>Company</dt><dd>{{ $ticket['company'] }}</dd></div>
                    </x-fruit::description-list>

                    @island(name: 'history', lazy: true)
                        @placeholder
                            <section class="f-stack" aria-label="Earlier conversations" aria-busy="true">
                                <x-fruit::skeleton :lines="2" />
                            </section>
                        @endplaceholder
                        <section class="f-stack" aria-labelledby="history-title">
                            <h2 id="history-title" style="font-size: var(--f-text-md)">Earlier conversations</h2>
                            @if ($this->history === [])
                                <p class="f-help">No earlier conversations with {{ $this->ticket['name'] ?? 'this customer' }}.</p>
                            @else
                                <x-fruit::timeline aria-labelledby="history-title">
                                    @foreach ($this->history as [$subject, $outcome, $date])
                                        <x-fruit::timeline-item :datetime="$date">
                                            {{ $subject }}
                                            <x-slot:detail>{{ $outcome }}</x-slot:detail>
                                            <x-slot:time>{{ \Illuminate\Support\Carbon::parse($date)->format('M j') }}</x-slot:time>
                                        </x-fruit::timeline-item>
                                    @endforeach
                                </x-fruit::timeline>
                            @endif
                        </section>
                    @endisland

                    {{-- Keyed per ticket so enhanced controls start fresh; islands stay outside a changing key. --}}
                    <div class="f-stack" wire:key="conversation-{{ $ticket['id'] }}">
                        <x-fruit::thread aria-label="Messages">
                            @foreach ($ticket['messages'] as $index => $message)
                                <li>
                                    @if (isset($message['event']))
                                        <x-fruit::message-event>
                                            {{ $message['event'] }}
                                            <x-slot:time>{{ $message['time'] }}</x-slot:time>
                                        </x-fruit::message-event>
                                    @else
                                    <x-fruit::message layout="stacked" :direction="$message['author'] === $ticket['name'] ? 'incoming' : 'outgoing'" aria-label="Message from {{ $message['author'] }}">
                                        <x-slot:avatar><x-fruit::avatar>{{ \Illuminate\Support\Str::of($message['author'])->explode(' ')->map(fn ($word) => $word[0])->join('') }}</x-fruit::avatar></x-slot:avatar>
                                        <x-slot:author>{{ $message['author'] }}</x-slot:author>
                                        <x-slot:meta>{{ $message['author'] === $ticket['name'] ? 'Customer' : 'Reply to customer' }}</x-slot:meta>
                                        {{ $message['body'] }}
                                        @if ($ticket['status'] === 'open')
                                            <x-slot:actions>
                                                <x-fruit::button variant="ghost" class="f-button--icon" wire:click="quote({{ $index }})" aria-label="Quote {{ $message['author'] }} in reply">
                                                    <svg class="f-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v6"/></svg>
                                                </x-fruit::button>
                                            </x-slot:actions>
                                        @endif
                                    </x-fruit::message>
                                    @endif
                                </li>
                            @endforeach
                        </x-fruit::thread>

                        @if ($ticket['status'] === 'open')
                            <x-fruit::field control-id="support-assignee" label="Assigned to">
                                <x-fruit::combobox name="assignee" wire:model.live="assignee">
                                    <option value="">Unassigned</option>
                                    @foreach ($this::AGENTS as $agent => $name)
                                        <option value="{{ $agent }}">{{ $name }}</option>
                                    @endforeach
                                </x-fruit::combobox>
                            </x-fruit::field>

                            {{-- Server search: each query re-renders the options, keeping the current choice. --}}
                            <form class="f-stack" wire:submit="merge" aria-label="Merge">
                                <x-fruit::field control-id="support-merge" label="Merge into" description="Search by number, subject or customer.">
                                    <x-fruit::combobox name="mergeInto" wire:model="mergeInto" search="server" placeholder="Search conversations"
                                        x-on:fruit-suggest.debounce.200ms="$wire.set('mergeSearch', $event.detail.query)">
                                        <option value="" hidden></option>
                                        @foreach ($this->mergeMatches as $id => $label)
                                            <option value="{{ $id }}" @selected((string) $id === $mergeInto)>{{ $label }}</option>
                                        @endforeach
                                    </x-fruit::combobox>
                                </x-fruit::field>
                                <div><x-fruit::button type="submit">Merge</x-fruit::button></div>
                            </form>

                            <x-fruit::composer wire:submit="send" aria-label="Reply">
                                <x-fruit::field control-id="support-cc" label="Cc" description="Enter or comma adds an address.">
                                    {{-- The server searches contacts as the address is typed; options follow each re-render. --}}
                                    <x-fruit::token-field name="cc" wire:model="cc" search="server" x-on:fruit-suggest.debounce.200ms="$wire.set('ccSearch', $event.detail.query)">
                                        {{ $cc }}
                                        <x-slot:options>
                                            @foreach ($this->ccMatches as $email => $name)
                                                <option value="{{ $email }}">{{ $name }}</option>
                                            @endforeach
                                        </x-slot:options>
                                    </x-fruit::token-field>
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

    <x-fruit::command-palette name="support-commands" shortcut="k" label="Go to" placeholder="Mailboxes and actions">
        <x-fruit::command-group label="Mailboxes">
            @foreach ($this::MAILBOXES as $key => $label)
                <x-fruit::command-link :href="url('/support/'.$key)" wire:navigate>{{ $label }}</x-fruit::command-link>
            @endforeach
        </x-fruit::command-group>
        @if ($this->ticket && $this->ticket['status'] === 'open')
            <x-fruit::command-group label="Conversation">
                <x-fruit::command wire:click="confirmClose">Close conversation…</x-fruit::command>
            </x-fruit::command-group>
        @endif
    </x-fruit::command-palette>
</main>
