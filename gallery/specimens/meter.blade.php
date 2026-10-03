<div class="f-stack">
    @foreach ([35, 75, 95] as $used)
        <label class="f-field">
            <span class="f-label">Storage · {{ $used }} of 100 GB</span>
            <x-fruit::meter min="0" max="100" low="60" high="85" optimum="20" :value="$used">{{ $used }} GB</x-fruit::meter>
        </label>
    @endforeach
</div>
