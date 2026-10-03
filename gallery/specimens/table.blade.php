<div class="f-table__scroll" tabindex="0" role="region" aria-label="Team member table">
    <x-fruit::table>
        <caption>Team members</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead>
        <tbody>
            @foreach (['Sophie Chen' => 'Designer', 'Alex Morgan' => 'Administrator'] as $name => $role)
                <tr><th scope="row">{{ $name }}</th><td>{{ $role }}</td></tr>
            @endforeach
        </tbody>
    </x-fruit::table>
</div>
