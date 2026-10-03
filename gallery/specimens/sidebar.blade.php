<x-fruit::sidebar aria-label="Reference interfaces">
    <x-slot:header><x-fruit::avatar>F</x-fruit::avatar><span><strong>FruitUI</strong><small>Reference interfaces</small></span></x-slot:header>
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
    <x-slot:footer><x-fruit::avatar>AM</x-fruit::avatar><span><strong>Alex Morgan</strong><small>Support team</small></span></x-slot:footer>
</x-fruit::sidebar>
