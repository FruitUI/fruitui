{{-- One confirmer per layout. confirm({ … }) and $confirm({ … }) resolve true or false. --}}
<div class="f-row" x-data="{ answer: '' }">
    <x-fruit::button variant="danger" @click="$confirm({ title: 'Delete this conversation?', message: 'It moves to Trash, where it stays for 30 days.', confirm: 'Delete', tone: 'danger' }).then(confirmed => answer = confirmed ? 'Deleted.' : 'Kept.')">Delete Conversation…</x-fruit::button>
    <x-fruit::button @click="$confirm({ title: 'Mark all as read?', confirm: 'Mark as Read' }).then(confirmed => answer = confirmed ? 'All read.' : 'Unchanged.')">Mark All as Read…</x-fruit::button>
    <p class="f-help" role="status" x-text="answer"></p>
</div>
<x-fruit::confirmer />
