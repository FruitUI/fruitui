{{-- Laravel paginators render this view; inside Livewire it calls Livewire's page actions. --}}
@php($customers = new Illuminate\Pagination\LengthAwarePaginator(range(1, 10), 24, 10, 1, ['path' => '/admin.html']))
{{ $customers->fragment('/customers')->links('fruit::pagination.default') }}

{{-- Or compose your own page controls. --}}
<x-fruit::pagination aria-label="Activity pages">
    <span>Newest Activity</span>
    <div class="f-pagination__controls"><a class="f-button" href="/admin.html#/customers">Older Activity</a></div>
</x-fruit::pagination>
