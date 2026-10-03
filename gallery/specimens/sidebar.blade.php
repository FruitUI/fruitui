<x-fruit::sidebar aria-label="Reference interfaces">
    <p class="f-sidebar__heading">Workspaces</p>
    <x-fruit::sidebar-group title="Examples" subtitle="Reference interfaces">
        <x-slot:icon><svg class="f-icon" aria-hidden="true"><use href="#i-folder"/></svg></x-slot:icon>
        <x-fruit::sidebar-item href="/">Mail</x-fruit::sidebar-item>
        <x-fruit::sidebar-item href="/support.html">Support</x-fruit::sidebar-item>
        <x-fruit::sidebar-item href="/chat.html">Chat</x-fruit::sidebar-item>
        <x-fruit::sidebar-item href="/admin.html">Admin</x-fruit::sidebar-item>
    </x-fruit::sidebar-group>
    <x-fruit::sidebar-item href="/components.html" current>
        Components
        <x-slot:badge>{{ 64 }}</x-slot:badge>
    </x-fruit::sidebar-item>
</x-fruit::sidebar>
