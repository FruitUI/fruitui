<x-fruit::workspace aria-label="Workspace preview" style="--f-workspace-columns: minmax(0, 1fr) minmax(0, 2fr); --f-workspace-rows: auto minmax(0, 1fr); --f-workspace-height: 210px">
    <header class="f-toolbar" style="grid-column: 1 / -1">Workspace</header>
    <nav class="f-pane f-pane--column f-pane--border-end f-sidebar" aria-label="Preview sections">
        <button class="f-sidebar__item" type="button" aria-current="page">Inbox</button>
        <button class="f-sidebar__item" type="button">Archive</button>
    </nav>
    <x-fruit::pane class="f-pane--scroll" style="padding: 16px"><p>Room for your content.</p></x-fruit::pane>
</x-fruit::workspace>
