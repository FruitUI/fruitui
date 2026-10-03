<x-fruit::workspace aria-label="Resizable pane preview" style="--f-workspace-columns: var(--f-preview-width, 120px) minmax(0, 1fr); --f-workspace-height: 200px">
    <x-fruit::pane id="gallery-resize-pane" class="f-pane--border-end f-pane--scroll" style="padding: 16px">Navigation</x-fruit::pane>
    <x-fruit::pane id="gallery-resize-content" class="f-pane--scroll" style="padding: 16px">Content keeps its minimum width.</x-fruit::pane>
    <x-fruit::splitter pane="gallery-resize-pane" flexible="gallery-resize-content" variable="--f-preview-width"
        :min="96" :max="240" :reserve="96" aria-label="Preview navigation" style="--f-splitter-column: 1" />
</x-fruit::workspace>
