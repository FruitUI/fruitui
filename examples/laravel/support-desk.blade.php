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
 * Conversations from a chat channel show in the Chat view: oldest first in a
 * history that follows new messages, with the composer docked below it.
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

    public const MAILBOXES = ['all' => 'All Open', 'unassigned' => 'Unassigned', 'mine' => 'Assigned to Me', 'closed' => 'Closed'];
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
    public string $bcc = '';
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
        $this->bcc = $ticket['bcc'] ?? '';
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
            'bcc' => ['nullable', new Tokens('email')],
        ], ['reply.required' => 'Write a reply before sending.', 'reply.min' => 'Write at least three characters.'], ['cc' => 'Cc', 'bcc' => 'Bcc']);
        $this->change(fn (array $ticket) => [...$ticket, 'cc' => $this->cc, 'bcc' => $this->bcc, 'messages' => [...$ticket['messages'], ['author' => 'Alex Morgan', 'body' => $this->reply, 'time' => now()->format('g:i A')]]]);
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

    public function assignSelected(string $agent): void
    {
        abort_unless($agent === '' || array_key_exists($agent, self::AGENTS), 422);
        $tickets = $this->store();
        foreach ($this->selected as $id) {
            if (isset($tickets[(int) $id])) {
                $tickets[(int) $id]['assignee'] = $agent;
            }
        }
        session(['fruit-support.tickets' => $tickets]);
        unset($this->ticket, $this->tickets, $this->counts);
        if (isset($tickets[$this->openId])) {
            $this->assignee = $tickets[$this->openId]['assignee'];
        }
        $count = count($this->selected);
        $this->selected = [];
        Fruit::toast(trans_choice('{1} :count conversation|[2,*] :count conversations', $count, ['count' => $count]).' '.($agent === '' ? 'unassigned.' : 'assigned to '.self::AGENTS[$agent].'.'));
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
        if ($tickets = session('fruit-support.tickets')) {
            return $tickets;
        }
        $tickets = collect([
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
            'channel' => 'email', 'messages' => [['author' => $row[1], 'body' => $row[6]]],
        ]])->all();
        // A conversation from a chat channel: short messages, shown in the Chat view.
        $tickets[1036] = [...$tickets[1036], 'channel' => 'chat', 'messages' => [
            ['author' => 'Lena Wilson', 'body' => 'Hi! Since Monday new events no longer appear in our shared calendar.', 'time' => '9:02 AM'],
            ['author' => 'Alex Morgan', 'body' => 'Hi Lena, sorry about that. Is it every calendar, or only the shared one?', 'time' => '9:05 AM'],
            ['author' => 'Lena Wilson', 'body' => 'Only the shared one. Our personal calendars are fine.', 'time' => '9:11 AM'],
            ['author' => 'Alex Morgan', 'body' => 'Thanks. Do the events show up on the web, or are they missing everywhere?', 'time' => '9:12 AM'],
            ['author' => 'Lena Wilson', 'body' => 'They’re on the web. Just not in Outlook or on our phones.', 'time' => '9:13 AM'],
            ['author' => 'Alex Morgan', 'body' => 'That narrows it down to the calendar feed. Let me ask Noah, who looks after sync.', 'time' => '9:13 AM'],
            ['event' => 'Alex Morgan assigned this to Noah Williams', 'time' => '9:14 AM'],
            ['author' => 'Noah Williams', 'body' => 'Thanks, Lena. Could you try removing and re-adding the shared calendar under Settings › Calendars?', 'time' => '9:20 AM'],
            ['author' => 'Lena Wilson', 'body' => 'Done. The events from today are back, but last week’s are still missing.', 'time' => '9:31 AM'],
        ]];

        return $tickets;
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
                <x-fruit::field control-id="support-search" label="Search Conversations">
                    <x-fruit::input type="search" wire:model.live.debounce.200ms="search" />
                </x-fruit::field>
            </div>
            {{-- The list header: view tools, or while conversations are selected, the selection bar in their place.
                 Cmd/Ctrl+click and Shift+click select rows; Select shows the checkboxes for touch. --}}
            <x-fruit::list-header>
                <span>{{ $this->tickets->total() }} conversations · Newest first</span>
                <span class="f-toolbar__spacer"></span>
                <x-fruit::button variant="ghost" size="small" data-fruit-select-toggle aria-controls="support-tickets" aria-pressed="false">Select</x-fruit::button>
                <x-slot:selection>
                    <x-fruit::selection-bar :count="count($selected)" aria-label="Selected conversations">
                        <x-fruit::menu title="Assign selected conversations">
                            <x-slot:trigger class="f-button--ghost f-button--icon" aria-label="Assign" title="Assign"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></x-slot:trigger>
                            <x-fruit::menu-item wire:click="assignSelected('')">Unassigned</x-fruit::menu-item>
                            @foreach ($this::AGENTS as $agent => $name)
                                <x-fruit::menu-item wire:click="assignSelected('{{ $agent }}')">{{ $name }}</x-fruit::menu-item>
                            @endforeach
                        </x-fruit::menu>
                        <x-fruit::button variant="ghost" class="f-button--icon" wire:click="closeSelected" aria-label="Close Selected" title="Close Selected"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></x-fruit::button>
                        <x-fruit::button variant="ghost" class="f-button--icon" wire:click="$set('selected', [])" aria-label="Clear Selection" title="Clear Selection"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></x-fruit::button>
                    </x-fruit::selection-bar>
                </x-slot:selection>
            </x-fruit::list-header>
            <div class="f-pane__scroll">
                @if ($this->tickets->isEmpty())
                    <x-fruit::empty-state>
                        <x-slot:title><h2>No Conversations</h2></x-slot:title>
                        {{ $search === '' ? 'This mailbox is empty.' : 'Try another search.' }}
                    </x-fruit::empty-state>
                @else
                    <x-fruit::item-list id="support-tickets" selection="multiple" aria-label="{{ $this::MAILBOXES[$mailbox] }}">
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
                                    <x-fruit::menu-item wire:click="open({{ $item['id'] }})">Open Conversation</x-fruit::menu-item>
                                    @if ($item['status'] === 'open')
                                        <x-fruit::menu-item wire:click="closeOne({{ $item['id'] }})">Close Conversation</x-fruit::menu-item>
                                    @endif
                                </x-fruit::context-menu>
                            </li>
                        @endforeach
                    </x-fruit::item-list>
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
                            <x-fruit::button wire:click="confirmClose" aria-describedby="close-help">Close Conversation</x-fruit::button>
                        </x-fruit::tooltip>
                    @endif
                </header>
                @if (($ticket['channel'] ?? 'email') === 'chat')
                    {{-- The Chat view: oldest first in a history that opens at the newest message and follows
                         new ones; the composer stays docked below it. Keyed per ticket, so each opens at its newest. --}}
                    <x-fruit::history aria-label="Chat with {{ $ticket['name'] }}" wire:key="chat-{{ $ticket['id'] }}" style="--f-pane-scroll-padding: var(--f-space-4)">
                        <x-fruit::thread aria-label="Messages" density="compact">
                            @foreach ($ticket['messages'] as $index => $message)
                                <li wire:key="message-{{ $index }}">
                                    @if (isset($message['event']))
                                        <x-fruit::message-event>
                                            {{ $message['event'] }}
                                            <x-slot:time>{{ $message['time'] }}</x-slot:time>
                                        </x-fruit::message-event>
                                    @else
                                        <x-fruit::message :direction="$message['author'] === $ticket['name'] ? 'incoming' : 'outgoing'" :mine="$message['author'] === 'Alex Morgan'" aria-label="Message from {{ $message['author'] }}">
                                            <x-slot:avatar><x-fruit::avatar>{{ \Illuminate\Support\Str::of($message['author'])->explode(' ')->map(fn ($word) => $word[0])->join('') }}</x-fruit::avatar></x-slot:avatar>
                                            <x-slot:author>{{ $message['author'] }}</x-slot:author>
                                            <x-slot:meta>{{ $message['author'] === $ticket['name'] ? 'Customer' : 'Reply to Customer' }}</x-slot:meta>
                                            @isset($message['time'])
                                                <x-slot:time>{{ $message['time'] }}</x-slot:time>
                                            @endisset
                                            {{ $message['body'] }}
                                        </x-fruit::message>
                                    @endif
                                </li>
                            @endforeach
                        </x-fruit::thread>
                    </x-fruit::history>
                    @if ($ticket['status'] === 'open')
                        <x-fruit::composer wire:submit="send" aria-label="Reply" wire:key="chat-composer-{{ $ticket['id'] }}">
                            <label class="f-sr-only" for="support-chat-reply">Message {{ $ticket['name'] }}</label>
                            <x-fruit::textarea id="support-chat-reply" name="reply" class="f-composer__input" rows="2" wire:model="reply" placeholder="Message {{ $ticket['name'] }}"
                                :aria-invalid="$errors->has('reply') ? 'true' : null" :aria-describedby="$errors->has('reply') ? 'support-chat-help support-chat-error' : 'support-chat-help'"
                                x-on:keydown.enter="if (!$event.shiftKey && !$event.isComposing) { $event.preventDefault(); $el.form.requestSubmit() }" />
                            @error('reply')<p class="f-error" id="support-chat-error">{{ $message }}</p>@enderror
                            <footer class="f-composer__footer">
                                <span class="f-help" id="support-chat-help">Enter to send · Shift + Enter for a new line</span>
                                <x-fruit::button type="submit" variant="primary">Send</x-fruit::button>
                            </footer>
                        </x-fruit::composer>
                    @else
                        <div style="padding: var(--f-space-4)"><x-fruit::alert tone="success">This conversation was closed as {{ strtolower($this::REASONS[$ticket['reason']] ?? 'resolved') }}.</x-fruit::alert></div>
                    @endif
                @else
                <div class="f-pane__scroll f-stack" style="--f-pane-scroll-padding: var(--f-space-4)">
                    <x-fruit::description-list>
                        <div><dt>Customer</dt><dd>{{ $ticket['name'] }}</dd></div>
                        <div><dt>Email</dt><dd>{{ $ticket['email'] }}</dd></div>
                        <div><dt>Company</dt><dd>{{ $ticket['company'] }}</dd></div>
                    </x-fruit::description-list>

                    @island(name: 'history', lazy: true)
                        @placeholder
                            <section class="f-stack" aria-label="Earlier Conversations" aria-busy="true">
                                <x-fruit::skeleton :lines="2" />
                            </section>
                        @endplaceholder
                        <section class="f-stack" aria-labelledby="history-title">
                            <h2 id="history-title" style="font-size: var(--f-text-md)">Earlier Conversations</h2>
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
                        @if ($ticket['status'] === 'open')
                            <x-fruit::field control-id="support-assignee" label="Assigned To">
                                <x-fruit::combobox name="assignee" wire:model.live="assignee">
                                    <option value="">Unassigned</option>
                                    @foreach ($this::AGENTS as $agent => $name)
                                        <option value="{{ $agent }}">{{ $name }}</option>
                                    @endforeach
                                </x-fruit::combobox>
                            </x-fruit::field>

                            {{-- Server search: each query re-renders the options, keeping the current choice. --}}
                            <form class="f-stack" wire:submit="merge" aria-label="Merge">
                                <x-fruit::field control-id="support-merge" label="Merge Into" description="Search by number, subject or customer.">
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

                            <x-fruit::composer wire:submit="send" placement="top" aria-label="Reply">
                                {{-- Mail-style recipient rows; Cc and Bcc show on demand, or when they already hold addresses. --}}
                                <div x-data="{ copies: @js($cc !== '' || $bcc !== '' || $errors->hasAny(['cc', 'bcc'])) }">
                                    <x-fruit::field control-id="support-to" label="To" layout="inline">
                                        <x-fruit::input type="email" value="{{ $ticket['email'] }}" readonly />
                                        <x-fruit::button variant="ghost" size="small" x-show="!copies" aria-controls="support-cc-row support-bcc-row" aria-expanded="false"
                                            x-on:click="copies = true; $nextTick(() => $root.querySelector('#support-cc-row input')?.focus())">Cc/Bcc</x-fruit::button>
                                    </x-fruit::field>
                                    <x-fruit::field control-id="support-cc" label="Cc" layout="inline" id="support-cc-row" x-show="copies">
                                        {{-- The server searches contacts as the address is typed; options follow each re-render. --}}
                                        <x-fruit::token-field name="cc" wire:model="cc" placeholder="Add a recipient" search="server" x-on:fruit-suggest.debounce.200ms="$wire.set('ccSearch', $event.detail.query)">
                                            {{ $cc }}
                                            <x-slot:options>
                                                @foreach ($this->ccMatches as $email => $name)
                                                    <option value="{{ $email }}">{{ $name }}</option>
                                                @endforeach
                                            </x-slot:options>
                                        </x-fruit::token-field>
                                    </x-fruit::field>
                                    <x-fruit::field control-id="support-bcc" label="Bcc" layout="inline" id="support-bcc-row" x-show="copies">
                                        <x-fruit::token-field name="bcc" wire:model="bcc" placeholder="Add a recipient">{{ $bcc }}</x-fruit::token-field>
                                    </x-fruit::field>
                                </div>
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
                                    <x-fruit::button type="submit" variant="primary" wire:loading.attr="disabled" wire:target="send">Send Reply</x-fruit::button>
                                </footer>
                            </x-fruit::composer>
                        @else
                            <x-fruit::alert tone="success">This conversation was closed as {{ strtolower($this::REASONS[$ticket['reason']] ?? 'resolved') }}.</x-fruit::alert>
                        @endif

                        {{-- Newest first, below the composer; the keys keep each message's place for quoting. --}}
                        <x-fruit::thread aria-label="Messages">
                            @foreach (array_reverse($ticket['messages'], true) as $index => $message)
                                <li>
                                    @if (isset($message['event']))
                                        <x-fruit::message-event>
                                            {{ $message['event'] }}
                                            <x-slot:time>{{ $message['time'] }}</x-slot:time>
                                        </x-fruit::message-event>
                                    @else
                                    <x-fruit::message layout="stacked" :direction="$message['author'] === $ticket['name'] ? 'incoming' : 'outgoing'" :mine="$message['author'] === 'Alex Morgan'" aria-label="Message from {{ $message['author'] }}">
                                        <x-slot:avatar><x-fruit::avatar>{{ \Illuminate\Support\Str::of($message['author'])->explode(' ')->map(fn ($word) => $word[0])->join('') }}</x-fruit::avatar></x-slot:avatar>
                                        <x-slot:author>{{ $message['author'] }}</x-slot:author>
                                        <x-slot:meta>{{ $message['author'] === $ticket['name'] ? 'Customer' : 'Reply to Customer' }}</x-slot:meta>
                                        {{ $message['body'] }}
                                        @if ($ticket['status'] === 'open')
                                            <x-slot:actions>
                                                <x-fruit::button variant="ghost" class="f-button--icon" wire:click="quote({{ $index }})" aria-label="Quote {{ $message['author'] }} in reply">
                                                    <svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/></svg>
                                                </x-fruit::button>
                                            </x-slot:actions>
                                        @endif
                                    </x-fruit::message>
                                    @endif
                                </li>
                            @endforeach
                        </x-fruit::thread>
                    </div>
                </div>
                @endif
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
            <x-fruit::button variant="primary" wire:click="closeTicket">Close Conversation</x-fruit::button>
        </footer>
    </x-fruit::dialog>

    <x-fruit::command-palette name="support-commands" shortcut="k" label="Go To" placeholder="Mailboxes and actions">
        <x-fruit::command-group label="Mailboxes">
            @foreach ($this::MAILBOXES as $key => $label)
                <x-fruit::command-link :href="url('/support/'.$key)" wire:navigate>{{ $label }}</x-fruit::command-link>
            @endforeach
        </x-fruit::command-group>
        @if ($this->ticket && $this->ticket['status'] === 'open')
            <x-fruit::command-group label="Conversation">
                <x-fruit::command wire:click="confirmClose">Close Conversation…</x-fruit::command>
            </x-fruit::command-group>
        @endif
    </x-fruit::command-palette>
</main>
