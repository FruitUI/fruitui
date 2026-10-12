{{-- In a narrow place (a phone, a Drill-Down level) each row is a record: its row header, then each value
     named by its data-label. Nothing scrolls sideways. --}}
<div class="f-table__scroll" tabindex="0" role="region" aria-label="Team member table">
    <x-fruit::table>
        <caption>Team Members</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Last Seen</th></tr></thead>
        <tbody>
            @foreach (['Sophie Chen' => ['Designer', 'Today'], 'Alex Morgan' => ['Administrator', 'Yesterday']] as $name => [$role, $seen])
                <tr><th scope="row">{{ $name }}</th><td data-label="Role">{{ $role }}</td><td data-label="Last Seen">{{ $seen }}</td></tr>
            @endforeach
        </tbody>
    </x-fruit::table>
</div>
