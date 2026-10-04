{{-- An AI reply draft. The app drives the state: aria-busy while it works (a skeleton stands in), a status
     line for the queue, slowness or failure, then the draft, its translation, actions and details. --}}
<div x-data="{
    state: 'done', open: true,
    draft() { this.state = 'queued'; setTimeout(() => this.state = 'drafting', 900); setTimeout(() => this.state = 'done', 2400); },
}">
    <x-fruit::suggestion title="AI draft" meta="English · High confidence" x-show="open" x-bind:aria-busy="state !== 'done' ? 'true' : 'false'">
        <x-slot:dismiss><x-fruit::button variant="ghost" class="f-button--icon" x-on:click="open = false" aria-label="Dismiss draft" title="Dismiss"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></x-fruit::button></x-slot:dismiss>
        <x-slot:status tone="working" x-show="state !== 'done'" role="status"><span x-text="state === 'queued' ? 'Waiting in the queue…' : 'Drafting…'">Drafting…</span></x-slot:status>
        <p>Hi Sophie,</p>
        <p>I’ve sent Ana a fresh invite link. It works for seven days, and she can join as a guest without a paid seat.</p>
        <p>Alex</p>
        <x-slot:translation lang="nl"><p>Hoi Sophie,</p><p>Ik heb Ana een nieuwe uitnodigingslink gestuurd. Die werkt zeven dagen, en ze kan als gast meedoen zonder betaalde plek.</p><p>Alex</p></x-slot:translation>
        <x-slot:actions>
            <x-fruit::button variant="primary" x-on:click="$toast('Draft inserted into the reply.')">Insert into Reply</x-fruit::button>
            <x-fruit::button x-on:click="draft()">Draft Again</x-fruit::button>
        </x-slot:actions>
        <x-slot:details>
            <section>
                <h4>Notes</h4>
                <ul>
                    <li>Guest invites expire after seven days.</li>
                    <li>Sophie’s plan includes unlimited guests.</li>
                </ul>
            </section>
            <section>
                <h4>Documentation used</h4>
                <ul class="f-suggestion__sources">
                    <li><a href="https://forma.example/help/guests">Inviting guests to a workspace</a><small>forma.example/help</small></li>
                    <li><a href="https://forma.example/help/plans/team">What the Team plan includes</a><small>forma.example/help</small></li>
                </ul>
            </section>
        </x-slot:details>
    </x-fruit::suggestion>
    <x-fruit::button x-show="!open" x-on:click="open = true">Show the draft again</x-fruit::button>
</div>
